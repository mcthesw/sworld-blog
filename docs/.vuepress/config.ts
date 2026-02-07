/**
 * 查看以下文档了解主题配置
 * - @see https://theme-plume.vuejs.press/config/intro/ 配置说明
 * - @see https://theme-plume.vuejs.press/config/theme/ 主题配置项
 *
 * 请注意，对此文件的修改都会重启 vuepress 服务。
 * 部分配置项的更新没有必要重启 vuepress 服务，建议请在 `.vuepress/config.ts` 文件中配置
 *
 * 特别的，请不要在两个配置文件中重复配置相同的项，当前文件的配置项会被覆盖
 */

import { viteBundler } from '@vuepress/bundler-vite'
import { createHash } from 'node:crypto'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

function parseYearMonth(input: unknown): { year: string, month: string } | undefined {
  if (typeof input !== 'string' && typeof input !== 'number') return undefined
  const text = String(input).trim()
  if (!text) return undefined

  const match = text.match(/^(\d{4})[\/-](\d{1,2})[\/-]\d{1,2}/)
  if (!match) return undefined

  return {
    year: match[1],
    month: match[2].padStart(2, '0'),
  }
}

function makeAbbrlink(seed: string): string {
  return createHash('sha1').update(seed).digest('hex').slice(0, 8)
}

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: 'Sworld\'s World',
  description: 'Sworld的博客',

  head: [
    // 配置站点图标
    ['link', { rel: 'icon', type: 'image/png', href: 'https://avatars.githubusercontent.com/u/61224072?v=4' }],
  ],

  bundler: viteBundler(),
  shouldPrefetch: false, // 站点较大，页面数量较多时，不建议启用

  theme: plumeTheme({
    /* 添加您的部署域名, 有助于 SEO, 生成 sitemap */
    hostname: 'https://blog.sworld.club',

    /* 文档仓库配置，用于 editLink */
    // docsRepo: '',
    // docsDir: 'docs',
    // docsBranch: '',

    /* 页内信息 */
    // editLink: true,
    // lastUpdated: true,
    // contributors: true,
    // changelog: false,

    /**
     * 编译缓存，加快编译速度
     * @see https://theme-plume.vuejs.press/config/theme/#cache
     */
    cache: 'filesystem',

    /**
     * 为 markdown 文件自动添加 frontmatter 配置
     * @see https://theme-plume.vuejs.press/config/theme/#autofrontmatter
     */
    autoFrontmatter: {
      // 关闭默认 nanoid permalink，改由 transform 生成与历史文章一致的格式。
      permalink: false,
      createTime: true, // 是否生成创建时间
      title: true,      // 是否生成标题
      transform: (data, context) => {
        const relativePath = context.relativePath.replace(/\\/g, '/')
        const isPost = /^(computer|misc|games\/(demo|review|clear))\/.+\/index\.md$/.test(relativePath)
        if (!isPost) return data

        const rawAbbrlink = data.abbrlink
        const abbrlink = (typeof rawAbbrlink === 'string' || typeof rawAbbrlink === 'number')
          ? String(rawAbbrlink).trim()
          : ''
        const nextAbbrlink = abbrlink || makeAbbrlink(`${relativePath}|${String(data.title ?? '')}|${String(data.createTime ?? '')}`)
        if (!abbrlink) data.abbrlink = nextAbbrlink

        if (!data.permalink) {
          const yearMonth = parseYearMonth(data.date ?? data.createTime)
          if (yearMonth) {
            data.permalink = `/${yearMonth.year}/${yearMonth.month}/${nextAbbrlink}/`
          }
        }

        return data
      },
    },

    /* 本地搜索, 默认启用 */
    search: { provider: 'local' },

    /**
     * Algolia DocSearch
     * 启用此搜索需要将 本地搜索 search 设置为 false
     * @see https://theme-plume.vuejs.press/config/plugins/search/#algolia-docsearch
     */
    // search: {
    //   provider: 'algolia',
    //   appId: '',
    //   apiKey: '',
    //   indices: [''],
    // },

    /**
     * Shiki 代码高亮
     * @see https://theme-plume.vuejs.press/config/plugins/code-highlight/
     */
    // codeHighlighter: {
    //   twoslash: true, // 启用 twoslash
    //   whitespace: true, // 启用 空格/Tab 高亮
    //   lineNumbers: true, // 启用行号
    // },

    /* 文章字数统计、阅读时间，设置为 false 则禁用 */
    // readingTime: true,

    /**
     * markdown
     * @see https://theme-plume.vuejs.press/config/markdown/
     */
    markdown: {
      //   abbr: true,         // 启用 abbr 语法  *[label]: content
      //   annotation: true,   // 启用 annotation 语法  [+label]: content
      //   pdf: true,          // 启用 PDF 嵌入 @[pdf](/xxx.pdf)
      //   caniuse: true,      // 启用 caniuse 语法  @[caniuse](feature_name)
      //   plot: true,         // 启用隐秘文本语法 !!xxxx!!
      bilibili: true,     // 启用嵌入 bilibili视频 语法 @[bilibili](bid)
      youtube: true,      // 启用嵌入 youtube视频 语法 @[youtube](video_id)
      //   artPlayer: true,    // 启用嵌入 artPlayer 本地视频 语法 @[artPlayer](url)
      //   audioReader: true,  // 启用嵌入音频朗读功能 语法 @[audioReader](url)
      //   icon: { provider: 'iconify' },        // 启用内置图标语法  ::icon-name::
      //   table: true,        // 启用表格增强容器语法 ::: table
      //   codepen: true,      // 启用嵌入 codepen 语法 @[codepen](user/slash)
      //   replit: true,       // 启用嵌入 replit 语法 @[replit](user/repl-name)
      //   codeSandbox: true,  // 启用嵌入 codeSandbox 语法 @[codeSandbox](id)
      //   jsfiddle: true,     // 启用嵌入 jsfiddle 语法 @[jsfiddle](user/id)
      //   npmTo: true,        // 启用 npm-to 容器  ::: npm-to
      //   demo: true,         // 启用 demo 容器  ::: demo
      //   collapse: true,     // 启用折叠容器  ::: collapse
      //   repl: {             // 启用 代码演示容器
      //     go: true,         // ::: go-repl
      //     rust: true,       // ::: rust-repl
      //     kotlin: true,     // ::: kotlin-repl
      //     python: true,     // ::: python-repl
      //   },
      //   math: {             // 启用数学公式
      //     type: 'katex',
      //   },
      //   chartjs: true,      // 启用 chart.js
      //   echarts: true,      // 启用 ECharts
      mermaid: true,      // 启用 mermaid
      //   flowchart: true,    // 启用 flowchart
      //   image: {
      //     figure: true,     // 启用 figure
      //     lazyload: true,   // 启用图片懒加载
      //     mark: true,       // 启用图片标记
      //     size: true,       // 启用图片大小
      //   },
      //   include: true,      // 在 Markdown 文件中导入其他 markdown 文件内容
      // 预计算图片尺寸：构建时为图片补充 width/height，避免页面抖动。
      imageSize: 'local',
    },

    /**
     * 水印
     * @see https://theme-plume.vuejs.press/guide/features/watermark/
     */
    // watermark: true,

    /**
     * 评论 comments
     * @see https://theme-plume.vuejs.press/guide/features/comments/
     */
    comment: {
      provider: 'Giscus',
      comment: true,
      repo: 'mcthesw/sworld-blog',
      repoId: 'R_kgDOHffXoA',
      category: 'Announcements',
      categoryId: 'DIC_kwDOHffXoM4CiL_b',
      mapping: 'og:title',
      reactionsEnabled: true,
      inputPosition: 'top',
      lazyLoading: true,
      lightTheme: 'light',
      darkTheme: 'dark_dimmed',
    },

    /**
     * 资源链接替换
     * @see https://theme-plume.vuejs.press/guide/features/replace-assets/
     */
    // replaceAssets: 'https://cdn.example.com',

    /**
     * 加密功能
     * @see https://theme-plume.vuejs.press/guide/features/encryption/
     */
    // encrypt: {},

    /**
     * 启用 llmstxt 插件，用于为大语言模型提供更友好的内容
     * @see https://theme-plume.vuejs.press/guide/features/llmstxt/
     */
    // llmstxt: {
    //   locale: '/',    // 默认仅为主语言生成 llms 友好内容
    // }
  }),
})
