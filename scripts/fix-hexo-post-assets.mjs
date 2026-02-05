#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'node:fs/promises'
import path from 'node:path'

const POSTS_ROOT = path.resolve('docs/blog/计算机')

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
  if (!(await exists(POSTS_ROOT))) {
    console.error(`Posts root not found: ${POSTS_ROOT}`)
    process.exitCode = 1
    return
  }

  const entries = await fs.readdir(POSTS_ROOT, { withFileTypes: true })
  const postDirs = entries.filter(e => e.isDirectory()).map(e => e.name)

  let moved = 0
  let skipped = 0
  let removed = 0

  for (const postDirName of postDirs) {
    const postDir = path.join(POSTS_ROOT, postDirName)
    const assetsDir = path.join(postDir, 'index')
    if (!(await exists(assetsDir)))
      continue

    const files = await fs.readdir(assetsDir, { withFileTypes: true })
    for (const f of files) {
      if (!f.isFile())
        continue
      const src = path.join(assetsDir, f.name)
      const dst = path.join(postDir, f.name)
      if (await exists(dst)) {
        skipped += 1
        continue
      }
      await fs.rename(src, dst)
      moved += 1
    }

    const remain = await fs.readdir(assetsDir)
    if (remain.length === 0) {
      await fs.rmdir(assetsDir)
      removed += 1
    }
  }

  console.log(`Done. moved=${moved} skipped(existing)=${skipped} removedEmptyDirs=${removed}`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
