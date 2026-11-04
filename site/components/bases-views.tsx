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
  const kind = prop(e, "kind") ?? prop(e, "type")
  if (kind) out.push(String(kind))
  if (prop(e, "status")) out.push(String(prop(e, "status")))
  if (prop(e, "score")) out.push(`★ ${prop(e, "score")}`)
  else if (prop(e, "expect")) out.push(`期待 ${prop(e, "expect")}`)
  return out
}

const PostList = ({ entries, slug, view }: ViewRendererProps) => {
  const opts = view as Record<string, unknown>
  const more = opts.more as string | undefined
  const grouped = opts.grouped === true
  const showDesc = opts.showDescription === true

  const renderItem = (e: Entry, fullDate: boolean) => {
    const desc = showDesc ? (prop(e, "description") as string | undefined) : undefined
    const isGame = prop(e, "type") === "游戏"
    const badge = isGame ? String(prop(e, "kind") ?? "游戏") : undefined
    return (
      <li class={desc ? "has-desc" : undefined}>
        <time>{day(e, fullDate)}</time>
        <div class="sw-post-content">
          <div class="sw-post-head">
            <a class="internal" href={resolveRelative(slug as FullSlug, e.slug as FullSlug)}>
              {e.title}
            </a>
            {badge && <span class="sw-post-badge">{badge}</span>}
          </div>
          {desc && <p class="sw-post-desc">{desc}</p>}
        </div>
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
    return (
      <div class="sw-post-list sw-timeline">
        {groups.map((g) => (
          <section class="sw-year-group">
            <div class="sw-year-header">
              <span class="sw-year-label">{g.year}</span>
              <span class="sw-year-count">{g.list.length}</span>
            </div>
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
        const cover = prop(e, "cover") as string | undefined
        const h = hue(e.title)
        const desc = prop(e, "description") as string | undefined
        return (
          <a class="internal sw-cover-card" href={resolveRelative(slug as FullSlug, e.slug as FullSlug)}>
            <div
              class="sw-cover-image"
              style={cover ? undefined : `--h1:${h};--h2:${(h + 50) % 360}`}
            >
              {cover ? (
                <img src={assetUrl(slug, cover)} alt="" loading="lazy" />
              ) : (
                <span class="sw-cover-fallback">{e.title}</span>
              )}
              <div class="sw-cover-chips">
                {chips(e).map((c) => (
                  <span>{c}</span>
                ))}
              </div>
            </div>
            <div class="sw-cover-body">
              <strong>{e.title}</strong>
              {!compact && desc && <p>{desc}</p>}
              <time>{day(e)}</time>
            </div>
          </a>
        )
      })}
    </div>
  )
}

const css = `
.bases-view-meta { display: none; }

.sw-post-list ul { list-style: none; padding: 0; margin: 0; }
.sw-post-list li {
  display: flex; align-items: baseline; gap: 0.9rem;
  padding: 0.45rem 0; border-bottom: 1px dashed var(--lightgray);
}
.sw-post-list li:last-child { border-bottom: none; }
.sw-post-list time {
  flex: none; font-family: var(--codeFont); font-size: 0.8rem; color: var(--gray);
  font-variant-numeric: tabular-nums;
}
.sw-post-content {
  flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem;
}
.sw-post-head {
  display: flex; align-items: baseline; gap: 0.5rem; min-width: 0;
}
.sw-post-list li a {
  min-width: 0; background: none; padding: 0; color: var(--dark); font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sw-post-list li a:hover { color: var(--secondary); }
.sw-post-badge {
  flex: none; font-size: 0.7rem; line-height: 1.4; color: var(--gray);
}
.sw-post-desc {
  margin: 0; font-size: 0.83rem; line-height: 1.5; color: var(--gray);
}
.sw-more {
  display: inline-block; margin-top: 0.6rem; background: none; padding: 0;
  font-size: 0.85rem; color: var(--secondary);
}
.sw-more::after { content: " ›"; }

.sw-timeline {
  display: flex; flex-direction: column; gap: 1.75rem;
}
.sw-year-group {
  display: grid; grid-template-columns: 76px 1fr; gap: 1.25rem; align-items: start;
}
.sw-year-header {
  display: flex; align-items: baseline; gap: 0.35rem; padding-top: 0.45rem;
  position: sticky; top: 1.5rem;
}
.sw-year-label {
  font-family: var(--codeFont); font-size: 1.05rem; font-weight: 600; color: var(--dark);
}
.sw-year-count {
  font-family: var(--codeFont); font-size: 0.72rem; color: var(--gray);
}
@media (max-width: 600px) {
  .sw-year-group { grid-template-columns: 1fr; gap: 0.25rem; }
  .sw-year-header { position: static; }
}

.sw-cover-grid {
  display: grid; gap: 1rem;
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
  font-family: var(--headerFont); font-size: 1.35rem; font-weight: 700; letter-spacing: 0.02em;
}
.sw-cover-chips {
  position: absolute; left: 0.5rem; bottom: 0.5rem; display: flex; gap: 0.3rem; flex-wrap: wrap;
}
.sw-cover-chips span {
  font-size: 0.7rem; line-height: 1.5; color: #fff;
  background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(4px);
  border-radius: 999px; padding: 0 0.5rem;
}
.sw-cover-body { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.65rem 0.8rem 0.75rem; }
.sw-cover-body strong { color: var(--dark); font-size: 0.95rem; line-height: 1.35; }
.sw-cover-body p {
  margin: 0; font-size: 0.8rem; line-height: 1.5; color: var(--gray);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.sw-cover-body time { font-size: 0.72rem; color: var(--gray); font-family: var(--codeFont); }
.sw-cover-grid.compact { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
`

export function registerSiteViews() {
  viewRegistry.register({ id: "post-list", name: "列表", icon: "list", render: PostList, css })
  viewRegistry.register({ id: "cover-grid", name: "卡片", icon: "layout-grid", render: CoverGrid, css })
}
