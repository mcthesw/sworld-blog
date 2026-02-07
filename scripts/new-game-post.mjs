#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import path from 'node:path'

/**
 * 游戏文章脚手架。
 *
 * 同步约定（修改时请三处一起检查）：
 * 1) editor-docs/PostMasonry.md（维护文档）
 * 2) docs/.vuepress/components/PostMasonry.vue（卡片解析逻辑）
 * 3) scripts/new-game-post.mjs（新建文章默认 Frontmatter）
 */

const TYPE_META = {
  demo: {
    label: 'Demo体验',
    tags: ['游戏', 'Demo体验', '期待:8.5'],
    note: 'Demo 标签建议：期待:8.5（或 期待值:8.5 / expect:8.5）',
  },
  review: {
    label: '长评',
    tags: ['游戏', '长评', 'score:8.5'],
    note: '长评标签建议：score:8.5（或 评分:8.5）',
  },
  clear: {
    label: '游玩记录',
    tags: ['游戏', '游玩记录', '状态:游玩中'],
    note: '游玩记录状态：通关！/游玩中/搁置/想玩/放弃',
  },
}

function usage() {
  console.log(`
用法:
  node scripts/new-game-post.mjs <demo|review|clear> "游戏名" [--title "标题"] [--permalink "/自定义/"] [--dry-run]

示例:
  pnpm new:game demo "心象天仪本线"
  pnpm new:game review "空洞骑士" --title "空洞骑士长评"
  pnpm new:game clear "杀戮尖塔" --permalink "/2026/02/slaythe12/"
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

function createAbbrlink() {
  return randomBytes(4).toString('hex')
}

function createLegacyPermalink(createTime, abbrlink) {
  const match = createTime.match(/^(\d{4})\/(\d{2})\//)
  if (!match) throw new Error('createTime 格式不正确，无法生成 permalink')
  const [, year, month] = match
  return `/${year}/${month}/${abbrlink}/`
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  const [typeRaw, gameNameRaw] = positional
  const type = typeRaw?.trim()

  if (!type || !gameNameRaw || !(type in TYPE_META)) {
    usage()
    process.exit(1)
  }

  const gameName = sanitizeSegment(gameNameRaw)
  if (!gameName) {
    throw new Error('游戏名不能为空')
  }

  const title = (flags.title ?? gameNameRaw).trim()

  const targetDir = path.join(process.cwd(), 'docs', 'games', type, gameName)
  const targetFile = path.join(targetDir, 'index.md')

  const { label, tags, note } = TYPE_META[type]
  const createTime = nowString()
  const abbrlink = createAbbrlink()
  const permalink = flags.permalink
    ? ensurePermalink(flags.permalink)
    : createLegacyPermalink(createTime, abbrlink)

  const content = `---
# 文章标题（展示在卡片与文章页）
title: ${title}
# 标签：用于标签页与卡片信息
# ${note}
tags:
${tags.map((t) => `  - ${t}`).join('\n')}
# 短链接 ID（用于历史风格 permalink）
abbrlink: ${abbrlink}
# 创建时间（格式：YYYY/MM/DD HH:mm:ss）
createTime: ${createTime}
# 永久链接（默认：/YYYY/MM/abbrlink/，末尾保留 /）
permalink: ${permalink}
# 封面图（可选）
# cover: ${permalink}cover.webp
# 摘要（可选，不填可使用 <!-- more --> 自动截断）
# excerpt: 一句话总结
# 草稿（可选，true 时不会出现在列表中）
# draft: true
---

> ${label}：在这里写你的正文。

<!-- more -->

<!--
图片插入示例（推荐把图片放在当前目录，和 index.md 同级）：

![图注](./cover.webp)

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
