import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import sharp from 'sharp'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cliPath = path.join(repoRoot, '.local', 'scripts', 'privacy-guard.js')
const configPath = path.join(repoRoot, 'privacy-guard.config.json')

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  }).trim()
}

test('privacy guard accepts WebP images without readable GPS metadata', async () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'privacy-guard-test-'))

  try {
    git(cwd, ['init', '--quiet'])
    git(cwd, ['config', 'user.email', 'test@example.com'])
    git(cwd, ['config', 'user.name', 'Test User'])

    writeFileSync(path.join(cwd, 'privacy-guard.config.json'), await readFile(configPath, 'utf8'))

    const postDir = path.join(cwd, 'docs', 'computer', 'post')
    await mkdir(postDir, { recursive: true })
    const webpPath = path.join(postDir, 'cover.webp')
    const buffer = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: '#2563eb',
      },
    })
      .webp()
      .toBuffer()
    writeFileSync(webpPath, buffer)

    git(cwd, ['add', 'privacy-guard.config.json', 'docs/computer/post/cover.webp'])

    execFileSync(process.execPath, [cliPath, '--staged'], {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
    })
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
