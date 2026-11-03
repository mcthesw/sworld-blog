import { unified } from "unified"
import remarkParse from "remark-parse"
import { visit } from "unist-util-visit"

const parser = unified().use(remarkParse)
const blockId = String.raw`\d{14}-[a-z0-9]{7}`
const appLink = new RegExp(`^siyuan://blocks/(${blockId})(?:[/?#].*)?$`)
const blockRef = new RegExp(
  String.raw`\(\((${blockId})(?:\s+(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"))?\s*\)\)`,
  "g",
)
const remainingRef = new RegExp(`siyuan://|\\(\\(${blockId}`, "i")

export function relativeLink(from, to) {
  return [
    ...from
      .split("/")
      .slice(0, -1)
      .map(() => ".."),
    to,
  ].join("/")
}

const escapeLabel = (text) => text.replace(/[\\`*_[\]<>]/g, "\\$&")
const textOf = (node) => node.value ?? node.alt ?? node.children?.map(textOf).join("") ?? ""

// Preserve the author's reference text, but resolve destinations only within the export set.
export function rewriteReferences(markdown, from, resolveTarget) {
  const replacements = []
  const protectedRanges = []
  const render = (id, label) => {
    const target = resolveTarget(id)
    if (!target)
      return `[${escapeLabel(label || "不公开页面")}](${relativeLink(from, "not-public")})`
    return `[${escapeLabel(label || target.title)}](${relativeLink(from, target.path)})`
  }
  visit(parser.parse(markdown), (node) => {
    const start = node.position?.start.offset
    const end = node.position?.end.offset
    if (node.type === "code" || node.type === "inlineCode") {
      protectedRanges.push([start, end])
    } else if (node.type === "link" || node.type === "image") {
      const match = node.url.match(appLink)
      if (match) {
        const label = textOf(node)
        replacements.push({ start, end, text: render(match[1], label === node.url ? "" : label) })
      }
    }
  })
  const occupied = (start, end) =>
    protectedRanges.some(([a, b]) => start < b && end > a) ||
    replacements.some((r) => start < r.end && end > r.start)

  for (const match of markdown.matchAll(blockRef)) {
    const start = match.index
    const end = start + match[0].length
    if (occupied(start, end)) continue
    const label = (match[2] ?? match[3] ?? "").replace(/\\(['"\\])/g, "$1")
    replacements.push({ start, end, text: render(match[1], label) })
  }
  for (const { start, end, text } of replacements.sort((a, b) => b.start - a.start)) {
    markdown = markdown.slice(0, start) + text + markdown.slice(end)
  }

  // Reject unsupported local links rather than emitting unusable SiYuan addresses.
  const code = []
  visit(parser.parse(markdown), (node) => {
    if (node.type === "code" || node.type === "inlineCode") {
      code.push([node.position.start.offset, node.position.end.offset])
    }
  })
  let visible = markdown
  for (const [start, end] of code.sort((a, b) => b[0] - a[0])) {
    visible = visible.slice(0, start) + visible.slice(end)
  }
  if (remainingRef.test(visible)) {
    throw new Error("存在未支持的思源引用格式，请改为普通块引用或 Markdown 思源链接后再导出")
  }
  return markdown
}
