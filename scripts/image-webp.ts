#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

type CliMode = 'staged' | 'all' | 'files'

type CliOptions = {
  mode: CliMode
  files: string[]
  stage: boolean
  quality: number
  minSavingBytes: number
}

type Replacement = {
  oldRel: string
  newRel: string
}

type OptimizeStats = {
  scanned: number
  converted: number
  skipped: number
  originalBytes: number
  webpBytes: number
  markdownRewrites: number
  warnings: string[]
  replacements: Replacement[]
}

const DEFAULT_QUALITY = 82
const DEFAULT_MIN_SAVING_BYTES = 128 * 1024
const IMAGE_EXT_RE = /\.(?:png|jpe?g)$/i
const MARKDOWN_EXT_RE = /\.md$/i
const CONVERTIBLE_ROOT = 'docs/'
const EXCLUDED_PREFIXES = [
  '.local/',
  'docs/.vuepress/',
  'docs/.vuepress/.cache/',
  'docs/.vuepress/.temp/',
  'docs/.vuepress/dist/',
]

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const repoRoot = resolveRepoRoot()
  const stats = await optimizeImages(repoRoot, options)

  const savedBytes = Math.max(0, stats.originalBytes - stats.webpBytes)
  const savedRate = stats.originalBytes > 0
    ? ((savedBytes / stats.originalBytes) * 100).toFixed(1)
    : '0.0'

  console.info(
    `image-webp: scanned ${stats.scanned}, converted ${stats.converted}, skipped ${stats.skipped}, `
    + `${formatBytes(stats.originalBytes)} -> ${formatBytes(stats.webpBytes)}, saved ${savedRate}%`,
  )

  if (stats.markdownRewrites > 0) {
    console.info(`image-webp: rewrote ${stats.markdownRewrites} markdown files`)
  }

  for (const warning of stats.warnings) {
    console.warn(`image-webp: warning: ${warning}`)
  }
}

function parseArgs(argv: string[]): CliOptions {
  let mode: CliMode | undefined
  let stage = false
  let quality = DEFAULT_QUALITY
  let minSavingBytes = DEFAULT_MIN_SAVING_BYTES
  const files: string[] = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--staged') {
      mode = 'staged'
      continue
    }
    if (arg === '--all') {
      mode = 'all'
      continue
    }
    if (arg === '--stage') {
      stage = true
      continue
    }
    if (arg === '--files') {
      mode = 'files'
      while (argv[index + 1] && !argv[index + 1].startsWith('--')) {
        files.push(argv[index + 1])
        index += 1
      }
      continue
    }
    if (arg === '--quality') {
      quality = parseNumberArg(argv[index + 1], '--quality')
      index += 1
      continue
    }
    if (arg === '--min-saving-bytes') {
      minSavingBytes = parseNumberArg(argv[index + 1], '--min-saving-bytes')
      index += 1
      continue
    }
    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!mode) mode = 'staged'
  if (mode === 'files' && files.length === 0) {
    throw new Error('--files requires at least one file path')
  }
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error('--quality must be an integer between 1 and 100')
  }
  if (!Number.isInteger(minSavingBytes) || minSavingBytes < 0) {
    throw new Error('--min-saving-bytes must be a non-negative integer')
  }

  return { mode, files, stage, quality, minSavingBytes }
}

function parseNumberArg(value: string | undefined, name: string): number {
  if (!value) throw new Error(`${name} requires a value`)
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a number`)
  return parsed
}

function printUsage(): void {
  console.log(`
Usage:
  node .local/scripts/image-webp.js --staged --stage
  node .local/scripts/image-webp.js --all
  node .local/scripts/image-webp.js --files docs/post/image.png --stage

Options:
  --quality <1-100>             WebP quality. Default: ${DEFAULT_QUALITY}
  --min-saving-bytes <bytes>    Minimum byte savings required to replace a file. Default: ${DEFAULT_MIN_SAVING_BYTES}
  --stage                       Update the Git index for converted files and rewritten markdown.
`)
}

async function optimizeImages(repoRoot: string, options: CliOptions): Promise<OptimizeStats> {
  const candidates = await getCandidateImageFiles(repoRoot, options)
  const replacements: Replacement[] = []
  const warnings: string[] = []
  let originalBytes = 0
  let webpBytes = 0
  let converted = 0
  let skipped = 0

  for (const oldRel of candidates) {
    const oldAbs = path.join(repoRoot, oldRel)
    const newRel = replaceExtWithWebp(oldRel)
    const newAbs = path.join(repoRoot, newRel)

    try {
      const input = await fs.readFile(oldAbs)
      const output = await sharp(input, { failOn: 'none' })
        .rotate()
        .webp({ quality: options.quality })
        .toBuffer()
      const savedBytes = input.byteLength - output.byteLength

      if (savedBytes < options.minSavingBytes || output.byteLength >= input.byteLength) {
        skipped += 1
        continue
      }

      await fs.mkdir(path.dirname(newAbs), { recursive: true })
      await fs.writeFile(newAbs, output)
      await fs.rm(oldAbs, { force: true })

      replacements.push({ oldRel, newRel })
      originalBytes += input.byteLength
      webpBytes += output.byteLength
      converted += 1
    } catch (error) {
      skipped += 1
      warnings.push(`skip ${oldRel}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const rewrittenMarkdown = await rewriteMarkdownFiles(repoRoot, replacements)

  if (options.stage && replacements.length > 0) {
    stageImageChanges(repoRoot, replacements, rewrittenMarkdown)
  }

  return {
    scanned: candidates.length,
    converted,
    skipped,
    originalBytes,
    webpBytes,
    markdownRewrites: rewrittenMarkdown.length,
    warnings,
    replacements,
  }
}

async function getCandidateImageFiles(repoRoot: string, options: CliOptions): Promise<string[]> {
  const rawFiles = options.mode === 'files'
    ? options.files
    : options.mode === 'all'
      ? runGit(repoRoot, ['ls-files', 'docs']).split(/\r?\n/)
      : runGit(repoRoot, ['diff', '--cached', '--name-only', '--diff-filter=ACMR']).split(/\r?\n/)

  const candidates = rawFiles
    .map(normalizePath)
    .filter((filePath) => filePath && isConvertibleImagePath(filePath))

  return [...new Set(candidates)].sort()
}

function stageImageChanges(repoRoot: string, replacements: Replacement[], markdownFiles: string[]): void {
  const removed = replacements.map((item) => item.oldRel)
  const added = [
    ...replacements.map((item) => item.newRel),
    ...markdownFiles,
  ]

  if (removed.length > 0) {
    runGit(repoRoot, ['rm', '--cached', '--quiet', '--ignore-unmatch', '--', ...removed])
  }
  if (added.length > 0) {
    runGit(repoRoot, ['add', '--', ...added])
  }
}

async function rewriteMarkdownFiles(repoRoot: string, replacements: Replacement[]): Promise<string[]> {
  if (replacements.length === 0) return []

  const markdownFiles = runGit(repoRoot, ['ls-files', 'docs'])
    .split(/\r?\n/)
    .map(normalizePath)
    .filter((filePath) => MARKDOWN_EXT_RE.test(filePath))

  const rewritten: string[] = []
  for (const markdownRel of markdownFiles) {
    const markdownAbs = path.join(repoRoot, markdownRel)
    const input = await fs.readFile(markdownAbs, 'utf8')
    const markdownDir = normalizePath(path.posix.dirname(markdownRel))
    const output = rewriteMarkdownContent(input, markdownDir, replacements)

    if (output !== input) {
      await fs.writeFile(markdownAbs, output)
      rewritten.push(markdownRel)
    }
  }

  return rewritten
}

function rewriteMarkdownContent(content: string, markdownDir: string, replacements: Replacement[]): string {
  const replacementMap = new Map(replacements.map((item) => [item.oldRel, item.newRel]))

  const withFrontmatter = content.replace(
    /^(\s*cover\s*:\s*)(.+?)(\s*)$/gm,
    (match: string, prefix: string, value: string, suffix: string) => {
      const replaced = replaceResourceValue(value, markdownDir, replacementMap)
      return replaced ? `${prefix}${replaced}${suffix}` : match
    },
  )

  return withFrontmatter.replace(
    /(!\[[^\]\r\n]*\]\()([^)\s]+)((?:\s+["'][^)"']*["'])?\))/g,
    (match: string, prefix: string, rawUrl: string, suffix: string) => {
      const replaced = replaceResourceValue(rawUrl, markdownDir, replacementMap)
      return replaced ? `${prefix}${replaced}${suffix}` : match
    },
  )
}

function replaceResourceValue(
  rawValue: string,
  markdownDir: string,
  replacementMap: Map<string, string>,
): string | undefined {
  const { quote, value } = unwrapQuotes(rawValue.trim())
  if (!value || isAbsoluteOrExternalUrl(value)) return undefined

  const { pathname, suffix } = splitResourceQuery(value)
  const normalizedPathname = pathname.replace(/^\.\//, '')
  const sourceRel = normalizePath(path.posix.normalize(path.posix.join(markdownDir, normalizedPathname)))
  const replacementRel = replacementMap.get(sourceRel)
  if (!replacementRel) return undefined

  const relativeReplacement = normalizePath(path.posix.relative(markdownDir, replacementRel))
  const nextPathname = pathname.startsWith('./') && !relativeReplacement.startsWith('../')
    ? `./${relativeReplacement}`
    : relativeReplacement

  return quote ? `${quote}${nextPathname}${suffix}${quote}` : `${nextPathname}${suffix}`
}

function unwrapQuotes(input: string): { quote: string | undefined; value: string } {
  const quote = input[0]
  if ((quote === '"' || quote === "'") && input.endsWith(quote)) {
    return { quote, value: input.slice(1, -1) }
  }
  return { quote: undefined, value: input }
}

function replaceExtWithWebp(filePath: string): string {
  return filePath.replace(IMAGE_EXT_RE, '.webp')
}

function isConvertibleImagePath(filePath: string): boolean {
  if (!filePath.startsWith(CONVERTIBLE_ROOT)) return false
  if (!IMAGE_EXT_RE.test(filePath)) return false
  return !EXCLUDED_PREFIXES.some((prefix) => filePath.startsWith(prefix))
}

function splitResourceQuery(input: string): { pathname: string; suffix: string } {
  const index = input.search(/[?#]/)
  if (index < 0) return { pathname: input, suffix: '' }
  return {
    pathname: input.slice(0, index),
    suffix: input.slice(index),
  }
}

function isAbsoluteOrExternalUrl(input: string): boolean {
  return (
    /^(?:[a-z]+:)?\/\//i.test(input)
    || input.startsWith('/')
    || input.startsWith('data:')
  )
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '')
}

function resolveRepoRoot(): string {
  return runGit(process.cwd(), ['rev-parse', '--show-toplevel']).trim()
}

function runGit(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KiB`
  return `${(bytes / 1024 / 1024).toFixed(2)}MiB`
}

main().catch((error: unknown) => {
  console.error(`image-webp: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
