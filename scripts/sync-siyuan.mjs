// 把思源中标记为公开的文档同步为 Quartz 内容。只读取思源，不写入思源。
//
// 用法：
//   node scripts/sync-siyuan.mjs                 同步所有 custom-publish=true 的文档
//   node scripts/sync-siyuan.mjs --dry-run       只打印计划，不写文件
//   node scripts/sync-siyuan.mjs --id <docId> [--id <otherId> ...] [--attr custom-xxx=value ...]
//                                                隔离预览指定文档及其互链，可临时覆盖属性
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { basename, resolve } from "node:path"
import { parseArgs } from "node:util"
import { prepareResources } from "./lib/resources.mjs"
import { publishOutput, safeRelativePath } from "./lib/publish-output.mjs"
import { toIsoDate } from "./lib/dates.mjs"
import { rewriteReferences } from "./lib/references.mjs"

const { values } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    snapshot: { type: "boolean", default: false },
    id: { type: "string", multiple: true },
    attr: { type: "string", multiple: true },
  },
})
const dryRun = values["dry-run"]
const selectedIds = values.id ?? []
const attrOverrides = Object.fromEntries(
  (values.attr ?? []).map((entry) => {
    const separator = entry.indexOf("=")
    if (separator < 1) throw new Error("--attr 需要 key=value")
    return [entry.slice(0, separator), entry.slice(separator + 1)]
  }),
)
const content = resolve("content")
const blockedPaths = [/^\/daily note\//]
const workspaceArgs = process.env.SIYUAN_WORKSPACE ? ["--workspace", process.env.SIYUAN_WORKSPACE] : []

function siyuan(...cmd) {
  return execFileSync("siyuan", [...cmd, "-f", "json", "-v", "off", ...workspaceArgs], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
}

const sql = (stmt) => JSON.parse(siyuan("sql", stmt, "--limit", "10000"))
const esc = (s) => s.replace(/'/g, "''")
const workspace = JSON.parse(siyuan("workspace", "info")).path

function listDocs() {
  const where = selectedIds.length
    ? `b.id in (${selectedIds.map((id) => `'${esc(id)}'`).join(",")})`
    : `b.id in (select block_id from attributes where name = 'custom-publish' and value = 'true')`
  const found = sql(
    `select b.id, b.content as title, b.hpath, b.created, b.updated from blocks b where b.type = 'd' and ${where}`,
  )
  for (const id of selectedIds) {
    if (!found.some((doc) => doc.id === id)) throw new Error(`找不到指定文档：${id}`)
  }
  return found
}

function docAttrs(id) {
  const attrs = JSON.parse(siyuan("attr", "get", "--id", id))
  return selectedIds.length ? { ...attrs, ...attrOverrides } : attrs
}

function targetPath(doc, attrs) {
  const permalink = attrs["custom-permalink"]?.replace(/^\/|\/$/g, "")
  if (permalink) return permalink
  const date = toIsoDate(doc.created)
  const abbrlink =
    attrs["custom-abbrlink"] || createHash("sha1").update(doc.id).digest("hex").slice(0, 8)
  return `${date.slice(0, 4)}/${date.slice(5, 7)}/${abbrlink}`
}

// 第一遍：确定所有要发布的文档及其 URL，用于把互相引用改写成站内链接。
const docs = listDocs()
  .filter((doc) => {
    if (!blockedPaths.some((r) => r.test(doc.hpath))) return true
    console.warn(`跳过（路径不允许公开）：${doc.hpath}`)
    return false
  })
  .map((doc) => {
    const attrs = docAttrs(doc.id)
    return { doc, attrs, path: safeRelativePath(decodeURIComponent(targetPath(doc, attrs))) }
  })
const published = new Map(
  docs.map(({ doc, attrs, path }) => [doc.id, { path, title: attrs["custom-title"] || doc.title }]),
)
const rootOf = new Map()
function rootId(blockId) {
  if (!rootOf.has(blockId))
    rootOf.set(blockId, sql(`select root_id from blocks where id = '${esc(blockId)}'`)[0]?.root_id)
  return rootOf.get(blockId)
}

function getBlockKramdown(blockId) {
  return execFileSync("siyuan", ["block", "kramdown", "--id", blockId, "-v", "off", ...workspaceArgs], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
}

function cleanKramdown(raw, warnings) {
  return raw
    .replace(/\r\n/g, "\n")
    // 整行 IAL 连同换行一起删除，否则相邻列表项之间会留下空行变成松散列表。
    .replace(/^[ \t]*\{:[^}\n]*\}[ \t]*(?:\n|$)/gm, "")
    .replace(/\{:[^}\n]*\}/g, "")
    .replace(/[\u200b\u200d\ufeff]/g, "")
    .replace(/^[　]+/gm, "")
    .replace(/(!\[[^\]]*\]\([^)]*\))(?=!\[)/g, "$1\n\n")
    .replace(/\{\{[^}]*\}\}/g, () => {
      warnings.push("嵌入块已移除")
      return ""
    })
    .replace(/(^|\s)#([^#\s][^#\n]*?)#(?=\s|$)/g, "$1$2")
}

function stripSelfReference(markdown, docId) {
  const selfRef = new RegExp(
    String.raw`(?:\(\(${docId}(?:\s+(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"))?\s*\)\)|\[(?:\\.|[^\]\\])*\]\(siyuan://blocks/${docId}(?:[/?#][^\s)]*)?\))[ \t:：·]*`,
    "g",
  )
  return markdown.replace(selfRef, "")
}

function normalizeBacklinkEntry(markdown, containerType) {
  if (containerType === "i") {
    const lines = markdown.split("\n")
    const marker = lines[0].match(/^\s*(?:[*+-]|\d+\.)\s+/)?.[0] ?? ""
    lines[0] = lines[0].slice(marker.length)
    const indent = new RegExp(`^ {1,${Math.max(marker.length, 1)}}`)
    for (let i = 1; i < lines.length; i++) {
      lines[i] = lines[i].replace(indent, "")
    }
    return lines.join("\n").trim()
  }
  return markdown.trim()
}

function collectBacklinks(docId, warnings) {
  const rows =
    sql(
      `select b.id, b.parent_id, b.type, b.created, p.type as parent_type, p.created as parent_created, (select a.value from attributes a where a.block_id = b.root_id and a.name like 'custom-dailynote-%' limit 1) as dailynote from blocks b left join blocks p on p.id = b.parent_id where b.root_id != '${esc(docId)}' and b.id in (select block_id from refs where def_block_root_id = '${esc(docId)}') order by b.created desc`,
    ) ?? []
  const seen = new Set()
  const byDate = new Map()
  for (const row of rows) {
    const useParent = row.parent_type === "i" || row.parent_type === "b"
    const entryId = useParent ? row.parent_id : row.id
    const created = (useParent ? row.parent_created : row.created) || row.created
    if (!entryId || seen.has(entryId)) continue
    seen.add(entryId)
    const cleaned = normalizeBacklinkEntry(
      stripSelfReference(cleanKramdown(getBlockKramdown(entryId), warnings), docId),
      useParent ? row.parent_type : row.type,
    )
    if (!cleaned) continue
    // 补记到旧日记里的块创建时间晚于日记本身，日期以所在日记为准。
    const day = /^\d{8}$/.test(row.dailynote ?? "") ? row.dailynote : null
    const date = day
      ? `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`
      : toIsoDate(created).slice(0, 10)
    byDate.set(date, [...(byDate.get(date) ?? []), cleaned])
  }
  return [...byDate]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => `### ${date}\n\n${list.join("\n\n")}`)
    .join("\n\n")
}

async function convert({ doc, attrs, path }, warnings) {
  const id = basename(path)
  let md = cleanKramdown(getBlockKramdown(doc.id), warnings)
  if (attrs["custom-backlinks"] === "true") {
    const collected = collectBacklinks(doc.id, warnings)
    md = [md.trim(), collected].filter(Boolean).join("\n\n")
  }

  md = rewriteReferences(md, path, (ref) => published.get(rootId(ref)))
  const privateLinks = (md.match(/\]\([^\n)]*not-public\)/g) ?? []).length
  if (privateLinks) warnings.push(privateLinks + " 处私人或缺失引用：保留文字，链接到统一提示页")

  const titleImage = attrs["title-img"]?.match(
    /background-image:\s*url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)/,
  )
  let cover = titleImage?.[1] ?? titleImage?.[2] ?? titleImage?.[3]
  if (cover && !/^(assets\/|https?:\/\/)/i.test(cover)) cover = undefined
  const resources = await prepareResources({ markdown: md, cover, path, id, workspace, warnings })
  md = resources.markdown
  cover = resources.cover

  for (const m of md.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)) warnings.push(`疑似邮箱：${m[0]}`)
  for (const m of md.matchAll(
    /\b(?:10|127|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d+\.\d+(?:\.\d+)?\b/g,
  ))
    warnings.push(`疑似内网地址：${m[0]}`)

  const num = (v) => (v ? Number(v) : undefined)
  const frontmatter = {
    title: attrs["custom-title"] || doc.title,
    date: toIsoDate(attrs["custom-date"] || doc.created),
    updated: toIsoDate(doc.updated),
    type: attrs["custom-type"],
    featured: attrs["custom-featured"] === "true" ? true : undefined,
    kind: attrs["custom-kind"],
    status: attrs["custom-status"],
    score: num(attrs["custom-score"]),
    expect: num(attrs["custom-expect"]),
    description: attrs["custom-description"],
    cover,
    abbrlink: id,
    comments: attrs["custom-comments"] === "false" ? false : undefined,
    source: "siyuan",
    "siyuan-id": doc.id,
  }
  const body = md
    .replace(/^[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return { body, frontmatter, assets: resources.assets, id }
}

const documents = []
for (const item of docs) {
  const warnings = []
  const converted = await convert(item, warnings)
  for (const warning of new Set(warnings)) console.warn(`  ⚠ ${warning}`)
  documents.push({ ...item, ...converted })
}
publishOutput({ content, documents, selected: selectedIds.length > 0 && !values.snapshot, retireLegacy: values.snapshot, dryRun })
