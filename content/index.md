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
    <p class="home-intro">写 Rust 与桌面软件，体验各类游戏，学俄语与日语。<a class="internal" href="./about">关于我 →</a></p>
    <p class="home-social">
      <a href="https://github.com/mcthesw" aria-label="GitHub" title="GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-4.3 1.3-4.3-2.5-6-3m12 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.77 5.07 5.07 0 0 0 18.91 1S17.73.65 15 2.48a13.38 13.38 0 0 0-7 0C5.27.65 4.09 1 4.09 1A5.07 5.07 0 0 0 4 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8 18.13V22"/></svg></a>
      <a href="https://space.bilibili.com/4087637" aria-label="Bilibili" title="Bilibili"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="m7 2 3 5m7-5-3 5M7 12v3m10-3v3m-7 1 2 1 2-1"/></svg></a>
      <a href="mailto:t.sworld@qq.com" aria-label="Email" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg></a>
      <a href="https://t.me/sworld233" aria-label="Telegram" title="Telegram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></svg></a>
      <a href="https://afdian.com/a/Sworld" aria-label="爱发电" title="爱发电"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/></svg></a>
    </p>
  </div>
</section>

## 精选文章

```base
filters:
  and:
    - file.ext == "md"
    - or:
        - note.featured == true
        - note.abbrlink == "phantom-data-yamux"
        - note.abbrlink == "6c2e5cd3"
        - note.abbrlink == "f4b3b128"
        - note.abbrlink == "d70d6661"
views:
  - type: post-list
    name: 精选
    showDescription: true
    sort:
      - property: date
        direction: DESC
```

## 主题脉络

<div class="reading-trails">
  <div class="trail-card">
    <h3>Rust 与系统网络</h3>
    <p>围绕异步运行时接口、零成本类型约束与跨平台构建的探索。</p>
    <ul>
      <li><a class="internal" href="./2026/05/6c2e5cd3">从 SOCKS5 看异步运行时如何塑造上层库接口</a></li>
      <li><a class="internal" href="./2026/06/phantom-data-yamux">向 Yamux 学 PhantomData：当作编译期标签用</a></li>
      <li><a class="internal" href="./2025/03/e57e33c6">在 Win 上编译 Rust 程序到 macOS 和 Linux</a></li>
      <li><a class="internal" href="./2025/03/a7485831">实现 egui 窗体隐藏和重新展示</a></li>
    </ul>
  </div>
  <div class="trail-card">
    <h3>开源维护与客户端实践</h3>
    <p>桌面端应用开发、多语言协作流程与仓库自动化防线。</p>
    <ul>
      <li><a class="internal" href="./2026/06/f4b3b128">开源项目国际化：翻译服务篇</a></li>
      <li><a class="internal" href="./2026/03/d70d6661">给博客加上隐私提交检查</a></li>
      <li><a class="internal" href="./2024/12/7368f4eb">解决 Tauri2 无法拖拽</a></li>
      <li><a class="internal" href="./2024/09/185a27cb">Avalonia 采用 AOT 编译后无法运行解决办法</a></li>
    </ul>
  </div>
</div>

## 正在维护的项目

<div class="home-projects">
  <div class="project-feature">
    <div class="project-feature-head">
      <strong>easy-nats</strong>
      <span class="project-tag">寻找合作者</span>
    </div>
    <p>直观、轻量的 NATS 消息系统桌面客户端，支持连接管理、消息订阅调试与 JetStream 浏览。</p>
    <div class="project-links">
      <a href="https://easy-nats.sworld.club">在线站点</a>
      <a href="https://github.com/mcthesw/easy-nats">GitHub</a>
    </div>
  </div>
  <div class="project-feature">
    <div class="project-feature-head">
      <strong>game-save-manager</strong>
      <span class="project-tag">寻找合作者</span>
    </div>
    <p>跨平台游戏存档备份与同步工具，已接入 Weblate 社区多语言翻译流程。</p>
    <div class="project-links">
      <a href="https://github.com/mcthesw/game-save-manager">GitHub</a>
      <a class="internal" href="./projects">全部项目 →</a>
    </div>
  </div>
</div>

## 近期更新

```base
filters:
  and:
    - file.ext == "md"
    - file.hasProperty("date")
views:
  - type: post-list
    name: 最近
    more: posts
    moreText: 完整时间线
    sort:
      - property: date
        direction: DESC
    limit: 6
```

