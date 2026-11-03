import { readFileSync } from "node:fs"
import { join, extname } from "node:path"
import { createHash } from "node:crypto"
import sharp from "sharp"
import { unified } from "unified"
import remarkParse from "remark-parse"
import { visit } from "unist-util-visit"
import { safeRelativePath } from "./publish-output.mjs"
import { relativeLink } from "./references.mjs"

const parser = unified().use(remarkParse)
const raster = /\.(?:png|jpe?g|webp|gif|avif|tiff?)$/i

export async function websiteAsset(name, input) {
  if (!raster.test(name)) return { name, data: input, image: false }
  // libvips does not decode APNG animation; failing is preferable to losing frames.
  if (/\.png$/i.test(name)) {
    for (let offset = 8; offset + 12 <= input.length;) {
      if (input.toString("ascii", offset + 4, offset + 8) === "acTL")
        throw new Error(`APNG 暂不支持，请先转为动画 WebP：${name}`)
      offset += input.readUInt32BE(offset) + 12
    }
  }
  const metadata = await sharp(input, { animated: true }).metadata()
  let data = input
  if (metadata.format !== "webp" || metadata.width > 2560 || metadata.exif || metadata.xmp || metadata.icc) {
    let pipeline = sharp(input, { animated: true })
    if (!(metadata.pages > 1)) pipeline = pipeline.autoOrient()
    data = await pipeline.resize({ width: 2560, withoutEnlargement: true })
      .webp({ quality: 85, alphaQuality: 100, effort: 4 }).toBuffer()
  }
  const fingerprint = createHash("sha256").update(input).digest("hex").slice(0, 12)
  return { name: `${name.slice(0, -extname(name).length)}-${fingerprint}.webp`, data, image: true }
}

export async function prepareResources({ markdown, cover, path, id, workspace, warnings }) {
  const nodes = []
  visit(parser.parse(markdown), (node) => {
    if (node.type === "html" && /\b(?:src|href)\s*=\s*["']assets\//i.test(node.value))
      throw new Error("请将 HTML 本地资源改为 Markdown 图片或链接")
    if (["image", "link", "definition"].includes(node.type) && node.url.startsWith("assets/")) nodes.push(node)
    if (node.type === "image" && /^https?:\/\//i.test(node.url)) warnings.push("外链图片未压缩；如需 WebP，请先保存为思源资源")
  })
  const urls = new Set(nodes.map((node) => node.url))
  if (cover?.startsWith("assets/")) urls.add(cover)
  else if (cover) warnings.push("外链题头图未压缩；如需 WebP，请先保存为思源资源")
  const mapping = new Map()
  const assets = []
  for (const url of urls) {
    const name = safeRelativePath(decodeURIComponent(url.slice(7)))
    let input
    try { input = readFileSync(join(workspace, "data", "assets", name)) }
    catch (error) { throw new Error(`缺少资源或无法读取：${name}`, { cause: error }) }
    let result
    try { result = await websiteAsset(name, input) }
    catch (error) { throw new Error(`图片转换失败：${name}：${error.message}`, { cause: error }) }
    const output = safeRelativePath(result.name)
    const previous = assets.find((asset) => asset.name === output)
    if (previous && !previous.data.equals(result.data)) throw new Error(`资源名称冲突：${output}`)
    if (!previous) assets.push({ ...result, inputBytes: input.length })
    mapping.set(url, `assets/${id}/${output.split("/").map(encodeURIComponent).join("/")}`)
  }
  const replacements = nodes.map((node) => {
    const source = markdown.slice(node.position.start.offset, node.position.end.offset)
    const from = node.type === "definition" ? source.indexOf("]:") + 2
      : node.type === "link" && node.children.length
        ? node.children.at(-1).position.end.offset - node.position.start.offset
        : source.indexOf("](") + 2
    const offset = source.indexOf(node.url, from)
    if (offset < 0) throw new Error(`无法定位资源链接：${node.url}`)
    return { start: node.position.start.offset + offset, end: node.position.start.offset + offset + node.url.length, url: relativeLink(path, mapping.get(node.url)) }
  })
  for (const replacement of replacements.sort((a, b) => b.start - a.start))
    markdown = markdown.slice(0, replacement.start) + replacement.url + markdown.slice(replacement.end)
  return { markdown, cover: mapping.has(cover) ? `/${mapping.get(cover)}` : cover, assets }
}
