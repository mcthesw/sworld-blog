#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import yaml from 'js-yaml'

const OLD_POSTS_DIR = '/home/sworld/old/sworld-blog/source/_posts'
const NEW_POSTS_DIR = path.resolve('docs/blog/计算机')

const matterOptions = {
  // Prevent YAML timestamps being auto-converted to Date.
  engines: {
    yaml: {
      parse: (s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }),
      stringify: (data) => yaml.dump(data, { schema: yaml.JSON_SCHEMA, lineWidth: 0 }),
    },
  },
}

function toCreateTime(dateStr) {
  // Hexo: YYYY-MM-DD HH:mm:ss
  // Or after some tooling: YYYY-MM-DDTHH:mm:ss.sssZ
  // Plume examples: YYYY/MM/DD HH:mm:ss
  if (!dateStr)
    return undefined

  const m = String(dateStr).match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+|T)(\d{2}):(\d{2}):(\d{2})/,
  )
  if (!m)
    return undefined
  const [, y, mo, d, hh, mm, ss] = m
  return `${y}/${mo}/${d} ${hh}:${mm}:${ss}`
}

function toPermalink(dateStr, abbrlink) {
  if (!dateStr || !abbrlink)
    return undefined

  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m)
    return undefined
  const [, y, mo] = m
  // Match old Hexo permalink: /:year/:month/:abbrlink/
  return `/${y}/${mo}/${abbrlink}/`
}

async function exists(p) {
  try {
    await fs.access(p)
    return true
  }
  catch {
    return false
  }
}

async function main() {
  if (!(await exists(OLD_POSTS_DIR))) {
    console.error(`Old posts dir not found: ${OLD_POSTS_DIR}`)
    process.exitCode = 1
    return
  }

  await fs.mkdir(NEW_POSTS_DIR, { recursive: true })

  const entries = await fs.readdir(OLD_POSTS_DIR, { withFileTypes: true })
  const postDirs = entries.filter(e => e.isDirectory()).map(e => e.name)

  let copied = 0
  let skipped = 0
  let updated = 0

  for (const dirName of postDirs) {
    const srcDir = path.join(OLD_POSTS_DIR, dirName)
    const dstDir = path.join(NEW_POSTS_DIR, dirName)

    if (!(await exists(dstDir))) {
      await fs.cp(srcDir, dstDir, { recursive: true })
      copied += 1
    }
    else {
      skipped += 1
    }

    const mdPath = path.join(dstDir, 'index.md')
    if (!(await exists(mdPath)))
      continue

    const raw = await fs.readFile(mdPath, 'utf8')
    const parsed = matter(raw, matterOptions)
    const fm = { ...parsed.data }

    const date = fm.date
    const abbrlink = fm.abbrlink

    // Preserve existing title/tags; ensure createTime/permalink match old Hexo URLs.
    const createTime = toCreateTime(date)
    if (createTime)
      fm.createTime = createTime

    const permalink = toPermalink(date, abbrlink)
    if (permalink)
      fm.permalink = permalink

    // Ensure tags are an array if present.
    if (typeof fm.tags === 'string')
      fm.tags = [fm.tags]

    const out = matter.stringify(parsed.content, fm, matterOptions)
    if (out !== raw) {
      await fs.writeFile(mdPath, out, 'utf8')
      updated += 1
    }
  }

  console.log(`Done. copied=${copied} updated=${updated} skipped(existing)=${skipped}`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
