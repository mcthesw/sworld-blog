import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PageTypes } from "./quartz/plugins"
import SiteNav from "./site/components/SiteNav"
import { registerSiteViews } from "./site/components/bases-views"

registerSiteViews()
const config = await loadQuartzConfig()

const nav = SiteNav()
export const layout = await loadQuartzLayout()
for (const [pageType, pageLayout] of Object.entries({
  default: layout.defaults,
  ...layout.byPageType,
})) {
  if (pageType !== "404") pageLayout.left = [...(pageLayout.left ?? []), nav]
}

// Quartz 5.0.0 的配置加载器会忽略这里导出的 layout，需要手动替换默认的 PageTypeDispatcher。
config.plugins.emitters = [
  ...config.plugins.emitters.filter((e) => e.name !== "PageTypeDispatcher"),
  PageTypes.PageTypeDispatcher(layout),
]

export default config
