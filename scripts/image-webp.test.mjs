import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import test from 'node:test'
import { randomFillSync } from 'node:crypto'
import sharp from 'sharp'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cliPath = path.join(repoRoot, '.local', 'scripts', 'image-webp.js')

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  }).trim()
}

async function writePng(filePath) {
  const width = 1600
  const height = 900
  const pixels = randomFillSync(Buffer.alloc(width * height * 3))
  const buffer = await sharp(pixels, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer()

  writeFileSync(filePath, buffer)
}

test('staged optimizer converts referenced source images and stages rewritten files', async () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'image-webp-test-'))

  try {
    git(cwd, ['init', '--quiet'])
    git(cwd, ['config', 'user.email', 'test@example.com'])
    git(cwd, ['config', 'user.name', 'Test User'])

    const postDir = path.join(cwd, 'docs', 'computer', 'post')
    await mkdir(postDir, { recursive: true })

    const imagePath = path.join(postDir, 'cover.png')
    await writePng(imagePath)

    const markdownPath = path.join(postDir, 'index.md')
    writeFileSync(markdownPath, [
      '---',
      'title: Image WebP Test',
      'cover: cover.png',
      '---',
      '',
      '![cover](cover.png)',
      '![relative](./cover.png?raw=true)',
      '',
    ].join('\n'))

    git(cwd, ['add', 'docs/computer/post/index.md', 'docs/computer/post/cover.png'])

    execFileSync(process.execPath, [cliPath, '--staged', '--stage'], {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
    })

    const webpPath = path.join(postDir, 'cover.webp')
    const webpStats = await stat(webpPath)
    assert.ok(webpStats.size > 0)

    await assert.rejects(stat(imagePath), { code: 'ENOENT' })

    const markdown = await readFile(markdownPath, 'utf8')
    assert.match(markdown, /^cover: cover\.webp$/m)
    assert.match(markdown, /!\[cover\]\(cover\.webp\)/)
    assert.match(markdown, /!\[relative\]\(\.\/cover\.webp\?raw=true\)/)

    const stagedFiles = git(cwd, ['diff', '--cached', '--name-only']).split(/\r?\n/)
    assert.ok(stagedFiles.includes('docs/computer/post/index.md'))
    assert.ok(stagedFiles.includes('docs/computer/post/cover.webp'))
    assert.ok(!stagedFiles.includes('docs/computer/post/cover.png'))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
