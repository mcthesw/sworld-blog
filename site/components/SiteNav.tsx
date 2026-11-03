import { FullSlug, resolveRelative } from "../../quartz/util/path"
import { QuartzComponent, QuartzComponentProps } from "../../quartz/components/types"

const items: { text: string; slug: string }[] = [
  { text: "首页", slug: "index" },
  { text: "笔记", slug: "posts" },
  { text: "游戏", slug: "games" },
  { text: "阅读", slug: "reading" },
  { text: "友链", slug: "links" },
]

const SiteNav: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const current = fileData.slug as FullSlug
  return (
    <nav class="site-nav" aria-label="全站导航">
      {items.map((item) => (
        <a
          href={resolveRelative(current, item.slug as FullSlug)}
          class={current === item.slug ? "internal active" : "internal"}
          aria-current={current === item.slug ? "page" : undefined}
        >
          {item.text}
        </a>
      ))}
    </nav>
  )
}

SiteNav.css = `
.site-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
}
.site-nav a {
  color: var(--darkgray);
  background: none;
  padding: 0.35rem 0;
  font-weight: 500;
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
    gap: 0.25rem 1.25rem;
    margin: 1rem 0 0;
  }
}
`

export default () => SiteNav
