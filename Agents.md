- `.local/` 为本地参考与工具输出，不参与 Git 追踪
- 完成任务给出 Conventional Commit 建议，未经明确要求不提交
- 访客内容放 `content/`，维护文档放 `editor-docs/`，不在页面加入维护说明链接

# sworld-blog

基于 Quartz 5 的个人站点。思源笔记是长期写作源，本站以双链和时间线组织内容，不要求分类或标签。

## 常用命令

- `node quartz/bootstrap-cli.mjs build --serve`：本地预览；端口占用时加 `--port 8091 --wsPort 3011`。
- `pnpm build`：构建到 `public/`；`pnpm check`：类型检查和本地回归。
- `node scripts/install-siyuan-plugin.mjs`：通过本机思源内核安装桌面「网站导出」插件；不更改公开许可，不部署。使用流程见 `editor-docs/publishing.md`。
- `node scripts/sync-siyuan.mjs`：把思源中 `custom-publish=true` 的文档同步到 `content/`，只读思源。
- `node scripts/sync-siyuan.mjs --dry-run`：读取、转换并打印计划，不写输出。
- `node scripts/sync-siyuan.mjs --id <文档ID> [--id <另一文档ID>]`：显式导出指定文档，不要求公开标记。未公开内容必须按 `editor-docs/publishing.md` 在临时目录隔离预览。

## 内容约定

- 页面不添加解释如何浏览、如何使用网站或描述页面功能的引导文案；保留内容本身、必要标题和操作入口。维护说明只写在 `editor-docs/`。

- 旧文章路径 `content/YYYY/MM/<abbrlink>.md` 保留原 URL；新文档默认根据创建时间与文档 ID 生成稳定路径，改标题不改变 URL。
- 思源同步的 `source` 为 `siyuan`，旧文为 `legacy`。全量同步会删除已取消发布的思源输出及无人引用的所属资源；指定 `--id` 时不清理其他文章。整批转换及资源检查成功后才写入；缺图、重复路径或覆盖其他来源的页面会阻止导出。
- `custom-date` 保留原发布日期及显式时区，页面按发布日期显示和排序。桌面插件首次允许公开时为没有日期的新文档记录发布时间。
- `scripts/lib/resources.mjs` 只转换网站副本：本地位图输出 WebP（最大宽度 2560、质量 85），保留透明度与 GIF 动画；合适尺寸的既有 WebP 不重复压缩。SVG 和非图片附件保留，外链图片不下载；原图不变。
- 桌面插件生成隔离完整快照，仅包含允许公开及显式预览的思源文档；正式导出只接受公开列表批次，首次接管时也移除未允许公开的 `legacy` 文章。公开许可持久保存在思源，日常检查全部公开文章无需勾选预览。插件主面板围绕当前文章公开开关、当前预览与检查全部公开文章；开关即时保存，撤回确认，使用导出/文章/设置/日志四个标签页，只由外层弹窗约束尺寸，内部填满容器，顶部标签和底部状态固定，中间内容伸缩滚动，状态与结果预留位置；异步结果和错误不改变高度、不自动切页，明细仅内部滚动。预览生成后自动打开浏览器，无独立打开按钮；不放常驻说明文字，不使用中点分隔符或文案末尾句号，危险操作保留确认。桌面入口拒绝空公开列表及空文章快照的正式导出，不支持将全站撤空。插件不提交、推送或部署。
- 双链目标只有在本轮导出集合内才生成可访问的文档链接；私人、缺失及禁止导出的目标保留引用文字，统一链接到「不公开页面」，不导出目标正文或在链接中保留目标 ID。
- `/daily note/` 下的文档禁止导出；嵌入块移除。支持的引用格式和隐私边界见 `editor-docs/publishing.md`。
- 不从思源导出标签或普通备注，不把 `type` 自动加入标签。旧文已有标签可保留为历史数据，站点不显示标签列表、不生成标签页、不按标签连图。
- 类型、摘要、封面、游戏状态和评分均是可选展示属性；未填类型的笔记仍进入时间线，不自动归为“杂谈”。
- 游戏专题按 `custom-type=游戏` 收录，`custom-kind`、`custom-status`、`custom-score`、`custom-expect` 可选。网站封面读取思源原生题头图 `title-img`，无需自定义封面属性或在正文重复插图；无图片型题头图时用标题卡片，不补造评分；题头图指向缺失本地文件时阻止导出，需修复引用或在思源取消题头图。
- 时间线、近期列表和游戏卡片使用普通 Markdown 页内的原生 `base` 代码块，不创建独立查询页；组件约定见 `editor-docs/site-views.md`。
- 局部图谱一层，只表现真实正文链接。反向链接开启，自动文件夹索引关闭。
- `content/not-public.md` 是统一公开提示页，标为 `unlisted`，不进入搜索、RSS、时间线和图谱。

## 站点定制

- 导航：`site/components/SiteNav.tsx`；时间线和卡片：`site/components/bases-views.tsx`。修改组件时同步更新 `editor-docs/`。
- 样式：`quartz/styles/custom.scss`。
- Quartz 5.0.0 会忽略 `quartz.ts` 导出的 layout，所以 `quartz.ts` 手动替换 `PageTypeDispatcher`；升级时核对这一点。
- 评论使用 Giscus，仓库 `mcthesw/sworld-blog`、`mapping: og:title`。保留旧文章标题才能匹配原评论；新笔记改标题后的评论迁移需单独处理。
- Quartz 核心保持上游快照，不直接修改；基线和升级范围见 `editor-docs/quartz-maintenance.md`。博客与 Quartz 的 Git 历史独立，不将博客分支 rebase 到 Quartz 上游。
