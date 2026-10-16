# AboutHome 维护说明

组件位置：`docs/.vuepress/components/AboutHome.vue`  
页面位置：`docs/README.md`

## 内容来源

- 个人资料、社交链接、Projects 和兴趣等条目直接在组件中维护。
- Latest blogs 和 Recent Games 从主题的 `usePostsData()` 读取文章，各显示最多 4 篇；通过分类首段是否为 `games` 区分。
- 首页使用自定义组件，不依赖文章生成脚本或 Frontmatter 卡片字段。

## 卡片布局

- 移动端单列，`sm` 起两列，`xl` 起三列；`lg` 起个人资料位于左侧。
- `sm` 起卡片采用方形比例，并裁切溢出内容；移动端单列按内容自然撑高。
- Projects 标签应简短，避免桌面三列布局下因标签换行将最后一项挤至卡片底部。`game-shelf-card` 的标签为「GitHub 游戏卡」。
- 主题自定义首页会包裹 `.vp-doc`；卡片保留主题标题的顶部内边距、列表圆点、缩进及条目外边距，配合组件的列表 `gap` 保持疏朗排版。仅清除卡片标题的顶部外边距。

修改组件后同步更新本文档，并在桌面三列、平板两列及手机单列下检查 Projects 最后一项和卡片底部留白。
