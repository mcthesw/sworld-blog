# Quartz 维护边界

## 基线

Quartz 5 上游：`https://github.com/jackyzha0/quartz`

快照提交：`97a2d05f80c4c50534959b1d0d41cc4b3895625e`

`quartz/` 保持该提交的原文件，唯一站点定制是上游预留的 `quartz/styles/custom.scss`。保留 `LICENSE.txt`。`quartz.config.default.yaml` 是加载器使用的默认配置，不是可随意删除的示例。

## 定制位置

| 职责 | 位置 |
| --- | --- |
| 插件配置、站点布局和评论 | `quartz.config.yaml` |
| 导航、时间线和卡片 | `site/components/` |
| 颜色、字体、间距 | `quartz/styles/custom.scss` |
| 站点扩展装配 | `quartz.ts` |
| 思源转换、资源处理与本地导出 | `scripts/` |
| 思源桌面交互 | `siyuan-plugin/` |

插件调用同仓的 `scripts/publish-desktop.mjs`，不复制图片、引用转换或构建逻辑，不实现 Git 和部署。无需单独发布导出器版本。

Quartz 5 当前加载器不使用根入口导出的 `layout`，`quartz.ts` 因此重新装配 `PageTypeDispatcher` 以加入导航。这是唯一明确的布局版本耦合点；升级时核对加载器是否提供可替代的正式入口。不要为迁移这几行逻辑改动 Quartz 核心或引入一套新的扩展框架。

## 升级

博客保留自己的 Git 历史，上游快照不构成博客分支的祖先，不把博客分支 rebase 到 Quartz 上游。

在独立 Quartz 工作副本比较上述基线与待升级提交，只更新上游文件和需要配套的依赖；保留站点样式及根目录的项目配置。更新这里的基线提交，使用 pnpm 更新唯一的 `pnpm-lock.yaml`，不引入第二份包管理器锁文件。

`patches/@quartz-community__graph.patch`（`pnpm.patchedDependencies`）做两处修改：节点点击从整页跳转改为 `window.spaNavigate`，避免整页重载时的白屏闪烁；节点文字初始透明度按 `opacityScale` 计算（与缩放时同一公式），默认缩放下即可看到文字。补丁锁定在当前版本，版本变化后补丁无法应用时 `pnpm install` 会直接报错。升级 `@quartz-community/graph` 时先确认上游是否已提供这两项行为，已提供则删除对应修改；否则用 `pnpm patch @quartz-community/graph` 在新版本中重做这两处替换，再 `pnpm patch-commit`。

升级后运行 `pnpm check`、`pnpm build`，验证导航、列表、评论、局部图谱及思源隔离预览。插件依赖应在 `package.json` 中声明并锁定，构建时不依赖临时下载未锁定的插件。

## 内容与工具

公开文章正文以思源为源，页面入口在 `content/`，维护说明在 `editor-docs/`。不重新导入已经接管的旧文章。

保留原仓库的 Privacy Guard 提交前检查。WebP 转换由思源导出器处理，不再维护 VuePress 图片插件或 Markdown 新建模板。
