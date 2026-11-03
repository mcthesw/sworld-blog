import { readFileSync } from "node:fs"
import { parseArgs } from "node:util"

const {values} = parseArgs({options:{url:{type:"string"}}})
const base = new URL(values.url || "http://127.0.0.1:6806")
if (base.protocol !== "http:" || !["127.0.0.1","localhost"].includes(base.hostname)) throw new Error("仅支持本机思源内核")
async function api(path, body) {
  const response = await fetch(new URL(path, base), {method:"POST",body,headers:body instanceof FormData?{}:{"content-type":"application/json"}})
  if (!response.ok && !(path === "/api/file/getFile" && response.status === 404)) throw new Error(`${path}: HTTP ${response.status}`)
  return response
}
const manifest = JSON.parse(readFileSync(new URL("../siyuan-plugin/plugin.json",import.meta.url),"utf8"))
const folder = `/data/plugins/${manifest.name}`
const old = await (await api("/api/file/getFile",JSON.stringify({path:folder+"/plugin.json"}))).json()
if (old.name && (old.name !== manifest.name || old.author !== manifest.author)) throw new Error("已存在不同来源的同名插件，停止安装")
if (!old.name && old.code !== 404) throw new Error("无法确认目标插件目录："+JSON.stringify(old))
for (const [source,target] of [["index.cjs","index.js"],["index.css","index.css"],["README.md","README.md"],["plugin.json","plugin.json"]]) {
  const form = new FormData()
  form.set("path",folder+"/"+target);form.set("isDir","false")
  form.set("file",new Blob([readFileSync(new URL("../siyuan-plugin/"+source,import.meta.url))]),target)
  const result = await (await api("/api/file/putFile",form)).json()
  if (result.code !== 0) throw new Error(`安装 ${target} 失败：${result.msg}`)
  console.log("已安装 "+folder+"/"+target)
}
console.log("请在思源 设置 → 集市 → 已下载 → 插件 中启用「网站导出」。安装不会更改文章公开状态。")
