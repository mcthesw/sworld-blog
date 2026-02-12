import { promises as fs } from "node:fs"
import path from "node:path"
import MarkdownIt from "markdown-it"
import {
  IMAGE_EXT_RE,
  compileGlobPatterns,
  isAbsoluteOrExternalUrl,
  replaceExtWithWebp,
  splitResourceQuery,
  shouldHandleByPatterns,
  toPosix,
} from "./shared.js"

export interface CollectMarkdownRulesOptions {
  sourceDir: string
  include: string[]
  exclude: string[]
  rewriteMarkdown: boolean
  rewriteFrontmatterCover: boolean
}

export async function collectMarkdownRewriteRules(
  options: CollectMarkdownRulesOptions,
): Promise<Map<string, string>> {
  if (!options.rewriteMarkdown && !options.rewriteFrontmatterCover) {
    return new Map()
  }

  const includePatterns = compileGlobPatterns(options.include)
  const excludePatterns = compileGlobPatterns(options.exclude)
  const markdown = new MarkdownIt()
  const markdownFiles = await walkMarkdownFiles(options.sourceDir)
  const rules = new Map<string, string>()

  for (const filePath of markdownFiles) {
    const rawContent = await fs.readFile(filePath, "utf8")
    const fileDirRel = toPosix(path.relative(options.sourceDir, path.dirname(filePath)))

    if (options.rewriteMarkdown) {
      const tokens = markdown.parse(rawContent, {})
      for (const token of tokens) {
        for (const child of token.children ?? []) {
          if (child.type !== "image") continue
          const src = child.attrGet("src")
          if (!src) continue
          addRulesFromLocalSource(rules, src, fileDirRel, includePatterns, excludePatterns)
        }
      }
    }

    if (options.rewriteFrontmatterCover) {
      const cover = readFrontmatterCover(rawContent)
      if (cover) {
        addRulesFromLocalSource(rules, cover, fileDirRel, includePatterns, excludePatterns)
      }
    }
  }

  return rules
}

function addRulesFromLocalSource(
  rules: Map<string, string>,
  rawSource: string,
  fileDirRel: string,
  includePatterns: RegExp[],
  excludePatterns: RegExp[],
): void {
  const source = rawSource.trim()
  if (!source) return
  if (isAbsoluteOrExternalUrl(source)) return
  if (source.startsWith("/images/")) return

  const { pathname } = splitResourceQuery(source)
  if (!IMAGE_EXT_RE.test(pathname)) return

  const normalizedPathname = pathname.replace(/^\.\//, "")
  const sourceRel = toPosix(path.normalize(path.join(fileDirRel, normalizedPathname)))
  if (!sourceRel || sourceRel.startsWith("../")) return

  if (!shouldHandleByPatterns(sourceRel, includePatterns, excludePatterns)) return

  const replaced = replaceExtWithWebp(source)
  const sourceRelWebp = replaceExtWithWebp(sourceRel)

  addRule(rules, source, replaced)
  if (!source.startsWith("./")) {
    addRule(rules, `./${source}`, `./${replaced}`)
  }
  addRule(rules, sourceRel, sourceRelWebp)
  addRule(rules, `/${sourceRel}`, `/${sourceRelWebp}`)
  addRule(rules, `../../${sourceRel}`, `../../${sourceRelWebp}`)
}

function addRule(rules: Map<string, string>, from: string, to: string): void {
  if (!from || !to || from === to) return
  if (rules.has(from)) return
  rules.set(from, to)
}

function readFrontmatterCover(content: string): string | undefined {
  if (!content.startsWith("---")) return undefined
  const lines = content.split(/\r?\n/)
  if (!lines.length || lines[0].trim() !== "---") return undefined

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.trim() === "---") break
    const match = line.match(/^cover\s*:\s*(.+)$/)
    if (!match) continue

    const raw = match[1].trim()
    if (!raw) return undefined
    const unquoted = raw.replace(/^(['"])(.*)\1$/, "$2").trim()
    return unquoted || undefined
  }
  return undefined
}

async function walkMarkdownFiles(rootDir: string): Promise<string[]> {
  const result: string[] = []
  const stack: string[] = [rootDir]

  while (stack.length) {
    const current = stack.pop()
    if (!current) continue

    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === ".vuepress" || entry.name === "node_modules") continue
        stack.push(fullPath)
        continue
      }
      if (entry.isFile() && fullPath.toLowerCase().endsWith(".md")) {
        result.push(fullPath)
      }
    }
  }

  return result
}
