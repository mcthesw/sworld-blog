import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import handler from "serve-handler"
import { parse } from "yaml"

const { values } = parseArgs({ options: {
  mode: { type: "string" }, workspace: { type: "string" }, root: { type: "string" },
  stage: { type: "string" }, id: { type: "string", multiple: true },
} })
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const root = resolve(values.root || "D:/Coding/temp/sworld-publisher")
const workspace = values.workspace && resolve(values.workspace)
const inside = (parent, child) => { const r = relative(parent, child); return !r || (!r.startsWith(".." + sep) && r !== ".." && !isAbsolute(r)) }
if (!workspace || !existsSync(join(workspace, "data"))) throw new Error("需要有效的思源工作区")
if (inside(repo, root) || inside(workspace, root) || inside(root, repo) || inside(root, workspace)) throw new Error("预览目录必须与仓库、思源工作区相互独立")
const env = { ...process.env, SIYUAN_WORKSPACE: workspace }
const result = (data) => console.log("SWORLD_RESULT " + JSON.stringify(data))
function cli(...args) {
  return execFileSync("siyuan", [...args, "--workspace", workspace, "-f", "json", "-v", "off"], { encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 })
}
function run(script, args, cwd) {
  const child = spawnSync(process.execPath, [join(repo, script), ...args], { cwd, env, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
  if (child.stdout) process.stdout.write(child.stdout)
  if (child.stderr) process.stderr.write(child.stderr)
  if (child.error || child.status !== 0) throw child.error ?? new Error(`${script} 失败（${child.status}）`)
}
function inventory(dir) {
  const entries = {}
  function walk(folder) {
    if (!existsSync(folder)) return
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = join(folder, entry.name)
      if (entry.isSymbolicLink()) throw new Error(`不支持符号链接：${file}`)
      if (entry.isDirectory()) walk(file)
      else entries[relative(dir, file).split(sep).join("/")] = createHash("sha256").update(readFileSync(file)).digest("hex")
    }
  }
  walk(dir)
  return entries
}
function same(a, b) { return Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k,v]) => b[k] === v) }
function changes(before, after, stage) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort().filter((file) => before[file] !== after[file]).map((file) => {
    let title
    if (file.endsWith(".md")) {
      const source = join(after[file] ? stage : repo, "content", file)
      const head = readFileSync(source, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
      title = head && parse(head)?.title
    }
    return { file, title, action: !after[file] ? "remove" : !before[file] ? "add" : "update" }
  })
}
function stageData() {
  if (!values.stage) throw new Error("缺少预览批次")
  const stage = resolve(values.stage)
  if (dirname(stage) !== root || !/^batch-/.test(relative(root, stage))) throw new Error("无效的预览批次路径")
  const data = JSON.parse(readFileSync(join(stage, "batch.json"), "utf8"))
  if (data.repo !== repo || data.workspace !== workspace) throw new Error("预览批次与当前仓库或工作区不一致")
  return { stage, data }
}

if (["preview", "prepare"].includes(values.mode)) {
  const ids = values.id ?? []
  if (ids.some((id) => !/^\d{14}-[a-z0-9]{7}$/.test(id))) throw new Error("无效的思源文档 ID")
  if (values.mode === "preview" && !ids.length) throw new Error("请先选择要预览的文档")
  const actualWorkspace = resolve(JSON.parse(cli("workspace", "info")).path)
  if (actualWorkspace.toLowerCase() !== workspace.toLowerCase()) throw new Error("CLI 与思源窗口的工作区不一致")
  const published = JSON.parse(cli("sql", "select b.id from blocks b where b.type = 'd' and b.id in (select block_id from attributes where name = 'custom-publish' and value = 'true')", "--limit", "10000")).map((doc) => doc.id)
  if (values.mode === "prepare" && !published.length) throw new Error("尚未设置允许公开的文章，请先保存公开设置；未公开文章可单独预览")
  const selected = [...new Set([...published, ...ids])]
  const before = inventory(join(repo, "content"))
  mkdirSync(root, { recursive: true })
  const stage = mkdtempSync(join(root, "batch-"))
  try {
    cpSync(join(repo, "content"), join(stage, "content"), { recursive: true })
    const args = ["--snapshot", ...selected.flatMap((id) => ["--id", id])]
    run("scripts/sync-siyuan.mjs", args, stage)
    run("quartz/bootstrap-cli.mjs", ["build", "-d", join(stage, "content"), "-o", join(stage, "public"), "--concurrency", "1"], repo)
    const after = inventory(join(stage, "content"))
    const diff = changes(before, after, stage)
    const pages = Object.keys(after).filter((file) => file.endsWith(".md")).flatMap((file) => {
      const text = readFileSync(join(stage, "content", file), "utf8")
      const head = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
      const fm = head && parse(head)
      return fm?.source === "siyuan" ? [{ id: fm["siyuan-id"], title: fm.title, path: file.slice(0, -3) }] : []
    })
    const data = { repo, workspace, mode: values.mode, published, before, after, changes: diff, pages }
    writeFileSync(join(stage, "batch.json"), JSON.stringify(data, null, 2))
    result({ stage, mode: values.mode, changes: diff, pages })
  } catch (error) {
    rmSync(stage, { recursive: true, force: true })
    if (error.stderr) process.stderr.write(error.stderr)
    throw error
  }
} else if (values.mode === "apply") {
  const { stage, data } = stageData()
  if (data.mode !== "prepare") throw new Error("未公开文章的预览不能写入网站目录；请先检查公开列表")
  const published = JSON.parse(cli("sql", "select b.id from blocks b where b.type = 'd' and b.id in (select block_id from attributes where name = 'custom-publish' and value = 'true')", "--limit", "10000")).map((doc) => doc.id)
  if (!published.length || !data.pages?.length) throw new Error("公开列表或快照为空，不能导出空站点；请设置公开文章后重新检查")
  if (JSON.stringify(published.sort()) !== JSON.stringify(data.published.sort())) throw new Error("公开列表已变化，请重新检查")
  if (!same(data.before, inventory(join(repo, "content")))) throw new Error("网站内容已变化，请重新检查后再导出")
  if (!same(data.after, inventory(join(stage, "content")))) throw new Error("预览文件已变化，请重新检查")
  // Derive operations from verified inventories, never editable display metadata.
  const diff = changes(data.before, data.after, stage)
  for (const change of diff.filter((item) => item.action !== "remove")) {
    const target = join(repo, "content", change.file)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(join(stage, "content", change.file), target)
  }
  for (const change of diff.filter((item) => item.action === "remove")) rmSync(join(repo, "content", change.file))
  result({ applied: true, count: diff.length })
} else if (values.mode === "publish") {
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }).trim()
  if (!git("status", "--porcelain", "--", "content")) throw new Error("content/ 没有需要发布的变更")
  git("fetch", "origin", "main")
  try { git("merge-base", "--is-ancestor", "origin/main", "HEAD") }
  catch { throw new Error("本地分支不包含线上 main 的最新提交，请先同步后再发布") }
  // 只提交 content/，仓库里其他未提交的修改保持原样。
  git("add", "-A", "--", "content")
  git("commit", "-m", "content: publish from siyuan", "--", "content")
  git("push", "origin", "HEAD:main")
  result({ published: true, commit: git("rev-parse", "--short", "HEAD") })
} else if (values.mode === "serve") {
  const { stage } = stageData()
  const server = createServer((request, response) => {
    if (request.headers.host !== `127.0.0.1:${server.address().port}`) { response.statusCode = 403; response.end("Local preview only"); return }
    response.setHeader("Cache-Control", "no-store")
    handler(request, response, { public: join(stage, "public"), cleanUrls: true, directoryListing: false })
      .catch(() => { response.statusCode = 500; response.end("Preview error") })
  })
  server.listen(0, "127.0.0.1", () => result({ url: `http://127.0.0.1:${server.address().port}` }))
} else throw new Error("mode 必须是 preview、prepare、apply、publish 或 serve")
