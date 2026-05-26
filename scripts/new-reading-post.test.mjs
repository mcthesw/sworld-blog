import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import assert from 'node:assert/strict'

const execFileAsync = promisify(execFile)
const projectRoot = path.resolve(import.meta.dirname, '..')
const scriptPath = path.join(projectRoot, '.local', 'scripts', 'new-reading-post.js')
const testTmpRoot = path.join(projectRoot, '.local', 'test-tmp')

async function makeTempCwd() {
  await mkdir(testTmpRoot, { recursive: true })
  return mkdtemp(path.join(testTmpRoot, 'reading-script-'))
}

test('reading note appends current year entries to stream index page', async () => {
  const cwd = await makeTempCwd()
  const streamRoot = path.join(cwd, 'docs', 'reading', 'stream')
  const currentYear = String(new Date().getFullYear())
  const indexFile = path.join(streamRoot, 'README.md')
  const yearFile = path.join(streamRoot, currentYear, 'README.md')

  await mkdir(streamRoot, { recursive: true })
  await writeFile(indexFile, '<!-- reading-stream:end -->\n')

  await execFileAsync(process.execPath, [
    scriptPath,
    'note',
    '测试书',
    '--author',
    '作者',
    '--year',
    '1999',
    '--kind',
    '书籍',
    '--text',
    '测试随读。',
  ], { cwd })

  const indexContent = await readFile(indexFile, 'utf8')

  assert.match(indexContent, /book="测试书"/)
  assert.match(indexContent, /year="1999"/)
  assert.match(indexContent, /测试随读。/)
  await assert.rejects(readFile(yearFile, 'utf8'), { code: 'ENOENT' })

  await rm(cwd, { recursive: true, force: true })
})

test('reading note creates archived year stream page for older dates', async () => {
  const cwd = await makeTempCwd()
  const streamRoot = path.join(cwd, 'docs', 'reading', 'stream')
  const archiveYear = '2025'
  const indexFile = path.join(streamRoot, 'README.md')
  const yearFile = path.join(streamRoot, archiveYear, 'README.md')

  await mkdir(streamRoot, { recursive: true })
  await writeFile(indexFile, '<!-- reading-stream:end -->\n')

  await execFileAsync(process.execPath, [
    scriptPath,
    'note',
    '测试书',
    '--date',
    `${archiveYear}-12-31`,
    '--text',
    '旧年份归档。',
  ], { cwd })

  const indexContent = await readFile(indexFile, 'utf8')
  const yearContent = await readFile(yearFile, 'utf8')

  assert.doesNotMatch(indexContent, /旧年份归档。/)
  assert.match(yearContent, new RegExp(`title: ${archiveYear} 随读流`))
  assert.match(yearContent, new RegExp(`permalink: /reading/stream/${archiveYear}/`))
  assert.match(yearContent, /旧年份归档。/)

  await rm(cwd, { recursive: true, force: true })
})
