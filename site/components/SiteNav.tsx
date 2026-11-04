import { FullSlug, resolveRelative } from "../../quartz/util/path"
import { QuartzComponent, QuartzComponentProps } from "../../quartz/components/types"

const primaryItems: { text: string; slug: string }[] = [
  { text: "首页", slug: "index" },
  { text: "时间线", slug: "posts" },
  { text: "项目", slug: "projects" },
  { text: "游戏", slug: "games" },
  { text: "随记", slug: "reading" },
]

const secondaryItems: { text: string; slug: string }[] = [
  { text: "关于我", slug: "about" },
  { text: "厉害的人们", slug: "links" },
]

const SiteNav: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const current = fileData.slug as FullSlug
  const renderLink = (item: { text: string; slug: string }) => (
    <a
      href={resolveRelative(current, item.slug as FullSlug)}
      class={current === item.slug ? "internal active" : "internal"}
      aria-current={current === item.slug ? "page" : undefined}
    >
      {item.text}
    </a>
  )
  return (
    <nav class="site-nav" aria-label="全站导航">
      <div class="site-nav-group">{primaryItems.map(renderLink)}</div>
      <div class="site-nav-group">{secondaryItems.map(renderLink)}</div>
    </nav>
  )
}

SiteNav.css = `
.site-nav {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 0.5rem 0 0;
  font-size: 0.94rem;
}
.site-nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.site-nav a {
  color: var(--darkgray);
  background: none;
  padding: 0.25rem 0;
  font-weight: 500;
  transition: color 0.15s ease;
}
.site-nav a:hover,
.site-nav a.active {
  color: var(--secondary);
}
@media (max-width: 800px) {
  .page > #quartz-body .sidebar.left { flex-wrap: wrap; }
  .site-nav {
    flex: 0 0 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.35rem 1.15rem;
    margin: 0.85rem 0 0;
  }
  .site-nav-group {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.35rem 1.15rem;
  }
}
`

export default () => SiteNav

