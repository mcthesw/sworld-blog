import path from "node:path"
import { collectMarkdownRewriteRules } from "./markdown-rewrite.js"
import { optimizeDistImages } from "./image-convert.js"

const PLUGIN_NAME = "@sworld/vuepress-plugin-image-webp"

const DEFAULT_INCLUDE = [
  "**/*.png",
  "**/*.jpg",
  "**/*.jpeg",
  "**/*.PNG",
  "**/*.JPG",
  "**/*.JPEG",
]

const DEFAULT_EXCLUDE = [
  ".vuepress/**",
  "**/.vuepress/**",
  "**/node_modules/**",
]

export interface ImageWebpPluginOptions {
  enableInDev?: boolean
  quality?: number
  rewriteMarkdown?: boolean
  rewriteFrontmatterCover?: boolean
  keepOriginalInDist?: boolean
  include?: string[]
  exclude?: string[]
}

interface ResolvedImageWebpPluginOptions {
  enableInDev: boolean
  quality: number
  rewriteMarkdown: boolean
  rewriteFrontmatterCover: boolean
  keepOriginalInDist: boolean
  include: string[]
  exclude: string[]
}

interface AppLike {
  env: {
    isDev: boolean
  }
  dir: {
    source: () => string
    dest: () => string
    cache: () => string
  }
}

export default function imageWebpPlugin(rawOptions: ImageWebpPluginOptions = {}) {
  const options: ResolvedImageWebpPluginOptions = {
    enableInDev: false,
    quality: 82,
    rewriteMarkdown: true,
    rewriteFrontmatterCover: true,
    keepOriginalInDist: false,
    include: DEFAULT_INCLUDE,
    exclude: DEFAULT_EXCLUDE,
    ...rawOptions,
  }

  let markdownRewriteRules = new Map<string, string>()

  return {
    name: PLUGIN_NAME,
    async onInitialized(app: AppLike) {
      if (app.env.isDev && !options.enableInDev) return

      markdownRewriteRules = await collectMarkdownRewriteRules({
        sourceDir: app.dir.source(),
        include: options.include,
        exclude: options.exclude,
        rewriteMarkdown: options.rewriteMarkdown,
        rewriteFrontmatterCover: options.rewriteFrontmatterCover,
      })
    },
    async onGenerated(app: AppLike) {
      if (app.env.isDev && !options.enableInDev) return

      const result = await optimizeDistImages({
        distDir: app.dir.dest(),
        quality: options.quality,
        keepOriginalInDist: options.keepOriginalInDist,
        include: options.include,
        exclude: options.exclude,
        replacementRules: markdownRewriteRules,
        cacheDir: path.join(app.dir.cache(), "image-webp"),
      })

      const savedBytes = Math.max(0, result.originalBytes - result.webpBytes)
      const savedRate = result.originalBytes > 0
        ? ((savedBytes / result.originalBytes) * 100).toFixed(1)
        : "0.0"

      log(
        `Converted ${result.convertedCount} files, `
        + `${(result.originalBytes / 1024).toFixed(1)}KB -> ${(result.webpBytes / 1024).toFixed(1)}KB, `
        + `saved ${savedRate}%`,
      )

      if (!options.keepOriginalInDist) {
        log(`Pruned ${result.deletedCount} originals, kept ${result.keptCount} originals`)
      }

      for (const warning of result.warnings) {
        warn(warning)
      }
    },
  }
}

function log(message: string): void {
  console.info(`${PLUGIN_NAME}:  ✔ ${message}`)
}

function warn(message: string): void {
  console.warn(`${PLUGIN_NAME}:  ⚠ ${message}`)
}
