#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * 通用文章脚手架（computer / misc）。
 *
 * 同步约定（修改时请三处一起检查）：
 * 1) editor-docs/（维护文档约定）
 * 2) docs/.vuepress/components/*.vue（列表/卡片展示逻辑）
 * 3) scripts/new-post.mjs（新建文章默认 Frontmatter）
 */

const SECTION_META = {
  computer: {
    label: '计算机',
    defaultTags: ['计算机'],
    note: '常见标签：Rust / Vue / Linux / 错误解决 等',
  },
  misc: {
    label: '杂项',
    defaultTags: ['杂项'],
    note: '按内容自定义标签即可',
  },
}

function usage() {
  console.log(`
用法:
  node scripts/new-post.mjs <computer|misc> "文章名" [--title "标题"] [--permalink "/自定义/"] [--dry-run]

示例:
  pnpm new:post computer "Rust异步踩坑记录"
  pnpm new:post misc "随记-2026-02"
`)
}

function parseArgs(argv) {
  const positional = []
  const flags = {}

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      positional.push(arg)
      continue
    }

    if (arg === '--dry-run') {
      flags.dryRun = true
      continue
    }

    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      throw new Error(`参数 ${arg} 需要一个值`)
    }
    flags[arg.slice(2)] = next
    i += 1
  }

  return { positional, flags }
}

function nowString() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function sanitizeSegment(input) {
  return input
    .trim()
    .replace(/[\\/]/g, '-')
    .replace(/\s+/g, '-')
}

function ensurePermalink(input) {
  let out = input.trim()
  if (!out.startsWith('/')) out = `/${out}`
  if (!out.endsWith('/')) out = `${out}/`
  return out
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  const [sectionRaw, nameRaw] = positional
  const section = sectionRaw?.trim()

  if (!section || !nameRaw || !(section in SECTION_META)) {
    usage()
    process.exit(1)
  }

  const fileName = sanitizeSegment(nameRaw)
  if (!fileName) {
    throw new Error('文章名不能为空')
  }

  const title = (flags.title ?? nameRaw).trim()
  const permalink = flags.permalink
    ? ensurePermalink(flags.permalink)
    : `/${section}/${fileName}/`

  const targetDir = path.join(process.cwd(), 'docs', section, fileName)
  const targetFile = path.join(targetDir, 'index.md')

  const { label, defaultTags, note } = SECTION_META[section]
  const createTime = nowString()

  const content = `---
# 文章标题（展示在列表与文章页）
title: ${title}
# 标签（用于标签页与检索）
# ${note}
tags:
${defaultTags.map((t) => `  - ${t}`).join('\n')}
# 创建时间（格式：YYYY/MM/DD HH:mm:ss）
createTime: ${createTime}
# 永久链接（建议唯一，末尾保留 /）
permalink: ${permalink}
# 封面图（可选）
# cover: ${permalink}cover.webp
# 摘要（可选，不填可用 <!-- more --> 截断正文）
# excerpt: 一句话总结
# 草稿（可选，true 时不会出现在列表中）
# draft: true
---

> ${label}文章：在这里开始写正文。

<!-- more -->

<!--
图片插入示例（推荐把图片放在当前目录，和 index.md 同级）：

![图注](./1.webp)

如果图片在 public 目录：

![图注](/images/xxx.png)
-->
`

  if (flags.dryRun) {
    console.log(`Dry run: 将创建 ${targetFile}`)
    console.log('-----')
    console.log(content)
    return
  }

  await mkdir(targetDir, { recursive: true })
  await writeFile(targetFile, content, { flag: 'wx' })

  console.log(`已创建: ${targetFile}`)
}

main().catch((err) => {
  console.error(`创建失败: ${err.message}`)
  process.exit(1)
})
