const { Plugin, Dialog, fetchPost, getFrontend, getActiveEditor } = require("siyuan")

const api = (url, data) => new Promise((resolve, reject) => {
  fetchPost(url, data, (response) => response.code === 0 ? resolve(response.data) : reject(new Error(response.msg || url)))
})
const defaults = { repo: "", node: "node", root: "D:/Coding/temp/sworld-publisher" }

module.exports = class SworldPublisher extends Plugin {
  async onload() {
    this.children = new Set()
    this.selected = new Set()
    this.pending = new Map()
    this.documents = []
    this.log = ""
    this.settings = { ...defaults, ...await this.loadData("settings.json") }
    this.available = getFrontend() === "desktop" && typeof window.require === "function" && !window.siyuan.config.editor?.readOnly && !window.siyuan.isPublish
  }

  onLayoutReady() {
    if (!this.available) return
    this.addTopBar({ icon: "iconUpload", title: "网站导出", position: "right", callback: () => this.openPanel() })
  }

  onunload() {
    for (const child of this.children) this.stopChild(child)
    this.dialog?.destroy()
  }

  stopChild(child) {
    if (!child || child.exitCode !== null) return
    if (window.require("node:process").platform === "win32") {
      const killer = window.require("node:child_process").spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, shell: false, stdio: "ignore" })
      killer.on("error", () => child.kill())
    } else child.kill()
    this.children.delete(child)
  }

  status(message) {
    this.log = (this.log + message + "\n").slice(-24000)
    const output = this.dialog?.element.querySelector(".swp-log")
    if (output) { output.textContent = this.log; output.scrollTop = output.scrollHeight }
  }

  async work(task) {
    if (this.busy) return
    this.busy = true
    this.refreshButtons()
    try { await task() }
    catch (error) { this.status("错误：" + error.message); this.notice(error.message, true) }
    finally { this.busy = false; this.refreshButtons() }
  }

  refreshButtons() {
    if (!this.dialog) return
    const publicCount = this.documents.filter(doc => doc.published).length
    for (const button of this.dialog.element.querySelectorAll("button[data-action]")) {
      const action = button.dataset.action
      if (action === "apply") button.dataset.ready = String(this.batch?.mode === "prepare" && !!this.batch.pages?.length && !!this.batch.changes?.length)
      button.disabled = this.busy
        || (action === "apply" && (this.batch?.mode !== "prepare" || !this.batch.pages?.length || !this.batch.changes?.length))
        || (action === "prepare" && !publicCount)
        || (action === "preview-current" && !this.currentDocument())
        || (action === "preview" && !this.selected.size)
        || (action === "save-public" && !this.pending.size)
    }
    for (const input of this.dialog.element.querySelectorAll(".swp-row input, .swp-settings input")) input.disabled = this.busy
    const permission = this.dialog.element.querySelector(".swp-current input")
    if (permission) permission.disabled = this.busy || !this.currentDocument()
    const count = this.dialog.element.querySelector(".swp-count")
    if (count) count.textContent = `${publicCount} 篇允许公开${this.pending.size ? `，${this.pending.size} 项管理设置待保存` : ""}`
  }

  currentDocument() {
    return this.documents.find(doc => doc.id === this.currentId)
  }

  notice(message, error = false) {
    this.message = message; this.messageError = error
    const output = this.dialog?.element.querySelector(".swp-notice")
    if (output) { output.textContent = message; output.dataset.error = String(error) }
    this.dialog?.element.querySelector('[data-tab="logs"]').classList.toggle("swp-tab-error", error)
  }

  renderCurrent() {
    if (!this.dialog) return
    const doc = this.currentDocument(), panel = this.dialog.element
    panel.querySelector(".swp-current-title").textContent = doc?.title || "未打开可发布的文章"
    panel.querySelector(".swp-current input").checked = !!doc?.published
    panel.querySelector(".swp-current-title").title = doc?.title || ""
  }

  async setCurrentPublic(enabled) {
    if (this.pending.size) throw new Error("文章管理中有未保存的设置，请先保存或刷新")
    const doc = this.currentDocument()
    if (!doc) throw new Error("没有可发布的当前文章")
    if (!enabled && !await this.ask("取消这篇文章的公开许可？下次导出时将撤回网站副本，思源原文不变")) return
    this.pending.set(doc.id, enabled)
    try { await this.savePublic(false) }
    finally { this.pending.delete(doc.id); this.renderDocuments() }
  }

  showTab(name, focus = false) {
    const panel = this.dialog.element
    for (const tab of panel.querySelectorAll("[data-tab]")) {
      const selected = tab.dataset.tab === name
      tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1
      if (selected && focus) tab.focus()
    }
    for (const view of panel.querySelectorAll("[data-view]")) view.hidden = view.dataset.view !== name
  }

  openPanel() {
    if (this.dialog) return
    this.currentId = getActiveEditor()?.protyle?.block?.rootID
    this.dialog = new Dialog({
      title: "网站导出", width: "680px", height: "min(560px, 85vh)",
      content: `<div class="swp-panel">
        <div class="swp-tabs" role="tablist" aria-label="网站导出功能">
          <button type="button" role="tab" id="swp-tab-export" aria-controls="swp-view-export" data-tab="export">导出</button>
          <button type="button" role="tab" id="swp-tab-articles" aria-controls="swp-view-articles" data-tab="articles">文章</button>
          <button type="button" role="tab" id="swp-tab-settings" aria-controls="swp-view-settings" data-tab="settings">设置</button>
          <button type="button" role="tab" id="swp-tab-logs" aria-controls="swp-view-logs" data-tab="logs">日志</button>
        </div>
        <div class="swp-views">
        <section class="swp-view swp-export" data-view="export" id="swp-view-export" role="tabpanel" aria-labelledby="swp-tab-export">
        <section class="swp-current">
          <div class="swp-eyebrow">当前文章</div>
          <div class="swp-current-title"></div>
          <label class="swp-permission">允许公开<input type="checkbox" class="b3-switch" aria-label="允许公开当前文章"></label>
        </section>
        <div class="swp-actions">
          <button class="b3-button b3-button--outline" data-action="preview-current">预览当前文章</button>
          <button class="b3-button" data-action="prepare">检查待导出内容</button>
        </div>
        <div class="swp-count"></div>
        <section class="swp-result" aria-label="检查结果">
          <p class="swp-summary"></p><div class="swp-plan"></div>
          <div class="swp-result-actions">
            <button class="b3-button" data-action="apply">导出到本地</button>
          </div>
        </section>
        </section>
        <section class="swp-view swp-management" data-view="articles" id="swp-view-articles" role="tabpanel" aria-labelledby="swp-tab-articles" hidden>
          <div class="swp-toolbar"><input class="b3-text-field" name="search" placeholder="搜索标题或文档路径">
            <label><input type="checkbox" name="public-only">仅公开</label><button class="b3-button b3-button--outline" data-action="refresh">刷新</button></div>
          <div class="swp-head"><span>预览</span><span>公开</span><span>文档</span></div>
          <div class="swp-documents"></div>
          <div class="swp-actions swp-management-actions">
            <button class="b3-button b3-button--outline" data-action="allow-visible">允许公开筛选结果</button>
            <button class="b3-button" data-action="save-public">保存设置</button>
            <button class="b3-button b3-button--outline" data-action="preview">预览所选</button>
          </div>
        </section>
        <section class="swp-view swp-settings" data-view="settings" id="swp-view-settings" role="tabpanel" aria-labelledby="swp-tab-settings" hidden>
          <label>Quartz 仓库目录<input class="b3-text-field fn__block" name="repo"></label>
          <label>Node 可执行文件<input class="b3-text-field fn__block" name="node" placeholder="node"></label>
          <label>隔离预览目录<input class="b3-text-field fn__block" name="root"></label>
          <button class="b3-button" data-action="settings">保存连接</button>
        </section>
        <section class="swp-view swp-details" data-view="logs" id="swp-view-logs" role="tabpanel" aria-labelledby="swp-tab-logs" hidden><pre class="swp-log" tabindex="0" aria-label="运行日志"></pre></section>
        </div>
        <p class="swp-notice" role="status" aria-live="polite"></p>
      </div>`,
      destroyCallback: () => { this.dialog = null },
    })
    const panel = this.dialog.element
    panel.querySelector(".b3-dialog__container").classList.add("swp-dialog")
    for (const key of Object.keys(defaults)) panel.querySelector(`[name="${key}"]`).value = this.settings[key]
    this.showTab(this.settings.repo ? "export" : "settings")
    panel.querySelector(".swp-tabs").addEventListener("click", event => {
      const tab = event.target.closest("[data-tab]")
      if (tab) this.showTab(tab.dataset.tab)
    })
    panel.querySelector(".swp-tabs").addEventListener("keydown", event => {
      const tabs = [...panel.querySelectorAll("[data-tab]")]
      const index = tabs.indexOf(event.target)
      if (index < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
      event.preventDefault()
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length
      this.showTab(tabs[next].dataset.tab, true)
    })
    panel.querySelector('[name="search"]').addEventListener("input", () => this.renderDocuments())
    panel.querySelector('[name="public-only"]').addEventListener("change", () => this.renderDocuments())
    panel.querySelector(".swp-current input").addEventListener("change", event => {
      const enabled = event.target.checked
      this.work(async () => { try { await this.setCurrentPublic(enabled) } finally { this.renderCurrent() } })
    })
    panel.querySelector(".swp-log").textContent = this.log
    this.notice(this.message || "", this.messageError)
    panel.addEventListener("click", event => {
      const button = event.target.closest("button[data-action]")
      if (!button || button.disabled) return
      const action = button.dataset.action
      this.work(async () => {
        if (action === "settings") await this.saveSettings()
        if (action === "refresh") {
          if (this.pending.size && !await this.ask("丢弃尚未保存的公开设置并刷新？")) return
          this.pending.clear(); await this.refreshDocuments()
        }
        if (action === "allow-visible") {
          for (const doc of this.visibleDocuments()) if (!doc.published) this.pending.set(doc.id, true)
          this.renderDocuments()
        }
        if (action === "save-public") await this.savePublic()
        if (action === "preview-current") {
          const doc = this.currentDocument()
          if (!doc) throw new Error("没有可预览的当前文章")
          this.selected = new Set([doc.id]); this.renderDocuments(); await this.prepare("preview")
        }
        if (action === "preview" || action === "prepare") await this.prepare(action)
        if (action === "apply") await this.apply()
      })
    })
    this.renderDocuments(); this.renderBatch()
    this.work(() => this.refreshDocuments())
  }

  visibleDocuments() {
    const panel = this.dialog.element
    const query = panel.querySelector('[name="search"]').value.toLocaleLowerCase()
    const publicOnly = panel.querySelector('[name="public-only"]').checked
    return this.documents.filter(doc => (doc.title + " " + doc.hpath).toLocaleLowerCase().includes(query) && (!publicOnly || (this.pending.get(doc.id) ?? doc.published)))
  }

  async refreshDocuments() {
    const rows = await api("/api/query/sql", { stmt: "select b.id, b.content as title, b.hpath, b.created, coalesce(a.value,'false') as published from blocks b left join attributes a on a.block_id=b.id and a.name='custom-publish' where b.type='d' order by b.updated desc limit 10000" })
    this.documents = rows.filter(doc => !/^\/daily note\//.test(doc.hpath)).map(doc => ({ ...doc, published: doc.published === "true" }))
    this.renderDocuments()
  }

  renderDocuments() {
    if (!this.dialog) return
    const panel = this.dialog.element
    const list = panel.querySelector(".swp-documents")
    list.replaceChildren()
    this.renderCurrent()
    for (const doc of this.visibleDocuments()) {
      const row = document.createElement("div"); row.className = "swp-row"
      const preview = document.createElement("input"); preview.type = "checkbox"; preview.checked = this.selected.has(doc.id); preview.setAttribute("aria-label", "预览 " + doc.title)
      preview.addEventListener("change", () => { preview.checked ? this.selected.add(doc.id) : this.selected.delete(doc.id); this.refreshButtons() })
      const permission = document.createElement("input"); permission.type = "checkbox"; permission.checked = this.pending.get(doc.id) ?? doc.published; permission.setAttribute("aria-label", "允许公开 " + doc.title)
      permission.addEventListener("change", () => { permission.checked === doc.published ? this.pending.delete(doc.id) : this.pending.set(doc.id, permission.checked); this.refreshButtons() })
      const title = document.createElement("span"); title.textContent = doc.title; title.title = doc.hpath
      row.append(preview, permission, title); list.append(row)
    }
    this.refreshButtons()
  }

  ask(message) {
    return new Promise(resolve => {
      let settled = false
      const finish = value => { if (!settled) { settled = true; resolve(value) } }
      const dialog = new Dialog({ title: "确认操作", width: "520px", content: '<div class="b3-dialog__content swp-confirm"><p></p><button class="b3-button" data-yes>确认</button> <button class="b3-button b3-button--outline" data-no>取消</button></div>', destroyCallback: () => finish(false) })
      dialog.element.querySelector("p").textContent = message
      dialog.element.querySelector("[data-yes]").onclick = () => { finish(true); dialog.destroy() }
      dialog.element.querySelector("[data-no]").onclick = () => dialog.destroy()
    })
  }

  async saveSettings() {
    const settings = Object.fromEntries(Object.keys(defaults).map(key => [key, this.dialog.element.querySelector(`[name="${key}"]`).value.trim()]))
    if (Object.values(settings).some(value => !value)) throw new Error("请填写仓库、Node 与预览目录")
    const fs = window.require("node:fs"), path = window.require("node:path")
    if (!fs.existsSync(path.join(settings.repo, "scripts/publish-desktop.mjs"))) throw new Error("目录中没有网站导出器")
    const response = await this.saveData("settings.json", settings)
    if (response?.code && response.code !== 0) throw new Error(response.msg || "设置保存失败")
    this.settings = settings; this.batch = null
    this.stopChild(this.server); this.previewUrl = null; this.renderBatch()
    this.status("本地连接设置已保存"); this.notice("连接已保存")
  }

  async savePublic(confirm = true) {
    if (confirm && !await this.ask(`保存 ${this.pending.size} 篇文章的公开设置？`)) return
    let saved = 0
    try {
      for (const [id, enabled] of [...this.pending]) {
        const existing = await api("/api/attr/getBlockAttrs", { id })
        const attrs = { "custom-publish": String(enabled) }
        if (enabled && !existing["custom-date"]) attrs["custom-date"] = new Date().toISOString()
        await api("/api/attr/setBlockAttrs", { id, attrs })
        this.pending.delete(id); saved++
      }
    } finally {
      this.batch = null; this.renderBatch()
      this.status(`已保存 ${saved} 篇公开设置；网站尚未更新`)
      this.notice(`已保存 ${saved} 篇公开设置`)
      await this.refreshDocuments()
    }
  }

  launch(mode, extra = [], stay = false) {
    const workspace = window.siyuan.config.system.workspaceDir
    if (!workspace) throw new Error("无法确认当前思源工作区，停止导出")
    if (!this.settings.repo) throw new Error("请先填写本地连接设置")
    const path = window.require("node:path")
    const child = window.require("node:child_process").spawn(this.settings.node, [
      path.join(this.settings.repo, "scripts/publish-desktop.mjs"), "--mode", mode,
      "--workspace", workspace, "--root", this.settings.root, ...extra,
    ], { cwd: this.settings.repo, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
    this.children.add(child)
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    let output = "", lastResult, settled = false
    const promise = new Promise((resolve, reject) => {
      child.stdout.on("data", chunk => {
        output += chunk.toString()
        const lines = output.split("\n"); output = lines.pop()
        for (const line of lines) {
          if (line.startsWith("SWORLD_RESULT ")) {
            try { lastResult = JSON.parse(line.slice(14)); if (stay) { settled = true; resolve(lastResult) } }
            catch (error) { this.status("无法解析导出结果：" + error.message) }
          } else this.status(line)
        }
      })
      child.stderr.on("data", chunk => this.status(chunk.toString()))
      child.on("error", error => { settled = true; this.children.delete(child); reject(error) })
      child.on("close", code => {
        this.children.delete(child)
        if (!settled) {
          settled = true
          if (code === 0 && lastResult) resolve(lastResult)
          else reject(new Error(`操作未完成（退出码 ${code}），请查看日志；未执行上线`))
        }
      })
    })
    return { child, promise }
  }

  async prepare(mode) {
    if (this.pending.size) throw new Error("请先保存公开设置，或刷新以丢弃修改")
    if (mode === "prepare" && !this.documents.some(doc => doc.published)) throw new Error("尚未设置允许公开的文章，请打开当前文章的公开开关，或在文章管理中设置")
    this.stopChild(this.server); this.previewUrl = null; this.batch = null; this.renderBatch()
    this.log = ""; this.status(mode === "preview" ? "生成隔离预览，不修改网站目录……" : "检查公开列表并构建，尚未写入网站目录……")
    this.notice(mode === "preview" ? "正在生成本机预览…" : "正在检查全部公开文章…")
    const args = mode === "preview" ? [...this.selected].flatMap(id => ["--id", id]) : []
    const operation = this.launch(mode, args)
    this.batch = await operation.promise
    const preview = this.launch("serve", ["--stage", this.batch.stage], true)
    this.server = preview.child
    this.previewUrl = (await preview.promise).url
    this.renderBatch()
    if (mode === "preview") {
      await this.openPreview()
      this.notice("已打开预览")
    } else this.notice(this.batch.changes.length ? "检查完成" : "没有需要更新的内容")
  }

  async openPreview() {
    const page = this.selected.size === 1 ? this.batch.pages.find(page => this.selected.has(page.id)) : null
    const target = page ? "/" + page.path.split("/").map(encodeURIComponent).join("/") : "/posts"
    await window.require("electron").shell.openExternal(this.previewUrl + target)
  }

  renderBatch() {
    if (!this.dialog) return
    const panel = this.dialog.element
    const plan = panel.querySelector(".swp-plan"), summary = panel.querySelector(".swp-summary")
    plan.replaceChildren()
    if (!this.batch) {
      summary.textContent = ""
    } else if (this.batch.mode === "preview") {
      summary.textContent = ""
    } else {
      const pages = this.batch.changes.filter(change => change.file.endsWith(".md"))
      const count = action => pages.filter(change => change.action === action).length
      summary.textContent = this.batch.mode === "applied" ? "已导出到本地"
        : `新增 ${count("add")}，更新 ${count("update")}，撤回 ${count("remove")}，资源变更 ${this.batch.changes.length - pages.length}`
      const list = document.createElement("ul")
      for (const change of pages) {
        const item = document.createElement("li")
        item.textContent = `${{add:"新增",update:"更新",remove:"撤回"}[change.action]}：${change.title || change.file}`
        list.append(item)
      }
      plan.append(list)
    }
    this.refreshButtons()
  }

  async apply() {
    if (this.pending.size) throw new Error("公开设置尚未保存，请先处理并重新检查")
    if (!this.batch || this.batch.mode !== "prepare") throw new Error("请先检查公开列表")
    if (!this.batch.pages?.length) throw new Error("公开快照为空，不能导出空站点；请设置公开文章后重新检查")
    if (!await this.ask("确认导出这次检查的内容？\n清单中撤回的文章和资源将从本地网站移除")) return
    await this.launch("apply", ["--stage", this.batch.stage]).promise
    this.batch.mode = "applied"; this.renderBatch()
    this.status("本地导出完成；尚未提交、推送或部署；线上站点没有变化")
    this.notice("已导出到本地")
  }
}
