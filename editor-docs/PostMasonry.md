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

## 游戏卡片规则

组件按分类自动切换样式：

- `games/review`（长评）
  - 展示：头图、游戏名、标题、一句话简评、评分
  - 标签：`score:8.5` 或 `评分:8.5`

- `games/demo`（Demo体验）
  - 展示：标题、期待值
  - 标签：`期待:8.5`、`期待值:8.5`、`expect:8.5`
  - 兼容旧数据：若没有期待值但有评分标签，会回退显示该值

- `games/clear`（游玩记录）
  - 展示：头图（可选）、游戏名、状态
  - 状态标签：`状态:通关！` / `状态:游玩中` / `状态:搁置` / `状态:想玩` / `状态:放弃`

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
