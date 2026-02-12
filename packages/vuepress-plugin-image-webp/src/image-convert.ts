import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
import sharp from "sharp"
import {
  IMAGE_EXT_RE,
  TEXT_EXT_RE,
  compileGlobPatterns,
  escapeSlashes,
  shouldHandleByPatterns,
  toPosix,
} from "./shared.js"

export interface OptimizeDistOptions {
  distDir: string
  quality: number
  keepOriginalInDist: boolean
  include: string[]
  exclude: string[]
  replacementRules: Map<string, string>
  cacheDir: string
}

export interface OptimizeDistResult {
  convertedCount: number
  deletedCount: number
  keptCount: number
  originalBytes: number
  webpBytes: number
  warnings: string[]
}

export async function optimizeDistImages(options: OptimizeDistOptions): Promise<OptimizeDistResult> {
  const includePatterns = compileGlobPatterns(options.include)
  const excludePatterns = compileGlobPatterns(options.exclude)
  const allFiles = await walkFiles(options.distDir)
  const usedTargets = new Set(allFiles.map((filePath) => toPosix(filePath)))
  const imageFiles = allFiles.filter((filePath) => {
    if (!IMAGE_EXT_RE.test(filePath)) return false
    const relPath = toPosix(path.relative(options.distDir, filePath))
    return shouldHandleByPatterns(relPath, includePatterns, excludePatterns)
  })

  const renameMap = new Map<string, string>()
  const warnings: string[] = []
  let convertedCount = 0
  let originalBytes = 0
  let webpBytes = 0

  for (const imagePath of imageFiles) {
    try {
      const sourceBuffer = await fs.readFile(imagePath)
      const outputBuffer = await convertWithCache(
        imagePath,
        sourceBuffer,
        options.quality,
        options.cacheDir,
      )

      const webpPath = getUniqueWebpPath(imagePath, usedTargets)
      await fs.mkdir(path.dirname(webpPath), { recursive: true })
      await fs.writeFile(webpPath, outputBuffer)

      const oldRel = toPosix(path.relative(options.distDir, imagePath))
      const newRel = toPosix(path.relative(options.distDir, webpPath))
      renameMap.set(oldRel, newRel)

      convertedCount += 1
      originalBytes += sourceBuffer.byteLength
      webpBytes += outputBuffer.byteLength
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      warnings.push(`Skip ${imagePath}: ${message}`)
    }
  }

  const replacementMap = new Map(options.replacementRules)
  for (const [from, to] of renameMap) {
    if (!replacementMap.has(from)) {
      replacementMap.set(from, to)
    }
  }
  await replaceReferences(options.distDir, replacementMap)

  let deletedCount = 0
  let keptCount = 0
  if (!options.keepOriginalInDist) {
    const textContents = await readAllTextFileContents(options.distDir)
    for (const [oldRel] of renameMap) {
      if (containsReference(textContents, oldRel)) {
        keptCount += 1
        warnings.push(`Keep ${oldRel} because it is still referenced`)
        continue
      }
      await fs.rm(path.join(options.distDir, oldRel), { force: true })
      deletedCount += 1
    }
  }

  return {
    convertedCount,
    deletedCount,
    keptCount,
    originalBytes,
    webpBytes,
    warnings,
  }
}

async function convertWithCache(
  filePath: string,
  sourceBuffer: Buffer,
  quality: number,
  cacheDir: string,
): Promise<Buffer> {
  const stats = await fs.stat(filePath)
  const key = createHash("sha1")
    .update(`${toPosix(filePath)}|${stats.mtimeMs}|${stats.size}|${quality}`)
    .digest("hex")
  const cachePath = path.join(cacheDir, `${key}.webp`)

  try {
    return await fs.readFile(cachePath)
  }
  catch {
    // cache miss
  }

  const outputBuffer = await sharp(sourceBuffer, { failOn: "none" })
    .webp({ quality })
    .toBuffer()

  await fs.mkdir(cacheDir, { recursive: true })
  await fs.writeFile(cachePath, outputBuffer)
  return outputBuffer
}

function getUniqueWebpPath(sourcePath: string, usedTargets: Set<string>): string {
  const parsed = path.parse(sourcePath)
  let index = 0
  let candidate = path.join(parsed.dir, `${parsed.name}.webp`)

  while (usedTargets.has(toPosix(candidate))) {
    index += 1
    candidate = path.join(parsed.dir, `${parsed.name}-${index}.webp`)
  }

  usedTargets.add(toPosix(candidate))
  return candidate
}

async function replaceReferences(distDir: string, replacements: Map<string, string>): Promise<void> {
  if (!replacements.size) return

  const files = await walkFiles(distDir)
  const textFiles = files.filter((filePath) => TEXT_EXT_RE.test(filePath))
  const entries = [...replacements.entries()].sort((a, b) => b[0].length - a[0].length)

  for (const filePath of textFiles) {
    const input = await fs.readFile(filePath, "utf8")
    let output = input

    for (const [from, to] of entries) {
      const variants: Array<[string, string]> = [
        [from, to],
        [`/${from}`, `/${to}`],
        [encodeURI(from), encodeURI(to)],
        [`/${encodeURI(from)}`, `/${encodeURI(to)}`],
        [escapeSlashes(from), escapeSlashes(to)],
        [escapeSlashes(`/${from}`), escapeSlashes(`/${to}`)],
      ]

      for (const [fromValue, toValue] of variants) {
        if (!fromValue || fromValue === toValue) continue
        output = output.split(fromValue).join(toValue)
      }
    }

    if (output !== input) {
      await fs.writeFile(filePath, output)
    }
  }
}

function containsReference(contents: string[], oldRel: string): boolean {
  const encoded = encodeURI(oldRel)
  const variants = new Set([
    oldRel,
    `/${oldRel}`,
    encoded,
    `/${encoded}`,
    escapeSlashes(oldRel),
    escapeSlashes(`/${oldRel}`),
  ])

  return contents.some((content) => {
    for (const variant of variants) {
      if (variant && content.includes(variant)) return true
    }
    return false
  })
}

async function readAllTextFileContents(rootDir: string): Promise<string[]> {
  const files = await walkFiles(rootDir)
  const textFiles = files.filter((filePath) => TEXT_EXT_RE.test(filePath))
  const contents: string[] = []

  for (const filePath of textFiles) {
    contents.push(await fs.readFile(filePath, "utf8"))
  }
  return contents
}

async function walkFiles(rootDir: string): Promise<string[]> {
  const result: string[] = []
  const stack: string[] = [rootDir]

  while (stack.length) {
    const current = stack.pop()
    if (!current) continue

    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
        continue
      }
      if (entry.isFile()) {
        result.push(fullPath)
      }
    }
  }

  return result
}
