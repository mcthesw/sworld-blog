---
title: Sworld's World
comments: false
enableToc: false
---

<section class="home-hero">
  <img class="home-avatar" src="https://avatars.githubusercontent.com/u/61224072?v=4" alt="Sworld" />
  <div class="home-hero-text">
    <h1>Sworld</h1>
    <p class="home-quote">The only way to do great work is to love what you do.</p>
    <p class="home-social">
      <a href="https://github.com/mcthesw" aria-label="GitHub" title="GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-4.3 1.3-4.3-2.5-6-3m12 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.77 5.07 5.07 0 0 0 18.91 1S17.73.65 15 2.48a13.38 13.38 0 0 0-7 0C5.27.65 4.09 1 4.09 1A5.07 5.07 0 0 0 4 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8 18.13V22"/></svg></a>
      <a href="https://space.bilibili.com/4087637" aria-label="Bilibili" title="Bilibili"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="m7 2 3 5m7-5-3 5M7 12v3m10-3v3m-7 1 2 1 2-1"/></svg></a>
      <a href="mailto:t.sworld@qq.com" aria-label="Email" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg></a>
      <a href="https://t.me/sworld233" aria-label="Telegram" title="Telegram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></svg></a>
      <a href="https://afdian.com/a/Sworld" aria-label="爱发电" title="爱发电"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/></svg></a>
    </p>
  </div>
</section>

## 精选

```base
filters:
  and:
    - file.ext == "md"
    - note.featured == true
views:
  - type: post-list
    name: 精选
    featured: true
    sort:
      - property: date
        direction: DESC
```

## 项目

```base
filters:
  and:
    - file.ext == "md"
    - note.type == "项目"
views:
  - type: project-showcase
    name: 项目
    compact: true
    more: projects
    sort:
      - property: date
        direction: ASC
```

## 最近的笔记

```base
filters:
  and:
    - file.ext == "md"
    - file.hasProperty("date")
    - note.type != "随记"
    - note.type != "项目"
    - note.type != "页面"
    - note.featured != true
views:
  - type: post-list
    name: 最近
    more: posts
    sort:
      - property: date
        direction: DESC
    limit: 8
```

## 推荐

- [Z.A.T.O.](https://store.steampowered.com/app/4122860)：I love the world and everything in it
- [蘑菇的拟态日常](https://comiccune.jp/series/simejisimulation/)
- [WezTerm](https://github.com/wez/wezterm)、[Anki](https://apps.ankiweb.net/)
