import { execFile, spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import assert from 'node:assert/strict'

const execFileAsync = promisify(execFile)
const projectRoot = path.resolve(import.meta.dirname, '..')
const scriptPath = path.join(projectRoot, '.local', 'scripts', 'new.js')
const testTmpRoot = path.join(projectRoot, '.local', 'test-tmp')

async function makeTempCwd(prefix) {
  await mkdir(testTmpRoot, { recursive: true })
  return mkdtemp(path.join(testTmpRoot, prefix))
}

function runInteractive(lines, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
        return
      }
      reject(new Error(`interactive command failed with code ${code}\n${stdout}\n${stderr}`))
    })

    let index = 0
    const writeNext = () => {
      if (index >= lines.length) {
        child.stdin.end()
        return
      }
      child.stdin.write(`${lines[index]}\n`)
      index += 1
      setTimeout(writeNext, 25)
    }
    writeNext()
  })
}

test('unified new help documents direct and interactive usage', async () => {
  const { stdout } = await execFileAsync(process.execPath, [scriptPath, '--help'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })

  assert.match(stdout, /pnpm new$/m)
  assert.match(stdout, /pnpm new game <demo\|review\|clear>/)
  assert.match(stdout, /pnpm new reading note/)
  assert.match(stdout, /pnpm new post <computer\|misc>/)
})

test('unified new direct mode delegates to post script and preserves flags', async () => {
  const cwd = await makeTempCwd('new-direct-')
  try {
    const { stdout } = await execFileAsync(process.execPath, [
      scriptPath,
      'post',
      'computer',
      '测试文章',
      '--title',
      '自定义标题',
      '--dry-run',
    ], { cwd, encoding: 'utf8' })

    assert.match(stdout, /Dry run: 将创建/)
    assert.match(stdout, /docs[\\/]computer[\\/]测试文章[\\/]index\.md/)
    assert.match(stdout, /title: 自定义标题/)
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})

test('unified new direct mode delegates to game script', async () => {
  const cwd = await makeTempCwd('new-game-')
  try {
    const { stdout } = await execFileAsync(process.execPath, [
      scriptPath,
      'game',
      'demo',
      '测试游戏',
      '--dry-run',
    ], { cwd, encoding: 'utf8' })

    assert.match(stdout, /docs[\\/]games[\\/]demo[\\/]测试游戏[\\/]index\.md/)
    assert.match(stdout, /期待:8\.5/)
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})

test('unified new direct mode delegates to reading script', async () => {
  const cwd = await makeTempCwd('new-reading-')
  try {
    const { stdout } = await execFileAsync(process.execPath, [
      scriptPath,
      'reading',
      'review',
      '测试书',
      '--year',
      '1999',
      '--dry-run',
    ], { cwd, encoding: 'utf8' })

    assert.match(stdout, /docs[\\/]reading[\\/]reviews[\\/]测试书[\\/]index\.md/)
    assert.match(stdout, /年份:1999/)
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})

test('unified new interactive mode accepts numeric selections and required text', async () => {
  const cwd = await makeTempCwd('new-interactive-')
  try {
    await runInteractive([
      '1',
      '1',
      '交互游戏',
      '',
      '',
      'n',
    ], cwd)

    const targetFile = path.join(cwd, 'docs', 'games', 'demo', '交互游戏', 'index.md')
    const targetStat = await stat(targetFile)
    const content = await readFile(targetFile, 'utf8')

    assert.ok(targetStat.size > 0)
    assert.match(content, /title: 交互游戏/)
    assert.match(content, /Demo体验/)
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})
