import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { parse } from "yaml"
import { unified } from "unified"
import remarkParse from "remark-parse"
import { visit } from "unist-util-visit"
import { stringifyFrontmatter } from "./frontmatter.mjs"

const parser = unified().use(remarkParse)

export function safeRelativePath(value) {
  if (
    !value ||
    /[\\<>:"|?*\x00-\x1f]/.test(value) ||
    value.split("/").some((part) => !part || part === "." || part === ".." || /[. ]$/.test(part))
  )
    throw new Error(`不安全的相对路径：${value}`)
  return value
}

function filesIn(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`输出目录不支持符号链接：${file}`)
    return entry.isDirectory() ? filesIn(file) : [file]
  })
}

function readPages(content) {
  const assetRoot = join(content, "assets")
  return filesIn(content)
    .filter(
      (file) =>
        file.endsWith(".md") &&
        !file.startsWith(assetRoot + "/") &&
        !file.startsWith(assetRoot + "\\"),
    )
    .map((file) => {
      const text = readFileSync(file, "utf8")
      const head = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
      return { file, text, frontmatter: head ? (parse(head) ?? {}) : {} }
    })
}

function referencedAssets(pages, content) {
  const used = new Set()
  for (const page of pages) {
    const add = (url) => {
      if (typeof url !== "string" || /^(?:[a-z]+:|\/\/)/i.test(url)) return
      const decoded = decodeURIComponent(url.split(/[?#]/)[0])
      const file = decoded.startsWith("/")
        ? resolve(content, decoded.slice(1))
        : resolve(dirname(page.file), decoded)
      const assetPath = relative(join(content, "assets"), file)
      if (assetPath === ".." || assetPath.startsWith(".." + sep) || isAbsolute(assetPath)) return
      used.add(file)
    }
    add(page.frontmatter.cover)
    visit(parser.parse(page.text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "")), (node) => {
      if (["image", "link", "definition"].includes(node.type)) add(node.url)
      if (node.type === "html") {
        for (const match of node.value.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi))
          add(match[1])
      }
    })
  }
  return used
}

// Prepare every document and read every asset before touching the previous output.
// This protects against conversion/missing-file failures, not OS-level write failures.
export function publishOutput({ content, documents, selected = false, retireLegacy = false, dryRun = false }) {
  const existing = readPages(content)
  const planned = documents.map((item) => {
    const slug = safeRelativePath(item.path)
    return {
      ...item,
      file: join(content, `${slug}.md`),
      text: `${stringifyFrontmatter(item.frontmatter)}\n\n${item.body}\n`,
    }
  })
  const paths = new Set()
  const plannedIds = new Set(planned.map((page) => page.frontmatter["siyuan-id"]))
  for (const page of planned) {
    const key = page.file.toLowerCase()
    if (paths.has(key)) throw new Error(`重复的发布路径：${page.path}`)
    paths.add(key)
    const old = existing.find((entry) => entry.file.toLowerCase() === key)
    if (
      old &&
      old.frontmatter.source !== "legacy" &&
      !(
        old.frontmatter.source === "siyuan" &&
        (old.frontmatter["siyuan-id"] === page.frontmatter["siyuan-id"] ||
          // A full sync retires pages of withdrawn documents, so another document may take over the URL.
          (!selected && !plannedIds.has(old.frontmatter["siyuan-id"])))
      )
    ) {
      throw new Error(`拒绝覆盖其他来源的页面：${relative(content, page.file)}`)
    }
  }
  const removed = selected
    ? []
    : existing.filter(
        (page) => (page.frontmatter.source === "siyuan" || (retireLegacy && page.frontmatter.source === "legacy")) && !paths.has(page.file.toLowerCase()),
      )
  const retained = existing.filter(
    (page) => !paths.has(page.file.toLowerCase()) && !removed.includes(page),
  )
  const finalPages = [...retained, ...planned]
  const owners = new Map()
  for (const page of finalPages.filter((page) =>
    ["siyuan", "legacy"].includes(page.frontmatter.source),
  )) {
    const key = basename(page.file, ".md").toLowerCase()
    if (owners.has(key)) throw new Error(`文章资源目录冲突：${key}`)
    owners.set(key, page.file)
  }

  const assets = new Map()
  for (const page of planned) {
    for (const asset of page.assets) {
      assets.set(join(content, "assets", page.id, safeRelativePath(asset.name)), asset.data)
    }
  }
  const used = referencedAssets(finalPages, content)
  for (const file of assets.keys()) used.add(file)
  const namespaces = new Set([
    ...planned.map((page) => page.id),
    ...removed.map((page) => basename(page.file, ".md")),
  ])
  const staleAssets = [...namespaces]
    .flatMap((id) => filesIn(join(content, "assets", safeRelativePath(id))))
    .filter((file) => !used.has(file))

  for (const page of planned)
    console.log(`${dryRun ? "[dry-run] " : ""}${page.doc.hpath} -> /${page.path}`)
  for (const page of removed)
    console.log(
      `${dryRun ? "[dry-run] " : ""}移除已取消发布的文章：${relative(content, page.file)}`,
    )
  for (const file of staleAssets)
    console.log(`${dryRun ? "[dry-run] " : ""}移除未引用资源：${relative(content, file)}`)
  const images = planned.flatMap((page) => page.assets).filter((asset) => asset.image)
  if (images.length) console.log(`WebP：${images.length} 张，${images.reduce((n, a) => n + a.inputBytes, 0)} -> ${images.reduce((n, a) => n + a.data.length, 0)} bytes`)
  if (dryRun) return

  // 先删后写：Windows 等大小写不敏感的文件系统上，仅大小写不同的旧文件与新文件是同一个文件。
  for (const file of staleAssets) rmSync(file)
  for (const [file, data] of assets) {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, data)
  }
  for (const page of planned) {
    mkdirSync(dirname(page.file), { recursive: true })
    writeFileSync(page.file, page.text)
  }
  for (const page of removed) rmSync(page.file)
}
