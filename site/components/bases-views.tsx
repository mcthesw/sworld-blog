import { viewRegistry, type ViewRendererProps } from "@quartz-community/bases-page"
import { FullSlug, pathToRoot, resolveRelative } from "../../quartz/util/path"

type Entry = ViewRendererProps["entries"][number]

const prop = (e: Entry, key: string) => {
  const v = e.properties[key]
  return v === undefined || v === null || v === "" ? undefined : v
}

function day(e: Entry, full = true) {
  const raw = prop(e, "date")
  if (!raw) return ""
  const d = new Date(String(raw))
  const pad = (n: number) => String(n).padStart(2, "0")
  const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return full ? `${d.getFullYear()}-${md}` : md
}

function yearOf(e: Entry) {
  const raw = prop(e, "date")
  if (!raw) return "其他"
  return String(new Date(String(raw)).getFullYear())
}

function hue(text: string) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) % 360
  return h
}

function assetUrl(slug: string, src: string) {
  return /^https?:/.test(src) ? src : `${pathToRoot(slug as FullSlug)}/${src.replace(/^\//, "")}`
}

function chips(e: Entry) {
  const out: string[] = []
  const status = prop(e, "status")
  out.push(String(status ?? prop(e, "type")))
  const score = prop(e, "score")
  // Demo 的评分表示对正式版的期待，不是对成品的评价。
  if (score) out.push(status === "Demo" ? `期待 ${score}` : `★ ${score}`)
  return out
}

const Cover = ({ e, slug }: { e: Entry; slug: string }) => {
  const cover = prop(e, "cover") as string | undefined
  const h = hue(e.title)
  return (
    <div class="sw-cover-image" style={cover ? undefined : `--h1:${h};--h2:${(h + 50) % 360}`}>
      {cover ? (
        <img src={assetUrl(slug, cover)} alt="" loading="lazy" />
      ) : (
        <span class="sw-cover-fallback">{e.title}</span>
      )}
    </div>
  )
}

const PostList = ({ entries, slug, view }: ViewRendererProps) => {
  const opts = view as Record<string, unknown>
  const more = opts.more as string | undefined
  const grouped = opts.grouped === true
  const showDesc = opts.showDescription === true
  const featured = opts.featured === true
  const href = (e: Entry) => resolveRelative(slug as FullSlug, e.slug as FullSlug)

  if (featured) {
    return (
      <ul class="sw-featured">
        {entries.map((e) => (
          <li>
            <a class="internal sw-item" href={href(e)}>
              <strong class="sw-item-title">{e.title}</strong>
              {prop(e, "description") && <p>{String(prop(e, "description"))}</p>}
            </a>
          </li>
        ))}
      </ul>
    )
  }

  const renderItem = (e: Entry, fullDate: boolean) => {
    const desc = showDesc ? (prop(e, "description") as string | undefined) : undefined
    return (
      <li>
        <a class="internal sw-item" href={href(e)}>
          <time class={fullDate ? "is-full" : undefined}>{day(e, fullDate)}</time>
          <span class="sw-post-content">
            <span class="sw-post-head">
              <span class="sw-item-title">{e.title}</span>
            </span>
            {desc && <span class="sw-meta">{desc}</span>}
          </span>
        </a>
      </li>
    )
  }

  if (grouped) {
    const groups: { year: string; list: Entry[] }[] = []
    for (const e of entries) {
      const y = yearOf(e)
      const last = groups[groups.length - 1]
      if (!last || last.year !== y) groups.push({ year: y, list: [e] })
      else last.list.push(e)
    }
    // 同一页面的多个视图都会渲染年份锚点，用视图名区分避免 id 冲突。
    const anchor = (year: string) => `sw-${String(opts.name ?? "list")}-${year}`
    return (
      <div class={showDesc ? "sw-post-list sw-timeline" : "sw-post-list sw-timeline is-compact"}>
        <nav class="sw-year-nav" aria-label="按年份跳转">
          {groups.map((g) => (
            <a href={`#${anchor(g.year)}`}>
              {g.year}
              <span class="sw-meta">{g.list.length}</span>
            </a>
          ))}
        </nav>
        {groups.map((g) => (
          <section class="sw-year-group" id={anchor(g.year)}>
            <h3 class="sw-year-label">{g.year}</h3>
            <ul>{g.list.map((e) => renderItem(e, false))}</ul>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div class="sw-post-list">
      <ul>{entries.map((e) => renderItem(e, true))}</ul>
      {more && (
        <a class="internal sw-more" href={resolveRelative(slug as FullSlug, more as FullSlug)}>
          完整时间线
        </a>
      )}
    </div>
  )
}

const CoverGrid = ({ entries, slug, view }: ViewRendererProps) => {
  const compact = (view as Record<string, unknown>).compact === true
  return (
    <div class={compact ? "sw-cover-grid compact" : "sw-cover-grid"}>
      {entries.map((e) => {
        const desc = prop(e, "description") as string | undefined
        return (
          <a class="internal sw-cover-card" href={resolveRelative(slug as FullSlug, e.slug as FullSlug)}>
            <div class="sw-cover-frame">
              <Cover e={e} slug={slug} />
              <div class="sw-cover-chips">
                {chips(e).map((c) => (
                  <span>{c}</span>
                ))}
              </div>
            </div>
            <div class="sw-cover-body">
              <strong>{e.title}</strong>
              {!compact && desc && <p class="sw-meta">{desc}</p>}
              <time class="sw-meta">{day(e)}</time>
            </div>
          </a>
        )
      })}
    </div>
  )
}

const ProjectShowcase = ({ entries, slug, view }: ViewRendererProps) => {
  const opts = view as Record<string, unknown>
  const more = opts.more as string | undefined
  const href = (e: Entry) => resolveRelative(slug as FullSlug, e.slug as FullSlug)
  const desc = (e: Entry) => prop(e, "description") as string | undefined
  const status = (e: Entry) => prop(e, "status") as string | undefined

  if (opts.compact === true) {
    return (
      <div class="sw-projects-compact">
        <ul>
          {entries.map((e) => (
            <li>
              <a class="internal sw-item" href={href(e)}>
                <strong class="sw-item-title">{e.title}</strong>
                {desc(e) && <span class="sw-meta">{desc(e)}</span>}
              </a>
            </li>
          ))}
        </ul>
        {more && (
          <a class="internal sw-more" href={resolveRelative(slug as FullSlug, more as FullSlug)}>
            全部项目
          </a>
        )}
      </div>
    )
  }

  return (
    <div class="sw-showcase">
      {entries.map((e) => (
        <section class="sw-showcase-item">
          <a class="internal sw-showcase-media" href={href(e)} aria-hidden="true" tabindex={-1}>
            <Cover e={e} slug={slug} />
          </a>
          <div class="sw-showcase-text">
            <h2>
              <a class="internal" href={href(e)}>
                {e.title}
              </a>
            </h2>
            {status(e) && <p class="sw-meta">{status(e)}</p>}
            {desc(e) && <p>{desc(e)}</p>}
          </div>
        </section>
      ))}
    </div>
  )
}

// 字形规范：标题沿用 Markdown h2/h3，其余只用正文（1rem，条目标题 600）与辅助（--sw-meta-size，灰色）两种。
const css = `
.bases-view-meta { display: none; }
.bases-page { gap: 1rem; }
.bases-view-tabs { margin-top: 1.25rem; }
.bases-view-tabs button { font-family: var(--bodyFont); font-size: var(--sw-meta-size); }

.sw-meta { font-size: var(--sw-meta-size); line-height: 1.5; color: var(--gray); font-weight: 400; margin: 0; }

.sw-post-list ul, .sw-featured, .sw-projects-compact ul { list-style: none; padding: 0; margin: 0; }
.sw-item {
  display: flex; background: none; padding: 0; border-radius: 0; color: inherit; font-weight: 400;
}
.sw-item-title { color: var(--dark); font-weight: 600; transition: color 0.15s ease; }
.sw-item:hover .sw-item-title { color: var(--secondary); }
.sw-post-list .sw-item { align-items: baseline; gap: 1rem; padding: 0.55rem 0; }
.sw-post-list time {
  flex: none; min-width: 3.2em; font-size: var(--sw-meta-size); color: var(--gray);
  font-variant-numeric: tabular-nums;
}
.sw-post-list time.is-full { min-width: 5.8em; }
.sw-post-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
.sw-post-head { display: flex; align-items: baseline; gap: 0.6rem; min-width: 0; }
.sw-post-head .sw-item-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sw-timeline .sw-item { padding: 0.7rem 0; }
.sw-timeline.is-compact .sw-item { padding: 0.3rem 0; }
.sw-timeline.is-compact .sw-item-title { font-weight: 400; }
.sw-more {
  display: inline-block; margin-top: 0.75rem; background: none; padding: 0;
  font-size: var(--sw-meta-size); color: var(--secondary);
}
.sw-more::after { content: " ›"; }

.sw-year-nav { display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; margin-bottom: 1.75rem; }
.sw-year-nav a { background: none; padding: 0; color: var(--secondary); font-weight: 600; }
.sw-year-nav .sw-meta { margin-left: 0.3rem; }
.sw-timeline > section + section { margin-top: 2.5rem; }
.sw-year-group { display: grid; grid-template-columns: 5rem 1fr; gap: 1rem; align-items: start; scroll-margin-top: 1.5rem; }
.sw-year-group > ul { min-width: 0; }
.sw-year-label { margin: 0; padding-top: 0.55rem; line-height: 1.4; }
@media (max-width: 600px) {
  .sw-year-group { grid-template-columns: 1fr; gap: 0; }
}

.sw-featured { display: flex; flex-direction: column; gap: 1.5rem; }
.sw-featured .sw-item { flex-direction: column; }
.sw-featured .sw-item-title { font-family: var(--headerFont); font-size: 1.12rem; font-weight: 700; line-height: 1.4; }
.sw-featured p { margin: 0.3rem 0 0; color: var(--darkgray); }

.sw-cover-grid {
  display: grid; gap: 1.25rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
.sw-cover-card {
  font-weight: 400;
  display: flex; flex-direction: column; background: none; padding: 0; color: inherit;
  border-radius: 12px; overflow: hidden;
  border: 1px solid var(--lightgray);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.sw-cover-card:hover {
  transform: translateY(-3px); border-color: var(--secondary);
  box-shadow: 0 10px 24px -14px rgba(0, 0, 0, 0.45);
}
.sw-cover-frame { position: relative; }
.sw-cover-image {
  position: relative; aspect-ratio: 16 / 9; overflow: hidden;
  background: linear-gradient(135deg, hsl(var(--h1, 210) 45% 32%), hsl(var(--h2, 260) 50% 20%));
}
.sw-cover-image img {
  width: 100%; height: 100%; object-fit: cover; margin: 0; display: block;
  transition: transform 0.35s ease;
}
.sw-cover-card:hover .sw-cover-image img { transform: scale(1.05); }
.sw-cover-fallback {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  padding: 0 1rem; text-align: center; color: rgba(255, 255, 255, 0.92);
  font-family: var(--headerFont); font-size: 1.12rem; font-weight: 700;
}
.sw-cover-chips {
  position: absolute; left: 0.5rem; bottom: 0.5rem; display: flex; gap: 0.3rem; flex-wrap: wrap;
}
.sw-cover-chips span {
  font-size: var(--sw-meta-size); line-height: 1.5; color: #fff;
  background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(4px);
  border-radius: 999px; padding: 0 0.55rem;
}
.sw-cover-body { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.7rem 0.85rem 0.8rem; }
.sw-cover-body strong { color: var(--dark); font-weight: 600; line-height: 1.4; }
.sw-cover-body p {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.sw-cover-grid.compact { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }

.sw-projects-compact ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem 2rem; }
.sw-projects-compact .sw-item { flex-direction: column; gap: 0.1rem; }

.sw-showcase { display: flex; flex-direction: column; gap: 2.5rem; margin-top: 0.5rem; }
.sw-showcase-item {
  display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); gap: 1.5rem; align-items: start;
}
.sw-showcase-media { display: block; background: none; padding: 0; border-radius: 8px; overflow: hidden; }
.sw-showcase-text h2 { margin: 0; line-height: 1.3; }
.sw-showcase-text h2 a { background: none; padding: 0; color: var(--dark); }
.sw-showcase-text h2 a:hover { color: var(--secondary); }
.sw-showcase-text .sw-meta { margin-top: 0.25rem; }
.sw-showcase-text p:not(.sw-meta) { margin: 0.6rem 0 0; }
@media (max-width: 600px) {
  .sw-showcase-item { grid-template-columns: 1fr; gap: 0.85rem; }
}
`

export function registerSiteViews() {
  viewRegistry.register({ id: "post-list", name: "列表", icon: "list", render: PostList, css })
  viewRegistry.register({ id: "cover-grid", name: "卡片", icon: "layout-grid", render: CoverGrid, css })
  viewRegistry.register({ id: "project-showcase", name: "项目", icon: "folder", render: ProjectShowcase, css })
}
