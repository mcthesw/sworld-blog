#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import path from 'node:path'

/**
 * 阅读板块脚手架。
 *
 * 同步约定（修改时请三处一起检查）：
 * 1) editor-docs/Reading.md（维护文档）
 * 2) docs/.vuepress/components/Reading*.vue（展示组件）
 * 3) scripts/new-reading-post.ts（新建随读/长文模板）
 */

type CliFlags = {
  dryRun?: boolean
  title?: string
  permalink?: string
  author?: string
  year?: string
  date?: string
  kind?: string
  status?: string
  progress?: string
  tags?: string
  text?: string
  review?: string
  anki?: string
  telegram?: string
  stream?: string
  [key: string]: string | boolean | undefined
}

const STREAM_DIR = path.join(process.cwd(), 'docs', 'reading', 'stream')
const STREAM_INDEX_FILE = path.join(STREAM_DIR, 'README.md')
const STREAM_END_MARKER = '<!-- reading-stream:end -->'

function usage(): void {
  console.log(`
用法:
  pnpm new reading note "作品名" [--author "作者"] [--year "2016"] [--date "2026-05-26"] [--kind "漫画"] [--status "在读"] [--progress "第 1 卷"] [--tags "标签1,标签2"] [--text "短记录"] [--dry-run]
  pnpm new reading review "作品名" [--title "标题"] [--author "作者"] [--year "2016"] [--kind "书籍"] [--permalink "/自定义/"] [--stream "/reading/stream/#note-id"] [--anki "https://..."] [--dry-run]

示例:
  pnpm new reading note "炎拳" --author "藤本树" --year "2016-2018" --kind "漫画" --status "在读" --text "先记一笔。"
  pnpm new reading review "炎拳" --title "《炎拳》读后" --year "2016-2018"
`)
}

function parseArgs(argv: string[]): { positional: string[]; flags: CliFlags } {
  const positional: string[] = []
  const flags: CliFlags = {}

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

function nowString(): string {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function dateString(input = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(input.getDate())}`
}

function currentNoteDate(flags: CliFlags): string {
  if (typeof flags.date === 'string' && flags.date.trim()) {
    return flags.date.trim()
  }
  return dateString()
}

function notePageYear(date: string): string {
  const match = date.match(/^(\d{4})-/)
  return match?.[1] ?? String(new Date().getFullYear())
}

function calendarYear(): string {
  return String(new Date().getFullYear())
}

function sanitizeSegment(input: string): string {
  return input
    .trim()
    .replace(/[\\/]/g, '-')
    .replace(/\s+/g, '-')
}

function ensurePermalink(input: string): string {
  let out = input.trim()
  if (!out.startsWith('/')) out = `/${out}`
  if (!out.endsWith('/')) out = `${out}/`
  return out
}

function createAbbrlink(): string {
  return randomBytes(4).toString('hex')
}

function createLegacyPermalink(createTime: string, abbrlink: string): string {
  const match = createTime.match(/^(\d{4})\/(\d{2})\//)
  if (!match) throw new Error('createTime 格式不正确，无法生成 permalink')
  const [, year, month] = match
  return `/${year}/${month}/${abbrlink}/`
}

function attr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function optionalAttr(name: string, value: string | boolean | undefined): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  return `\n  ${name}="${attr(value.trim())}"`
}

function noteBlock(name: string, flags: CliFlags): string {
  const noteDate = currentNoteDate(flags)
  const id = `reading-${noteDate}-${createAbbrlink()}`
  const text = typeof flags.text === 'string' && flags.text.trim()
    ? flags.text.trim()
    : '先记一笔，之后再补。'

  return `<ReadingNote
  id="${id}"
  book="${attr(name)}"${optionalAttr('author', flags.author)}${optionalAttr('year', flags.year)}${optionalAttr('kind', flags.kind)}${optionalAttr('status', flags.status)}${optionalAttr('date', noteDate)}${optionalAttr('progress', flags.progress)}${optionalAttr('tags', flags.tags)}${optionalAttr('review', flags.review)}${optionalAttr('anki', flags.anki)}${optionalAttr('telegram', flags.telegram)}
>

${text}

</ReadingNote>`
}

function yearStreamTemplate(year: string): string {
  return `---
title: ${year} 随读流
pageLayout: home
home: true
comment: false
article: false
createTime: ${nowString()}
permalink: /reading/stream/${year}/
config:
  - type: custom
---

## ${year} 随读流

<ReadingStream>

<!-- reading-stream:start -->

<!-- reading-stream:end -->

</ReadingStream>
`
}

function streamIndexTemplate(year: string): string {
  return `---
title: 随读流
pageLayout: home
home: true
comment: false
article: false
createTime: ${nowString()}
permalink: /reading/stream/
config:
  - type: custom
---

## 随读流

### 目录

- [${year}](#_${year})

## ${year}

<ReadingStream>

<!-- reading-stream:start -->

<!-- reading-stream:end -->

</ReadingStream>
`
}

async function ensureStreamFile(targetFile: string, template: string): Promise<string> {
  try {
    await readFile(targetFile, 'utf8')
  } catch {
    await mkdir(path.dirname(targetFile), { recursive: true })
    await writeFile(targetFile, template, { flag: 'wx' })
  }
  return targetFile
}

async function ensureStreamIndexFile(year: string): Promise<string> {
  return ensureStreamFile(STREAM_INDEX_FILE, streamIndexTemplate(year))
}

async function ensureYearStreamFile(year: string): Promise<string> {
  return ensureStreamFile(path.join(STREAM_DIR, year, 'README.md'), yearStreamTemplate(year))
}

async function appendNote(name: string, flags: CliFlags): Promise<void> {
  const block = noteBlock(name, flags)
  if (flags.dryRun) {
    console.log(block)
    return
  }

  const targetYear = notePageYear(currentNoteDate(flags))
  const targetFile = targetYear === calendarYear()
    ? await ensureStreamIndexFile(targetYear)
    : await ensureYearStreamFile(targetYear)
  const content = await readFile(targetFile, 'utf8')
  const markerIndex = content.indexOf(STREAM_END_MARKER)
  if (markerIndex < 0) {
    throw new Error(`未找到随读流插入标记：${STREAM_END_MARKER}`)
  }

  const next = `${content.slice(0, markerIndex).trimEnd()}\n\n${block}\n\n${content.slice(markerIndex)}`
  await writeFile(targetFile, next)
  console.log(`已追加随读记录: ${targetFile}`)
}

async function createReview(name: string, flags: CliFlags): Promise<void> {
  const fileName = sanitizeSegment(name)
  if (!fileName) throw new Error('作品名不能为空')

  const title = (typeof flags.title === 'string' ? flags.title : `《${name}》读后`).trim()
  const targetDir = path.join(process.cwd(), 'docs', 'reading', 'reviews', fileName)
  const targetFile = path.join(targetDir, 'index.md')
  const createTime = nowString()
  const abbrlink = createAbbrlink()
  const permalink = typeof flags.permalink === 'string'
    ? ensurePermalink(flags.permalink)
    : createLegacyPermalink(createTime, abbrlink)

  const extraTags = [
    typeof flags.kind === 'string' ? flags.kind.trim() : '',
    typeof flags.author === 'string' ? `作者:${flags.author.trim()}` : '',
    typeof flags.year === 'string' ? `年份:${flags.year.trim()}` : '',
  ].filter(Boolean)

  const links = [
    typeof flags.stream === 'string' ? `  stream="${attr(flags.stream)}"` : '',
    typeof flags.anki === 'string' ? `  anki="${attr(flags.anki)}"` : '',
    typeof flags.telegram === 'string' ? `  telegram="${attr(flags.telegram)}"` : '',
  ].filter(Boolean)

  const content = `---
title: ${title}
tags:
  - 阅读
  - 长文
${extraTags.map((tag) => `  - ${tag}`).join('\n')}
abbrlink: ${abbrlink}
createTime: ${createTime}
permalink: ${permalink}
${typeof flags.year === 'string' && flags.year.trim() ? `year: ${flags.year.trim()}\n` : ''}# excerpt: 一句话总结
# cover: ${permalink}cover.webp
# draft: true
---

${links.length ? `<ReadingLinks
  title="相关材料"
${links.join('\n')}
/>

` : ''}## 读完后想说

在这里写完整长文。

<!-- more -->
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

async function main(): Promise<void> {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  const [mode, name] = positional

  if (!mode || !name || (mode !== 'note' && mode !== 'review')) {
    usage()
    process.exit(1)
  }

  if (mode === 'note') {
    await appendNote(name, flags)
    return
  }

  await createReview(name, flags)
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`创建失败: ${message}`)
  process.exit(1)
})
