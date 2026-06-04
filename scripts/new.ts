#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { emitKeypressEvents } from 'node:readline'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import path from 'node:path'

type AuthoringKind = 'game' | 'reading' | 'post'
type GameType = 'demo' | 'review' | 'clear'
type ReadingMode = 'note' | 'review'
type PostSection = 'computer' | 'misc'
type ReadlineInterface = ReturnType<typeof createInterface>

class Prompt {
  #rl: ReadlineInterface | undefined
  #lines: AsyncIterator<string> | undefined

  async question(label: string): Promise<string> {
    this.#rl ??= createInterface({ input, output })
    this.#lines ??= this.#rl[Symbol.asyncIterator]()
    output.write(label)
    const next = await this.#lines.next()
    return next.done ? '' : next.value
  }

  close(): void {
    this.#rl?.close()
  }
}

const DISPATCH: Record<AuthoringKind, string> = {
  game: 'new-game-post.js',
  reading: 'new-reading-post.js',
  post: 'new-post.js',
}

const CHOICES = {
  kind: ['game', 'reading', 'post'],
  game: ['demo', 'review', 'clear'],
  reading: ['note', 'review'],
  post: ['computer', 'misc'],
} as const

function usage(): void {
  console.log(`
用法:
  pnpm new
  pnpm new game <demo|review|clear> "游戏名" [--title "标题"] [--permalink "/自定义/"] [--dry-run]
  pnpm new reading note "作品名" [--author "作者"] [--year "2016"] [--date "2026-05-26"] [--kind "漫画"] [--status "在读"] [--progress "第 1 卷"] [--tags "标签1,标签2"] [--text "短记录"] [--dry-run]
  pnpm new reading review "作品名" [--title "标题"] [--author "作者"] [--year "2016"] [--kind "书籍"] [--permalink "/自定义/"] [--stream "/reading/stream/#note-id"] [--anki "https://..."] [--telegram "https://..."] [--dry-run]
  pnpm new post <computer|misc> "文章名" [--title "标题"] [--permalink "/自定义/"] [--dry-run]

示例:
  pnpm new
  pnpm new game demo "心象天仪本线"
  pnpm new reading note "炎拳" --author "藤本树" --year "2016-2018" --kind "漫画" --status "在读" --text "先记一笔。"
  pnpm new reading review "炎拳" --title "《炎拳》读后" --year "2016-2018"
  pnpm new post computer "Rust异步踩坑记录"
`)
}

function isHelp(argv: string[]): boolean {
  return argv.includes('--help') || argv.includes('-h')
}

function scriptPath(kind: AuthoringKind): string {
  return path.join(import.meta.dirname, DISPATCH[kind])
}

async function runScript(kind: AuthoringKind, args: string[]): Promise<void> {
  const child = spawn(process.execPath, [scriptPath(kind), ...args], {
    stdio: 'inherit',
    windowsHide: true,
  })

  const code = await new Promise<number | null>((resolve) => {
    child.on('close', resolve)
  })

  if (code !== 0) {
    process.exit(code ?? 1)
  }
}

function directArgs(argv: string[]): { kind: AuthoringKind; args: string[] } {
  const [kind, ...args] = argv
  if (kind === 'game' || kind === 'reading' || kind === 'post') {
    return { kind, args }
  }

  throw new Error(`未知类型：${kind}`)
}

function printMenu<T extends readonly string[]>(label: string, choices: T): void {
  console.log(label)
  choices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice}`)
  })
}

function isInteractiveTty(): boolean {
  return Boolean(input.isTTY && output.isTTY && input.setRawMode)
}

async function selectChoice<T extends readonly string[]>(label: string, choices: T): Promise<T[number]> {
  emitKeypressEvents(input)
  input.setRawMode?.(true)
  input.resume()

  let selected = 0
  let renderedLines = 0

  const render = (): void => {
    if (renderedLines > 0) {
      output.write(`\x1b[${renderedLines}A\x1b[0J`)
    }

    const lines = [
      label,
      ...choices.map((choice, index) => {
        const pointer = index === selected ? '>' : ' '
        const text = index === selected ? `\x1b[36m${choice}\x1b[0m` : choice
        return `  ${pointer} ${text}`
      }),
    ]
    output.write(`${lines.join('\n')}\n`)
    renderedLines = lines.length
  }

  return new Promise<T[number]>((resolve, reject) => {
    const cleanup = (): void => {
      input.off('keypress', onKeypress)
      input.setRawMode?.(false)
      output.write('\n')
    }

    const onKeypress = (_text: string, key: { name?: string; ctrl?: boolean }): void => {
      if (key.ctrl && key.name === 'c') {
        cleanup()
        reject(new Error('已取消'))
        return
      }

      if (key.name === 'up') {
        selected = (selected - 1 + choices.length) % choices.length
        render()
        return
      }

      if (key.name === 'down') {
        selected = (selected + 1) % choices.length
        render()
        return
      }

      if (key.name === 'return' || key.name === 'enter') {
        const choice = choices[selected]
        cleanup()
        resolve(choice)
      }
    }

    input.on('keypress', onKeypress)
    render()
  })
}

async function askChoice<T extends readonly string[]>(
  prompt: Prompt,
  label: string,
  choices: T,
): Promise<T[number]> {
  if (isInteractiveTty()) {
    return selectChoice(label, choices)
  }

  while (true) {
    printMenu(label, choices)
    const answer = (await prompt.question('请选择: ')).trim()
    const numeric = Number(answer)
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= choices.length) {
      return choices[numeric - 1]
    }

    const matched = choices.find((choice) => choice === answer)
    if (matched) return matched

    console.log('输入无效，请输入序号或名称。')
  }
}

async function askRequired(prompt: Prompt, label: string): Promise<string> {
  while (true) {
    const answer = (await prompt.question(`${label}: `)).trim()
    if (answer) return answer
    console.log('这里不能为空。')
  }
}

async function askOptional(prompt: Prompt, label: string): Promise<string | undefined> {
  const answer = (await prompt.question(`${label}（可空）: `)).trim()
  return answer || undefined
}

async function askYesNo(prompt: Prompt, label: string): Promise<boolean> {
  const answer = (await prompt.question(`${label} [y/N]: `)).trim().toLowerCase()
  return answer === 'y' || answer === 'yes'
}

function pushFlag(args: string[], name: string, value: string | undefined): void {
  if (!value) return
  args.push(name, value)
}

async function interactiveGame(prompt: Prompt): Promise<string[]> {
  const type = await askChoice(prompt, '选择游戏文章类型', CHOICES.game) as GameType
  const name = await askRequired(prompt, '游戏名')
  const args = [type, name]
  pushFlag(args, '--title', await askOptional(prompt, '标题'))
  pushFlag(args, '--permalink', await askOptional(prompt, 'permalink'))
  if (await askYesNo(prompt, 'dry-run')) args.push('--dry-run')
  return args
}

async function interactiveReading(prompt: Prompt): Promise<string[]> {
  const mode = await askChoice(prompt, '选择阅读内容类型', CHOICES.reading) as ReadingMode
  const name = await askRequired(prompt, '作品名')
  const args = [mode, name]

  if (mode === 'note') {
    pushFlag(args, '--author', await askOptional(prompt, '作者'))
    pushFlag(args, '--year', await askOptional(prompt, '作品年份'))
    pushFlag(args, '--date', await askOptional(prompt, '记录日期 YYYY-MM-DD'))
    pushFlag(args, '--kind', await askOptional(prompt, '类型'))
    pushFlag(args, '--status', await askOptional(prompt, '状态'))
    pushFlag(args, '--progress', await askOptional(prompt, '进度'))
    pushFlag(args, '--tags', await askOptional(prompt, '标签（逗号分隔）'))
    pushFlag(args, '--text', await askOptional(prompt, '短记录'))
  } else {
    pushFlag(args, '--title', await askOptional(prompt, '标题'))
    pushFlag(args, '--author', await askOptional(prompt, '作者'))
    pushFlag(args, '--year', await askOptional(prompt, '作品年份'))
    pushFlag(args, '--kind', await askOptional(prompt, '类型'))
    pushFlag(args, '--permalink', await askOptional(prompt, 'permalink'))
    pushFlag(args, '--stream', await askOptional(prompt, '随读链接'))
    pushFlag(args, '--anki', await askOptional(prompt, 'Anki 链接'))
    pushFlag(args, '--telegram', await askOptional(prompt, 'Telegram 链接'))
  }

  if (await askYesNo(prompt, 'dry-run')) args.push('--dry-run')
  return args
}

async function interactivePost(prompt: Prompt): Promise<string[]> {
  const section = await askChoice(prompt, '选择普通文章分类', CHOICES.post) as PostSection
  const name = await askRequired(prompt, '文章名')
  const args = [section, name]
  pushFlag(args, '--title', await askOptional(prompt, '标题'))
  pushFlag(args, '--permalink', await askOptional(prompt, 'permalink'))
  if (await askYesNo(prompt, 'dry-run')) args.push('--dry-run')
  return args
}

async function interactiveArgs(): Promise<{ kind: AuthoringKind; args: string[] }> {
  const prompt = new Prompt()
  try {
    const kind = await askChoice(prompt, '选择要创建的内容', CHOICES.kind) as AuthoringKind
    if (kind === 'game') return { kind, args: await interactiveGame(prompt) }
    if (kind === 'reading') return { kind, args: await interactiveReading(prompt) }
    return { kind, args: await interactivePost(prompt) }
  } finally {
    prompt.close()
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  if (isHelp(argv)) {
    usage()
    return
  }

  const { kind, args } = argv.length ? directArgs(argv) : await interactiveArgs()
  await runScript(kind, args)
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`创建失败: ${message}`)
  usage()
  process.exit(1)
})
