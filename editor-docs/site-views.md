# 时间线、双链与聚合页展示

## 页面与查询

- 左侧导航由 `site/components/SiteNav.tsx` 提供，分为主内容区（`首页`、`时间线`、`项目`、`游戏`、`随记`）与个人站点区（`关于我`、`厉害的人们`）。桌面端竖排在搜索框下方，800px 以下自适应横排。
- `content/index.md`（首页）依次展示头像与社交链接、精选、项目（项目文档的紧凑列表）与最近的笔记（排除精选）。
- `content/posts.md`（时间线）按年份分组倒序展示全站笔记，顶部提供年份跳转。「全部」是只列标题的紧凑索引，「文章」排除游戏并显示摘要，「精选」以大标题加摘要展示。
- `content/projects.md`（项目）通过 `type: 项目` 自动列出项目文档（思源 `/对象/` 下以产品名为标题的文档）（`custom-type=项目`、`custom-permalink=/projects/<名称>/`，可选 `custom-description`、`custom-status` 与题头图截图），按创建时间（或 `custom-date`）正序排列；时间线与首页排除项目文档。
- `content/about.md`（关于我）由思源 `/已产出/关于我` 同步生成（`custom-permalink=/about/`、`custom-type=页面`、`custom-comments=false`），列出近况与小小的推荐（作品、工具与书）。
- `content/games.md`（游戏）通过 `type: 游戏` 收录游玩记录与新品节 Demo 卡片，顶部偏好卡以 `![[games/taste#最爱的几款游戏]]` 嵌入偏好页的「最爱的几款游戏」，标题链接铺满整张卡片指向 `/games/taste/`；思源中改动该小节标题需同步修改嵌入锚点。该页由思源 `/已产出/我的游戏偏好` 同步生成（`custom-permalink=/games/taste/`、`custom-type=页面`）；时间线与首页按 `note.type != "页面"` 排除 `custom-type=页面` 的常驻页面。
- `content/reading.md`（随记）由思源 `/对象/阅读随记` 同步生成（`custom-permalink=/reading/`、`custom-backlinks=true`、`custom-type=随记`）：正文为文档本身内容，其后按日期列出日记中引用该文档的列表项。在日记里写一个只含 `[[阅读随记]]` 的列表项，把短评写在它的子项中即可。时间线与首页按 `note.type != "随记"` 排除该页。
- 动态列表与卡片直接写在页面内的 `base` 代码块中，不创建独立 `.base` 文件，避免将查询收录结果注入全局图谱。

## 组件约定

字形规范：标题沿用 Markdown 的 h1 到 h3，自定义组件只使用正文（1rem，强调用 600 字重）与辅助（`--sw-meta-size`，灰色）两种字形；元素间距遵循「组内近、组间远」。

`site/components/bases-views.tsx` 向 `@quartz-community/bases-page` 注册三个自定义视图：

- `post-list`：默认是日期加标题的列表；`grouped: true` 按年份分组并生成年份跳转，`showDescription: true` 显示摘要，`featured: true` 改为大标题加摘要的精选样式，`more` 在底部加「完整时间线」链接。
- `cover-grid`：封面卡片网格；`cover` 来自思源原生题头图 `title-img`，无封面时使用渐变标题占位，状态（无状态时为类型）与评分以角标叠在封面上；状态为 `Demo` 时评分表示对正式版的期待，显示为「期待 N」。游戏页按 `status` 是否为 `Demo` 区分 Demo 与游玩记录。
- `project-showcase`：每个项目一节，左侧题头图截图（无截图时用与游戏卡片相同的渐变标题占位），右侧依次为项目名、状态与一句话描述；`compact: true` 改为首页使用的紧凑列表（只有项目名与描述），`more` 在底部加「全部项目」链接。精选、紧凑项目与时间线条目整行都是链接。

## 图谱与反向链接

- 反向链接由 Quartz 原生 Backlinks 提供；仅正文中显式书写的站内链接生成图谱边与反向链接。
- 局部图谱深度为 1，不展示标签节点；关闭标签页和自动文件夹索引。
- 所有页面保持同一布局，右侧都显示关系图谱；无反向链接的页面自动隐藏空的反向链接区块。聚合页（`posts`、`projects`、`about`、`reading`、`links`、`not-public`、`games/taste`）及各项目页隐藏日期。

