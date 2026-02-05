#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'node:fs/promises'
import path from 'node:path'

const OLD_IMAGES_DIR = '/home/sworld/old/sworld-blog/source/images'
const NEW_PUBLIC_IMAGES_DIR = path.resolve('docs/.vuepress/public/images')

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
  if (!(await exists(OLD_IMAGES_DIR))) {
    console.error(`Old images dir not found: ${OLD_IMAGES_DIR}`)
    process.exitCode = 1
    return
  }

  await fs.mkdir(NEW_PUBLIC_IMAGES_DIR, { recursive: true })

  const entries = await fs.readdir(OLD_IMAGES_DIR, { withFileTypes: true })
  const files = entries.filter(e => e.isFile()).map(e => e.name)

  let copied = 0
  let skipped = 0

  for (const name of files) {
    const src = path.join(OLD_IMAGES_DIR, name)
    const dst = path.join(NEW_PUBLIC_IMAGES_DIR, name)
    if (await exists(dst)) {
      skipped += 1
      continue
    }
    await fs.copyFile(src, dst)
    copied += 1
  }

  console.log(`Done. copied=${copied} skipped(existing)=${skipped}`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
