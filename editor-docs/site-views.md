# 时间线、双链与聚合页展示

## 页面与查询

- 左侧导航由 `site/components/SiteNav.tsx` 提供，分为主内容区（`首页`、`时间线`、`项目`、`游戏`、`随记`）与个人站点区（`关于我`、`厉害的人们`）。桌面端竖排在搜索框下方，800px 以下自适应横排。
- `content/index.md`（首页）依次展示头像与社交链接、精选、项目、最近的笔记与推荐。
- `content/posts.md`（时间线）按年份分组倒序展示全站笔记，并提供「全部 / 文章 / 精选」视图切换。
- `content/projects.md`（项目）列出维护与参与的开源项目；`content/about.md`（关于我）列出近况。
- `content/games.md`（游戏）通过 `type: 游戏` 收录游玩记录与新品节 Demo 卡片，下方为手写的游戏偏好。
- `content/reading.md`（随记）按时间倒序收纳对书籍、漫画、游戏等作品的即兴短评，支持在思源中通过 `custom-backlinks=true` 从日记反向链接块采集。
- 动态列表与卡片直接写在页面内的 `base` 代码块中，不创建独立 `.base` 文件，避免将查询收录结果注入全局图谱。

## 组件约定

`site/components/bases-views.tsx` 向 `@quartz-community/bases-page` 注册两个自定义视图：

- `post-list`：支持按年份分组的时间线模式（`grouped: true`）、摘要展示（`showDescription: true`）以及底部「完整时间线」跳转链接（`more`）。
- `cover-grid`：封面卡片网格；`cover` 来自思源原生题头图 `title-img`，无封面时使用渐变标题占位，类型、状态、评分与期待值以角标叠在封面上。

## 图谱与反向链接

- 反向链接由 Quartz 原生 Backlinks 提供；仅正文中显式书写的站内链接生成图谱边与反向链接。
- 局部图谱深度为 1，不展示标签节点；关闭标签页和自动文件夹索引。
- 无反向链接的页面自动隐藏空的反向链接区块；纯查询或外链聚合页（`posts`、`reading`、`links`、`not-public`）隐藏右侧图谱与反向链接。

