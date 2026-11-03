# 时间线、双链与专题展示

## 页面与查询

- 导航由 `site/components/SiteNav.tsx` 提供，`quartz.ts` 将它追加到现有左侧栏；桌面竖排在搜索下方，800px 以下换行横排。“笔记”沿用 `/posts` URL，不启用文件目录树。
- 首页顺序为个人介绍、近况、项目、近期笔记、推荐。社交入口采用内联 SVG 图标，链接的 `title` 提供浏览器原生提示、`aria-label` 提供无障碍名称；项目保留名称和描述。
- `configuration.enablePopovers: false` 关闭链接悬停页面预览，图标名称的原生 tooltip 不受影响。
- `content/posts.md` 是完整时间线，`content/index.md` 显示最新 8 篇。两者按 `date` 倒序，只要求 Markdown 和发布日期，不要求 `type`、标签或封面。
- `content/games.md` 保留游戏卡片及个人偏好，专题通过可选 `type: 游戏` 收录。`kind` 区分 Demo，状态和评分均可省略。
- 查询直接放在页面的原生 `base` 代码块中；不创建独立 `.base` 文件。独立查询页会把查询结果作为出链，而页内查询只渲染列表，不给图谱制造收录关系。
- 页面、游戏卡片和列表不自动新增笔记之间的正文引用。关联由作者在正文中表达。

## 组件约定

`site/components/bases-views.tsx` 向现有 Bases 插件注册两个视图：

- `post-list`：日期＋标题；可选 `more: posts` 显示“全部笔记”。不展示分类标签。
- `cover-grid`：封面卡片；思源导出时 `cover` 来自原生题头图 `title-img`，未提供图片型题头图时使用标题渐变占位。`kind`、`status`、`score`、`expect` 仅作为可选卡片信息，不参与知识关系。

直接从 `@quartz-community/bases-page` 的公开入口导入注册表与类型，兼容本仓库现有 TypeScript 模块解析配置。

`source: siyuan` 的正文由同步器生成，不手改；专题页面目前由仓库维护。不要为了进入时间线添加标签，或把这些页面复制成另一套分类目录。

## 图谱与反向链接

- 反向链接由 Quartz 原生 Backlinks 提供。
- 局部图谱深度为 1，全局和局部图谱均不展示标签节点。
- 关闭标签页和自动文件夹页，不创建年月目录节点。
- `not-public` 是统一提示页，使用 `unlisted: true` 退出发现索引。公开页面仍能点击它，但图谱不会以它为共同节点聚合私人引用。
- 提示页的日期、图谱和反向链接由 `quartz/styles/custom.scss` 隐藏，避免把它呈现成一篇普通笔记。
