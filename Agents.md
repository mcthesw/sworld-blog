- `.local/` 为本地参考与工具输出，不参与 Git 追踪
- 完成任务给出 Conventional Commit 建议，未经明确要求不提交
- 访客内容放 `content/`，维护说明放 `editor-docs/`，页面内不写解释如何使用网站的引导文案，不使用中点分隔符（`·`）

# sworld-blog

基于 Quartz 5 的个人站点。思源笔记是唯一写作事实源，本站以双链、精选导读与时间线组织内容，不依赖刚性分类目录或标签。领域词汇见 `CONTEXT.md`，架构决策见 `docs/adr/`。

## 常用命令

- `pnpm dev`：本地预览端口 `43781`，热更新端口 `43782`。
- `pnpm build`：构建到 `public/`；`pnpm check`：类型检查与回归测试。
- `node scripts/install-siyuan-plugin.mjs`：通过本机思源内核安装桌面「网站导出」插件。
- `node scripts/sync-siyuan.mjs`：将思源中 `custom-publish=true` 的文档同步到 `content/`（只读思源）。支持 `--dry-run` 与 `--id <文档ID>`（未公开文档须按 `editor-docs/publishing.md` 在临时目录隔离预览）。

## 内容与同步约束

- `content/` 中 `source: "siyuan"` 的文件由同步器生成，不手工修改；顶层聚合页（`index.md`、`posts.md`、`projects.md`、`games.md`、`about.md`、`links.md`）在仓库维护；`reading.md`（随记）由思源「阅读随记」同步生成。
- 旧文章路径 `content/YYYY/MM/<abbrlink>.md` 保留原 URL；新文档根据创建时间与文档 ID 生成稳定路径，改标题不改变 URL。
- `custom-date` 保留原发布日期及显式时区，页面按发布日期排序。
- 双链目标只有在本轮导出集合内才生成站内链接；未公开、缺失及禁止导出的目标保留引用文字，统一指向 `not-public`（`unlisted`），不泄露私人正文或块 ID。
- `/daily note/` 整篇文档禁止直接公开导出；标记 `custom-backlinks=true` 的公开文档（如「随记」）仅提取指向它的反向链接块内容。
- 不导出思源标签或备注，不生成标签页。`custom-featured=true` 导出为 `featured: true` 用于首页与时间线精选；游戏记录使用 `custom-type=游戏` 及可选的 `custom-kind`、`custom-status`、`custom-score`、`custom-expect`，封面直接读取思源原生题头图 `title-img`。
- 本地位图由 `scripts/lib/resources.mjs` 导出为去元数据的 WebP（最大宽度 2560、质量 85，保留透明度与 GIF 动画），SVG 与外链图片保持原样。

## 站点定制

- 导航：`site/components/SiteNav.tsx`；时间线与封面卡片视图：`site/components/bases-views.tsx`；样式：`quartz/styles/custom.scss`。
- Quartz 5.0.0 忽略 `quartz.ts` 导出的 layout，`quartz.ts` 通过替换 `PageTypeDispatcher` 注入左侧导航。
- 评论使用 Giscus（`mcthesw/sworld-blog`，`mapping: og:title`）。
- `quartz/` 保持上游快照，不直接修改核心代码；维护边界见 `editor-docs/quartz-maintenance.md`。

