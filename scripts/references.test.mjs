import assert from "node:assert/strict"
import test from "node:test"
import { rewriteReferences } from "./lib/references.mjs"

const publicId = "20260101000000-aaaaaaa"
const privateId = "20260101000000-bbbbbbb"
const target = { path: "2026/01/public", title: "公开笔记" }
const convert = (md) =>
  rewriteReferences(md, "2026/02/source", (id) => (id === publicId ? target : undefined))

test("public block references and SiYuan links become document links", () => {
  assert.equal(convert(`((${publicId} '固定文字'))`), "[固定文字](../../2026/01/public)")
  assert.equal(convert(`((${publicId} "动态文字"))`), "[动态文字](../../2026/01/public)")
  assert.equal(convert(`((${publicId}))`), "[公开笔记](../../2026/01/public)")
  assert.equal(convert(`[链接](siyuan://blocks/${publicId})`), "[链接](../../2026/01/public)")
  assert.equal(
    convert(`((${publicId} '带有 [括号] 的文字'))`),
    "[带有 \\[括号\\] 的文字](../../2026/01/public)",
  )
})

test("private references retain their labels but share a generic destination", () => {
  for (const [input, label] of [
    [`((${privateId} '私人标题'))`, "私人标题"],
    [`((${privateId} \"私人动态标题\"))`, "私人动态标题"],
    [`((${privateId}))`, "不公开页面"],
    [`[私人别名](siyuan://blocks/${privateId} \"私人提示\")`, "私人别名"],
  ]) {
    assert.equal(convert(input), `[${label}](../../not-public)`)
    assert.ok(!convert(input).includes(privateId))
  }
})

test("reference-looking examples in code remain literal", () => {
  const md = `\`((${privateId} '示例'))\`\n\n\`\`\`md\n[示例](siyuan://blocks/${privateId})\n\`\`\``
  assert.equal(convert(md), md)
})

test("unsupported SiYuan reference forms fail closed", () => {
  for (const md of [
    `[私人别名][ref]\n\n[ref]: siyuan://blocks/${privateId}`,
    `<a href="siyuan://blocks/${privateId}">私人标题</a>`,
    `((${privateId} 未加引号的文字))`,
  ]) {
    assert.throws(() => convert(md), /未支持的思源引用格式/)
  }
})
