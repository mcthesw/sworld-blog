import assert from "node:assert/strict"
import { execFileSync, spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { runInNewContext } from "node:vm"
import test from "node:test"

const repo = fileURLToPath(new URL("../", import.meta.url))
const digest = text => createHash("sha256").update(text).digest("hex")
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "publisher-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const site = join(dir, "site"), workspace = join(dir, "workspace"), root = join(dir, "previews"), stage = join(root, "batch-test")
  for (const folder of [join(site, "scripts"), join(site, "content"), join(workspace, "data"), join(stage, "content"), join(stage, "public")]) mkdirSync(folder, { recursive: true })
  cpSync(join(repo, "scripts/publish-desktop.mjs"), join(site, "scripts/publish-desktop.mjs"))
  symlinkSync(join(repo, "node_modules"), join(site, "node_modules"), process.platform === "win32" ? "junction" : "dir")
  const mock = join(dir, "mock.mjs")
  writeFileSync(mock, `import cp from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';const real=cp.execFileSync;cp.execFileSync=(command,args,options)=>{if(command==='git')return real(command,args,options);if(command!=='siyuan')throw Error('Unexpected operation');if(args[0]==='workspace')return JSON.stringify({path:${JSON.stringify(workspace)}});if(args[0]!=='sql')throw Error('Unexpected operation');return process.env.TEST_PUBLIC||'[{"id":"public-doc"}]'};syncBuiltinESMExports()`)
  writeFileSync(join(site, "content/old.md"), "old")
  writeFileSync(join(stage, "content/new.md"), "new")
  writeFileSync(join(stage, "public/index.html"), "preview")
  const data = { repo: resolve(site), workspace: resolve(workspace), mode: "prepare", published: ["public-doc"], pages: [{id:"public-doc",title:"new",path:"new"}], before: { "old.md": digest("old") }, after: { "new.md": digest("new") }, changes: [{file:"new.md",action:"add"},{file:"old.md",action:"remove"}] }
  const save = () => writeFileSync(join(stage, "batch.json"), JSON.stringify(data))
  save()
  const args = mode => ["--import", pathToFileURL(mock).href, join(site,"scripts/publish-desktop.mjs"),"--mode",mode,"--workspace",workspace,"--root",root,"--stage",stage]
  const run = (mode, env = {}) => execFileSync(process.execPath, args(mode), { encoding:"utf8",env:{...process.env,...env},stdio:"pipe" })
  return { site, stage, data, save, args, run }
}

test("only reviewed public batches can replace website files", t => {
  const f = fixture(t)
  f.data.mode = "preview"; f.save()
  assert.throws(() => f.run("apply"), /未公开文章的预览不能写入/)
  f.data.mode = "prepare"; f.save()
  assert.throws(() => f.run("apply", {TEST_PUBLIC:'[{"id":"new-permission"}]'}), /公开列表已变化/)
  writeFileSync(join(f.site,"content/old.md"),"edited")
  assert.throws(() => f.run("apply"), /网站内容已变化/)
  writeFileSync(join(f.site,"content/old.md"),"old")
  writeFileSync(join(f.stage,"content/new.md"),"edited snapshot")
  assert.throws(() => f.run("apply"), /预览文件已变化/)
  writeFileSync(join(f.stage,"content/new.md"),"new")
  writeFileSync(join(f.site,"outside.txt"),"protected")
  f.data.changes = [{file:"../outside.txt",action:"remove"}];f.save()
  assert.match(f.run("apply"), /"applied":true/)
  assert.equal(readFileSync(join(f.site,"outside.txt"),"utf8"),"protected")
  assert.equal(readFileSync(join(f.site,"content/new.md"),"utf8"),"new")
  assert.throws(() => readFileSync(join(f.site,"content/old.md")), /ENOENT/)
})

test("publishing commits only website content and pushes it to main", t => {
  const f = fixture(t)
  const remote = join(f.stage, "..", "..", "remote.git")
  const git = (...args) => execFileSync("git", ["-C", f.site, ...args], { encoding: "utf8", stdio: "pipe" }).trim()
  execFileSync("git", ["init", "--bare", "-b", "main", remote], { stdio: "pipe" })
  git("init", "-b", "main"); writeFileSync(join(f.site, ".gitignore"), "node_modules\n")
  writeFileSync(join(f.site, "notes.txt"), "draft")
  git("add", "."); git("commit", "-m", "init"); git("remote", "add", "origin", remote); git("push", "origin", "main")
  assert.throws(() => f.run("publish"), /没有需要发布的变更/)
  writeFileSync(join(f.site, "content/old.md"), "updated")
  writeFileSync(join(f.site, "notes.txt"), "still a draft")
  assert.match(f.run("publish"), /"published":true/)
  assert.equal(execFileSync("git", ["-C", remote, "show", "main:content/old.md"], { encoding: "utf8" }), "updated")
  assert.equal(git("show", "HEAD:notes.txt"), "draft")
  assert.equal(git("status", "--porcelain"), "M notes.txt")
})
test("empty public lists cannot prepare or apply an empty website, including old batches", t => {
  const f = fixture(t)
  assert.throws(() => f.run("prepare", {TEST_PUBLIC:"[]"}), /尚未设置允许公开的文章/)
  assert.throws(() => f.run("apply", {TEST_PUBLIC:"[]"}), /不能导出空站点/)
  f.data.published = []; f.data.pages = []; f.save()
  assert.throws(() => f.run("apply", {TEST_PUBLIC:"[]"}), /不能导出空站点/)
  assert.equal(readFileSync(join(f.site,"content/old.md"),"utf8"),"old")
})

test("preview server exposes only built files and rejects foreign hosts", async t => {
  const f = fixture(t)
  const child = spawn(process.execPath, f.args("serve"), {stdio:["ignore","pipe","pipe"]})
  t.after(() => child.kill())
  child.stdout.setEncoding("utf8")
  const url = await new Promise((resolve,reject) => {
    let text = ""
    child.on("error",reject);child.on("exit",code=>reject(Error(`server exited ${code}`)))
    child.stdout.on("data",chunk=>{text+=chunk;const match=text.match(/SWORLD_RESULT (.+)\n/);if(match)resolve(JSON.parse(match[1]).url)})
  })
  assert.equal(await (await fetch(url)).text(),"preview")
  assert.equal((await fetch(url+"/batch.json")).status,404)
  const {request} = await import("node:http")
  const status = await new Promise((resolve,reject)=>{const req=request(url,{headers:{host:"foreign.test"}},res=>{res.resume();resolve(res.statusCode)});req.on("error",reject);req.end()})
  assert.equal(status,403)
})

test("plugin saves permissions only after confirmation and preserves old dates", async () => {
  const writes = [], attrs = {old:{"custom-date":"2024-09-01"},fresh:{}}
  const module = {exports:{}}
  runInNewContext(readFileSync(join(repo,"siyuan-plugin/index.cjs"),"utf8"), {
    module, require: name => {assert.equal(name,"siyuan");return {Plugin:class {},fetchPost:(url,data,done)=>{
      if(url.endsWith("getBlockAttrs"))done({code:0,data:attrs[data.id]})
      else if(url.endsWith("setBlockAttrs")){writes.push(data);done({code:0})}
      else throw Error("Unexpected API")
    }}}, Date,
  })
  const plugin = new module.exports()
  plugin.pending = new Map([["old",true],["fresh",true]])
  plugin.ask = async () => false
  plugin.renderBatch = () => {};plugin.status=()=>{};plugin.refreshDocuments=async()=>{}
  await plugin.savePublic();assert.equal(writes.length,0)
  plugin.ask = async () => true
  await plugin.savePublic()
  assert.equal(writes.length,2)
  assert.equal(writes[0].attrs["custom-date"],undefined)
  assert.ok(!Number.isNaN(Date.parse(writes[1].attrs["custom-date"])))
  assert.equal(writes[0].attrs["custom-publish"],"true")
  assert.equal(plugin.pending.size,0)
})

test("preview opens the article automatically but checking exports does not open a browser", async () => {
  const module = {exports:{}}, opened = []
  runInNewContext(readFileSync(join(repo,"siyuan-plugin/index.cjs"),"utf8"), {
    module, require: () => ({Plugin:class {}}),
    window:{require:name=>{assert.equal(name,"electron");return {shell:{openExternal:async url=>opened.push(url)}}}},
  })
  const plugin = new module.exports()
  plugin.pending=new Map();plugin.selected=new Set(["current"]);plugin.documents=[{published:true}]
  plugin.stopChild=()=>{};plugin.renderBatch=()=>{};plugin.status=()=>{};plugin.notice=()=>{}
  plugin.launch=mode=>({child:{},promise:Promise.resolve(mode==="serve"?{url:"http://127.0.0.1:1234"}:
    {mode,stage:"batch",pages:[{id:"current",path:"2026/测试文章"}],changes:[]})})
  await plugin.prepare("preview")
  assert.deepEqual(opened,["http://127.0.0.1:1234/2026/"+encodeURIComponent("测试文章")])
  await plugin.prepare("prepare")
  assert.equal(opened.length,1)
})

test("current article permission saves immediately and withdrawal can be cancelled", async () => {
  const module = {exports:{}}, writes = [], attrs = {"custom-date":"2024-09-01"}
  runInNewContext(readFileSync(join(repo,"siyuan-plugin/index.cjs"),"utf8"), {
    module, require: () => ({Plugin:class {},fetchPost:(url,data,done)=>{
      assert.equal(data.id,"current")
      if(url.endsWith("getBlockAttrs"))done({code:0,data:attrs})
      else {writes.push(data);Object.assign(attrs,data.attrs);done({code:0})}
    }}), Date,
  })
  const plugin = new module.exports()
  plugin.currentId="current";plugin.documents=[{id:"current",published:false}];plugin.pending=new Map()
  plugin.renderBatch=()=>{};plugin.renderDocuments=()=>{};plugin.status=()=>{};plugin.notice=()=>{}
  plugin.refreshDocuments=async()=>{plugin.documents[0].published=attrs["custom-publish"]==="true"}
  plugin.ask=async()=>{throw Error("enabling needs no second confirmation")}
  await plugin.setCurrentPublic(true)
  assert.equal(writes.length,1);assert.equal(writes[0].attrs["custom-date"],undefined)
  plugin.ask=async()=>false
  await plugin.setCurrentPublic(false)
  assert.equal(writes.length,1);assert.equal(plugin.pending.size,0)
  plugin.ask=async()=>true
  await plugin.setCurrentPublic(false)
  assert.equal(writes.length,2);assert.equal(attrs["custom-publish"],"false")
})

test("public updates need no preview selection, while empty checks and exports stay disabled", async () => {
  const module = {exports:{}}
  runInNewContext(readFileSync(join(repo,"siyuan-plugin/index.cjs"),"utf8"), {
    module, require: () => ({Plugin:class {}}),
  })
  const plugin = new module.exports()
  const buttons = ["prepare","preview","apply"].map(action=>({dataset:{action}}))
  plugin.dialog = {element:{querySelectorAll: selector=>selector.startsWith("button")?buttons:[],querySelector:()=>null}}
  plugin.documents=[];plugin.selected=new Set();plugin.pending=new Map()
  plugin.batch={mode:"prepare",pages:[]}
  plugin.refreshButtons()
  assert.ok(buttons.every(button=>button.disabled))
  await assert.rejects(()=>plugin.prepare("prepare"), /尚未设置允许公开的文章/)
  await assert.rejects(()=>plugin.apply(), /不能导出空站点/)
  plugin.documents=[{published:true}]
  plugin.refreshButtons()
  assert.equal(buttons[0].disabled,false)
  assert.equal(buttons[1].disabled,true)
})
