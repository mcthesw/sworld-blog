#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import exifr from 'exifr'

type CliMode = 'staged' | 'all' | 'files'

type GuardConfig = {
  allowedEmails: string[]
  allowedEmailDomains: string[]
  ignoredPathPrefixes: string[]
  textFileExtensions: string[]
  imageFileExtensions: string[]
  blockedFileExtensions: string[]
  blockedFileNames: string[]
}

type CliOptions = {
  mode: CliMode
  files: string[]
}

type Issue = {
  kind: string
  path: string
  details: string
  line?: number
}

const CONFIG_FILE = 'privacy-guard.config.json'
const SUPPRESS_RE = /privacy-ignore/i
const TEXT_ENCODER = new TextDecoder('utf-8', { fatal: false })
const SECRET_PLACEHOLDER_RE = /(example|sample|placeholder|dummy|fake|test|your[_-]?|changeme|replace[_-]?me|xxxxx|<.+>)/i
const WINDOWS_HOME_RE = /\bC:\\Users\\([^\\\r\n]+)/gi
const MAC_HOME_RE = /\b\/Users\/([^\/\s]+)/g
const LINUX_HOME_RE = /\b\/home\/([^\/\s]+)/g
const SAFE_HOME_SEGMENTS = new Set([
  'username',
  'user',
  'yourname',
  'your-user',
  'your_user',
  'yourusername',
  'example',
  'test',
  '用户名',
])

const SECRET_PATTERNS: Array<{ kind: string; regex: RegExp }> = [
  { kind: 'private-key-block', regex: /-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP|PRIVATE KEY)-----/ },
  { kind: 'github-token', regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/ },
  { kind: 'github-pat', regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { kind: 'openai-key', regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/ },
  { kind: 'slack-token', regex: /\bxox(?:b|p|a|r|s)-[A-Za-z0-9-]{10,}\b/ },
  { kind: 'google-api-key', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  { kind: 'aws-access-key', regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { kind: 'stripe-live-key', regex: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/ },
  { kind: 'jwt-token', regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9._-]{8,}\.[A-Za-z0-9._-]{8,}\b/ },
  { kind: 'url-embedded-credentials', regex: /\bhttps?:\/\/[^/\s:@]+:[^@\s]+@/i },
]

const { gps: readGpsMetadata } = exifr

const GENERIC_SECRET_RE = /\b(api[_-]?key|access[_-]?key|secret|client[_-]?secret|token|password|passwd|pwd|private[_-]?key)\b\s*[:=]\s*["']?([A-Za-z0-9/+=._-]{12,})["']?/i
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}/g

function usage(): void {
  console.log(`
用法:
  node .local/scripts/privacy-guard.js --staged
  node .local/scripts/privacy-guard.js --all
  node .local/scripts/privacy-guard.js --files path/to/file1 path/to/file2
`)
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.length === 0 || argv.includes('--staged')) {
    return { mode: 'staged', files: [] }
  }

  if (argv.includes('--all')) {
    return { mode: 'all', files: [] }
  }

  const filesIndex = argv.indexOf('--files')
  if (filesIndex >= 0) {
    const files = argv.slice(filesIndex + 1).filter(Boolean)
    if (files.length === 0) {
      throw new Error('--files 需要至少一个文件路径')
    }
    return { mode: 'files', files }
  }

  if (argv.includes('--help') || argv.includes('-h')) {
    usage()
    process.exit(0)
  }

  throw new Error(`未知参数: ${argv.join(' ')}`)
}

function runGit(args: string[], cwd: string): string {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  })

  if (result.status !== 0) {
    const stderr = result.stderr.trim()
    throw new Error(stderr || `git ${args.join(' ')} 执行失败`)
  }

  return result.stdout
}

function resolveRepoRoot(): string {
  return runGit(['rev-parse', '--show-toplevel'], process.cwd()).trim()
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '')
}

function getExtension(filePath: string): string {
  const baseName = path.posix.basename(filePath)
  const ext = path.posix.extname(baseName)
  return ext ? ext.toLowerCase() : baseName.startsWith('.') ? baseName.toLowerCase() : ''
}

function isIgnoredPath(filePath: string, config: GuardConfig): boolean {
  return config.ignoredPathPrefixes.some((prefix) => filePath.startsWith(prefix))
}

function isTextPath(filePath: string, config: GuardConfig): boolean {
  return config.textFileExtensions.includes(getExtension(filePath))
}

function isImagePath(filePath: string, config: GuardConfig): boolean {
  return config.imageFileExtensions.includes(getExtension(filePath))
}

function isEnvExample(filePath: string): boolean {
  const baseName = path.posix.basename(filePath).toLowerCase()
  return ['.env.example', '.env.sample', '.env.template'].includes(baseName)
}

function shouldBlockFileByName(filePath: string, config: GuardConfig): boolean {
  const baseName = path.posix.basename(filePath).toLowerCase()

  if (config.blockedFileNames.includes(baseName)) {
    return !isEnvExample(filePath)
  }

  if (baseName.startsWith('.env.')) {
    return !isEnvExample(filePath)
  }

  return false
}

function shouldBlockFileByExtension(filePath: string, config: GuardConfig): boolean {
  return config.blockedFileExtensions.includes(getExtension(filePath))
}

function isBinaryLike(buffer: Buffer): boolean {
  const probeLength = Math.min(buffer.length, 4096)
  for (let index = 0; index < probeLength; index += 1) {
    if (buffer[index] === 0) {
      return true
    }
  }
  return false
}

function extractCandidateFiles(options: CliOptions, repoRoot: string): string[] {
  if (options.mode === 'files') {
    return options.files.map(normalizePath)
  }

  const gitArgs = options.mode === 'all'
    ? ['ls-files']
    : ['diff', '--cached', '--name-only', '--diff-filter=ACMR']

  return runGit(gitArgs, repoRoot)
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(normalizePath)
}

function isAllowedEmail(candidate: string, config: GuardConfig): boolean {
  const normalized = candidate.toLowerCase()
  if (config.allowedEmails.includes(normalized)) {
    return true
  }

  const domain = normalized.split('@')[1]
  return domain ? config.allowedEmailDomains.includes(domain) : false
}

function hasEmailBoundary(content: string, start: number, end: number): boolean {
  const previous = start === 0 ? '' : content[start - 1]
  const next = end >= content.length ? '' : content[end]
  return !/[A-Za-z0-9/_-]/.test(previous) && !/[A-Za-z0-9/_-]/.test(next)
}

function redactSecret(value: string): string {
  if (value.length <= 10) {
    return `${value.slice(0, 2)}***`
  }
  return `${value.slice(0, 4)}***${value.slice(-4)}`
}

function detectEmails(filePath: string, content: string, config: GuardConfig): Issue[] {
  const issues: Issue[] = []
  const lines = content.split(/\r?\n/)

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    if (SUPPRESS_RE.test(line)) continue
    EMAIL_RE.lastIndex = 0
    let match = EMAIL_RE.exec(line)
    while (match) {
      const candidate = match[0]
      const start = match.index
      const end = start + candidate.length
      if (hasEmailBoundary(line, start, end) && !isAllowedEmail(candidate, config)) {
        issues.push({
          kind: 'non-allowlisted-email',
          path: filePath,
          line: lineIndex + 1,
          details: candidate,
        })
      }
      match = EMAIL_RE.exec(line)
    }
  }

  return issues
}

function detectSecrets(filePath: string, content: string): Issue[] {
  const issues: Issue[] = []
  const lines = content.split(/\r?\n/)

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    if (SUPPRESS_RE.test(line)) continue

    for (const pattern of SECRET_PATTERNS) {
      const match = line.match(pattern.regex)
      if (match && !SECRET_PLACEHOLDER_RE.test(line)) {
        issues.push({
          kind: pattern.kind,
          path: filePath,
          line: lineIndex + 1,
          details: redactSecret(match[0]),
        })
      }
    }

    const genericMatch = line.match(GENERIC_SECRET_RE)
    if (genericMatch) {
      const [, keyName, secretValue] = genericMatch
      if (!SECRET_PLACEHOLDER_RE.test(secretValue)) {
        issues.push({
          kind: 'generic-secret-assignment',
          path: filePath,
          line: lineIndex + 1,
          details: `${keyName}=${redactSecret(secretValue)}`,
        })
      }
    }
  }

  return issues
}

function detectHomePathLeaks(filePath: string, content: string): Issue[] {
  const issues: Issue[] = []
  const detectors = [
    { regex: WINDOWS_HOME_RE, prefix: 'C:\\Users\\' },
    { regex: MAC_HOME_RE, prefix: '/Users/' },
    { regex: LINUX_HOME_RE, prefix: '/home/' },
  ]

  const lines = content.split(/\r?\n/)
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    if (SUPPRESS_RE.test(line)) continue
    for (const { regex, prefix } of detectors) {
      regex.lastIndex = 0
      let match = regex.exec(line)
      while (match) {
        const segment = match[1]
        if (!SAFE_HOME_SEGMENTS.has(segment.toLowerCase())) {
          issues.push({
            kind: 'local-home-path',
            path: filePath,
            line: lineIndex + 1,
            details: `${prefix}${segment}`,
          })
        }
        match = regex.exec(line)
      }
    }
  }

  return issues
}

async function inspectTextFile(filePath: string, absolutePath: string, config: GuardConfig): Promise<Issue[]> {
  const buffer = await readFile(absolutePath)
  if (isBinaryLike(buffer)) {
    return []
  }

  const content = TEXT_ENCODER.decode(buffer)
  return [
    ...detectEmails(filePath, content, config),
    ...detectSecrets(filePath, content),
    ...detectHomePathLeaks(filePath, content),
  ]
}

async function inspectImageFile(filePath: string, absolutePath: string): Promise<Issue[]> {
  try {
    const location = await readGpsMetadata(absolutePath)
    if (location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
      return [{
        kind: 'image-gps-metadata',
        path: filePath,
        details: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      }]
    }
    return []
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (getExtension(filePath) === '.webp' && /unknown file format/i.test(message)) {
      return []
    }

    return [{
      kind: 'image-metadata-read-failed',
      path: filePath,
      details: message,
    }]
  }
}

async function inspectFile(filePath: string, repoRoot: string, config: GuardConfig): Promise<Issue[]> {
  if (isIgnoredPath(filePath, config)) {
    return []
  }

  const absolutePath = path.resolve(repoRoot, filePath)
  const issues: Issue[] = []

  if (shouldBlockFileByName(filePath, config)) {
    issues.push({
      kind: 'blocked-filename',
      path: filePath,
      details: path.posix.basename(filePath),
    })
  }

  if (shouldBlockFileByExtension(filePath, config)) {
    issues.push({
      kind: 'blocked-file-extension',
      path: filePath,
      details: getExtension(filePath),
    })
  }

  if (isTextPath(filePath, config)) {
    issues.push(...await inspectTextFile(filePath, absolutePath, config))
  }

  if (isImagePath(filePath, config)) {
    issues.push(...await inspectImageFile(filePath, absolutePath))
  }

  return issues
}

function printIssues(issues: Issue[]): void {
  const grouped = new Map<string, Issue[]>()
  for (const issue of issues) {
    const bucket = grouped.get(issue.path) ?? []
    bucket.push(issue)
    grouped.set(issue.path, bucket)
  }

  console.error('隐私检查未通过，发现以下风险：')
  for (const [filePath, fileIssues] of grouped) {
    console.error(`- ${filePath}`)
    for (const issue of fileIssues) {
      const lineInfo = issue.line ? `:${issue.line}` : ''
      console.error(`  - [${issue.kind}]${lineInfo} ${issue.details}`)
    }
  }
}

async function loadConfig(repoRoot: string): Promise<GuardConfig> {
  const configPath = path.join(repoRoot, CONFIG_FILE)
  const raw = await readFile(configPath, 'utf8')
  const parsed = JSON.parse(raw) as GuardConfig
  return {
    allowedEmails: parsed.allowedEmails.map((item) => item.toLowerCase()),
    allowedEmailDomains: parsed.allowedEmailDomains.map((item) => item.toLowerCase()),
    ignoredPathPrefixes: parsed.ignoredPathPrefixes.map(normalizePath),
    textFileExtensions: parsed.textFileExtensions.map((item) => item.toLowerCase()),
    imageFileExtensions: parsed.imageFileExtensions.map((item) => item.toLowerCase()),
    blockedFileExtensions: parsed.blockedFileExtensions.map((item) => item.toLowerCase()),
    blockedFileNames: parsed.blockedFileNames.map((item) => item.toLowerCase()),
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const repoRoot = resolveRepoRoot()
  const config = await loadConfig(repoRoot)
  const files = extractCandidateFiles(options, repoRoot)

  if (files.length === 0) {
    console.log('隐私检查：没有待检查文件。')
    return
  }

  const issueLists = await Promise.all(files.map((filePath) => inspectFile(filePath, repoRoot, config)))
  const issues = issueLists.flat()

  if (issues.length > 0) {
    printIssues(issues)
    process.exit(1)
  }

  console.log(`隐私检查通过：已检查 ${files.length} 个文件。`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`隐私检查执行失败: ${message}`)
  process.exit(1)
})
