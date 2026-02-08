# PostMasonry 维护说明

> 维护者文档（非访客文章）

组件位置：`docs/.vuepress/components/PostMasonry.vue`

## 基础用法

```vue
<PostMasonry collection="/" category="games/demo" />
```

## Props

- `collection`：文章集合 key，当前统一使用 `"/"`
- `category`：分类前缀，例如 `computer`、`games/demo`、`games/review`、`games/clear`
- `title`：可选标题
- `limit`：最多显示条数，默认 `999`

## 文章顶部怎么打标签（Frontmatter）

`PostMasonry` 读取的是文章顶部 YAML（Frontmatter）里的 `tags` 数组。

- 评分 / 期待值 / 状态都写进 `tags`

通用模板：

```md
---
title: 文章标题
tags:
  - 普通标签
  - 另一个标签
createTime: 2026/02/07 12:00:00
abbrlink: 1a2b3c4d
cover: /2026/02/1a2b3c4d/cover.webp # 可选，和脚本注释模板一致
permalink: /2026/02/1a2b3c4d/
---
```

说明：

- `tags` 中未被识别为特殊标签的内容，会作为普通标签展示
- 分类由文章路径决定（如 `docs/games/review/xxx/index.md`），不是在 Frontmatter 里单独写 `category`
- `games/clear` 的“游戏名”优先取路径第三级目录名（`docs/games/clear/<游戏名>/index.md`）
- `cover` 支持两种写法：
  - 绝对路径：`/2026/02/1a2b3c4d/cover.webp`（放在 `public`）
  - 同目录相对文件名：`cover.webp` / `208472~1.JPG`（图片和 `index.md` 同级）

## 与根目录脚本的对应关系

优先使用根目录脚本创建文章，可保证 Frontmatter 与组件解析规则一致。

```bash
pnpm new:game demo "游戏名"
pnpm new:game review "游戏名"
pnpm new:game clear "游戏名"
```

`scripts/new-game-post.mjs` 的默认输出如下：

- `demo`：`tags: [游戏, Demo体验, 期待:8.5]`
- `review`：`tags: [游戏, 长评, score:8.5]`
- `clear`：`tags: [游戏, 游玩记录, 状态:游玩中]`

并且会自动写入：

- `title`
- `tags`
- `abbrlink`（8 位短链 ID）
- `createTime`（`YYYY/MM/DD HH:mm:ss`）
- `permalink`（默认 `/YYYY/MM/abbrlink/`）

`docs/.vuepress/config.ts` 的 `autoFrontmatter.transform` 也按同样规则兜底：

- 缺 `abbrlink` 时补 8 位短链 ID
- 缺 `permalink` 时补 `/YYYY/MM/abbrlink/`

## 游戏卡片规则

组件按分类自动切换样式：

- `games/review`（长评）
  - 展示：头图、游戏名、标题、一句话简评、评分
  - 标签（写在 `tags` 里）：`score:8.5`、`评分:8.5`、`8.5分`

  ```md
  ---
  title: 某游戏长评
  tags:
    - 游戏
    - 评分:8.5
    - JRPG
  ---
  ```

- `games/demo`（Demo体验）
  - 展示：头图（可选）、标题、期待值
  - 标签（写在 `tags` 里）：`期待:8.5`、`期待值:8.5`、`expect:8.5`、`期待 8.5`
  - 兼容旧数据：若没有期待值但有评分标签，会回退显示该值

  ```md
  ---
  title: 某游戏 Demo 体验
  tags:
    - Demo体验
    - expect:7.5
    - 动作
  ---
  ```

- `games/clear`（游玩记录）
  - 展示：头图（可选）、游戏名、状态
  - 状态标签（写在 `tags` 里）：
    - 推荐：`状态:通关！` / `状态:游玩中` / `状态:搁置` / `状态:想玩` / `状态:放弃`
    - 兼容：`在玩`、`弃坑`、`已通关`（会自动映射）

  ```md
  ---
  title: DLC 通关记录
  tags:
    - 状态:游玩中
    - RPG
  ---
  ```

## 状态强类型约定

组件内使用联合类型 `GamePlayStatus` 约束状态值：

- `通关！`
- `游玩中`
- `搁置`
- `想玩`
- `放弃`

别名（如 `在玩`、`弃坑`）会被映射到上述标准值。

## 维护要求

- 修改本组件时，同步更新本文档。
- 如新增字段（平台、时长等），先更新本文档约定，再改组件逻辑。
