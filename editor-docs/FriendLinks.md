# FriendLinks 维护说明

> 维护者文档（非访客文章）

组件位置：`docs/.vuepress/components/FriendLinks.vue`
页面位置：`docs/links.md`

## 基础用法

在 `docs/links.md` 的 Frontmatter 中维护友链数据，组件自动读取渲染。

```md
---
title: 友链
pageLayout: home
permalink: /links/
links:
  - name: 站点名称
    url: https://example.com
    avatar: https://example.com/favicon.png
    description: 一句话描述
---

<FriendLinks />
```

## 友链字段

| 字段          | 必填 | 说明                                |
| ------------- | ---- | ----------------------------------- |
| `name`        | ✅   | 站点名称                            |
| `url`         | ✅   | 站点地址                            |
| `avatar`      | ❌   | 头像/图标 URL，加载失败时显示首字母   |
| `description` | ❌   | 一句话描述，过长会自动截断            |

## 添加友链

在 `docs/links.md` 的 `links` 数组中追加一项即可，无需修改组件代码：

```yaml
links:
  - name: 新朋友
    url: https://new-friend.dev
    avatar: https://new-friend.dev/avatar.png
    description: 做了很酷的事情
```

## 设计细节

- 响应式网格：移动端 1 列，平板 2 列，桌面 3 列
- 卡片悬浮时微微上移 + spotlight 微光效果（与 PostMasonry 同源）
- 头像加载失败会自动回退为站名首字母
- 点击整张卡片在新标签页打开目标站点

## 维护要求

- 新建组件后需在 `docs/.vuepress/client.ts` 中 import 并 `app.component()` 注册，否则 dev/build 均无法识别
- 修改本组件时，同步更新本文档
- 如新增字段（如 `rss`、`tags`），先更新本文档约定，再改组件逻辑
