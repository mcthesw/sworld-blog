/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export default defineNavbarConfig([
  { text: '计算机', link: '/computer/' },
  {
    text: '游戏',
    items: [
      { text: '游戏偏好', link: '/games/' },
      { text: 'Demo体验', link: '/games/demo/' },
      { text: '长评', link: '/games/review/' },
      { text: '通关记录', link: '/games/clear/' },
    ],
  },
  { text: '杂项', link: '/misc/' },
  { text: '关于我', link: '/' },
  { text: '标签', link: '/blog/tags/' },
  { text: '全部文章', link: '/blog/archives/' },
])
