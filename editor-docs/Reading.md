# Reading 维护说明

> 维护者文档（非访客文章）

阅读板块位置：

- 入口页：`docs/reading/README.md`
- 随读流：`docs/reading/stream/README.md`
- 旧年份随读归档：`docs/reading/stream/<记录年份>/README.md`
- 读后长文列表：`docs/reading/reviews/README.md`
- 读后长文正文：`docs/reading/reviews/<作品名>/index.md`

组件位置：

- `docs/.vuepress/components/ReadingHome.vue`
- `docs/.vuepress/components/ReadingStream.vue`
- `docs/.vuepress/components/ReadingNote.vue`
- `docs/.vuepress/components/ReadingLinks.vue`

## 内容边界

- 随读流用于轻量记录，所有书、漫画等作品可以混在一个时间流里。
- 读后长文只在读完后需要沉淀时再写。
- 作品年份必须显式标记；同一主题在不同时代的语境差异很大，随读记录使用 `year` 字段，长文 Frontmatter 使用 `year` 字段和 `年份:xxx` 标签。
- Anki、Telegram、网盘或其它材料只作为外部链接，不作为博客的主数据源。
- 不维护精细进度系统；`progress` 只写当前这条记录需要展示的粗略位置。

## 阅读首页介绍

`docs/reading/README.md` 的 `ReadingHome` 支持正文插槽。首页介绍写在组件内部即可：

```md
<ReadingHome>

这里写阅读首页的一小段介绍。

</ReadingHome>
```

如果只保留注释或空行，页面不会显示空白说明。

## 随读流条目

当前年份的随读条目写在 `docs/reading/stream/README.md` 的 `reading-stream:start` 和 `reading-stream:end` 标记之间。这个页面顶部保留年份目录，下面直接展示当前年份的随读流。

旧年份归档写在 `docs/reading/stream/<记录年份>/README.md` 的同名标记之间。总览页不展开所有旧年份，避免页面长期膨胀。

```md
<ReadingNote
  id="fire-punch-2026-05-25"
  book="炎拳"
  author="藤本树"
  year="2016-2018"
  kind="漫画"
  status="在读"
  date="2026-05-25"
  progress="第 1 卷"
  tags="漫画, 藤本树"
>

这里写一段轻量随读。

</ReadingNote>
```

常用字段：

- `id`：页面内锚点，用于从长文跳回随读记录。
- `book`：作品名。
- `author`：作者，可选。
- `year`：作品写成、出版或连载年份；不确定单年时可以写范围，如 `2016-2018`。
- `kind`：作品类型，如 `书籍`、`漫画`。
- `status`：推荐使用 `在读`、`读完`、`暂停`、`想读`、`放弃`。
- `date`：记录日期，格式 `YYYY-MM-DD`。
- `progress`：粗略进度，可选。
- `tags`：逗号分隔标签。
- `review`：长文链接，可选。
- `anki`：Anki 卡片链接，可选。
- `telegram`：Telegram 原消息链接，可选。

也可以用脚手架追加一条随读：

```bash
pnpm new:reading note "炎拳" --author "藤本树" --year "2016-2018" --kind "漫画" --status "在读" --text "先记一笔。"
```

脚手架会按记录日期写入目标页面：当前年份写入 `docs/reading/stream/README.md`，旧年份写入 `docs/reading/stream/<记录年份>/README.md`。如果旧年份页面不存在，会自动创建基础模板。需要补录旧记录时，可以传 `--date "2025-12-31"`。

## 读后长文

读后长文通过 `PostMasonry` 在 `docs/reading/reviews/README.md` 聚合，目录结构为：

```text
docs/reading/reviews/<作品名>/index.md
```

创建命令：

```bash
pnpm new:reading review "炎拳" --title "《炎拳》读后" --year "2016-2018"
```

长文 Frontmatter 约定：

```md
---
title: 《炎拳》读后
tags:
  - 阅读
  - 长文
  - 漫画
  - 作者:藤本树
  - 年份:2016-2018
abbrlink: 1a2b3c4d
createTime: 2026/05/25 12:00:00
permalink: /2026/05/1a2b3c4d/
year: 2016-2018
excerpt: 一句话总结
---
```

如果有随读记录、Anki 或 Telegram 链接，可以在正文开头放：

```md
<ReadingLinks
  title="相关材料"
  stream="/reading/stream/#fire-punch-2026-05-25"
  anki="https://example.com/anki"
  telegram="https://t.me/example/123"
/>
```

## 同步要求

- 修改 `Reading*.vue` 组件时，同步更新本文档。
- 修改阅读长文的 Frontmatter 字段或路径约定时，同步检查：
  - `editor-docs/Reading.md`
  - `docs/.vuepress/components/Reading*.vue`
  - `scripts/new-reading-post.ts`
  - `docs/.vuepress/collections.ts`
  - `docs/.vuepress/config.ts`
