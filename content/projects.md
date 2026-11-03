---
title: 项目
comments: false
enableToc: false
cssclasses:
  - list-page
---

这里整理了我正在维护或参与的开源项目。如果你对其中某个方向感兴趣，欢迎提交 Issue、PR 或直接联系我交流。

<div class="projects-showcase">
  <article class="project-card is-primary">
    <div class="project-card-header">
      <div>
        <h2>easy-nats</h2>
        <p class="project-subtitle">轻量、直观的 NATS 消息系统桌面客户端</p>
      </div>
      <span class="project-tag">寻找合作者</span>
    </div>
    <p class="project-desc">
      面向日常开发与调试场景的 NATS 桌面工具，提供多服务连接管理、主题订阅与消息发布调试、JetStream 流与键值存储浏览能力，致力于降低消息系统的本地观测门槛。
    </p>
    <div class="project-links">
      <a href="https://easy-nats.sworld.club">在线站点与文档</a>
      <a href="https://github.com/mcthesw/easy-nats">GitHub 仓库</a>
    </div>
  </article>

  <article class="project-card is-primary">
    <div class="project-card-header">
      <div>
        <h2>game-save-manager</h2>
        <p class="project-subtitle">跨平台游戏存档备份与管理客户端</p>
      </div>
      <span class="project-tag">寻找合作者</span>
    </div>
    <p class="project-desc">
      为 PC 玩家设计的游戏存档管理工具，支持自动识别存档路径、多版本快照与云端同步。项目已接入 Weblate 社区翻译工作流，相关实践记录见 <a class="internal" href="./2026/06/f4b3b128">开源项目国际化：翻译服务篇</a>。
    </p>
    <div class="project-links">
      <a href="https://github.com/mcthesw/game-save-manager">GitHub 仓库</a>
      <a class="internal" href="./2026/06/f4b3b128">国际化实践笔记</a>
    </div>
  </article>
</div>

## 小工具与周边

<div class="projects-grid">
  <article class="project-card">
    <div class="project-card-header">
      <h3>tractor-beam</h3>
    </div>
    <p class="project-desc">《以撒的结合》联机辅助小工具，解决联机过程中的配置与连接痛点。</p>
    <div class="project-links">
      <a href="https://github.com/mcthesw/TractorBeam">GitHub 仓库</a>
    </div>
  </article>

  <article class="project-card">
    <div class="project-card-header">
      <h3>game-shelf-card</h3>
    </div>
    <p class="project-desc">为 GitHub 个人主页生成可定制的游戏展柜 SVG 卡片。</p>
    <div class="project-links">
      <a href="https://github.com/mcthesw/game-shelf-card">GitHub 仓库</a>
    </div>
  </article>

  <article class="project-card">
    <div class="project-card-header">
      <h3>kelivo</h3>
      <span class="project-tag is-muted">参与贡献</span>
    </div>
    <p class="project-desc">参与社区功能开发与问题修复的开源项目。</p>
    <div class="project-links">
      <a href="https://github.com/chevey339/kelivo">GitHub 仓库</a>
    </div>
  </article>
</div>

## 相关技术记录

- [从 SOCKS5 看异步运行时如何塑造上层库接口](./2026/05/6c2e5cd3)
- [向 Yamux 学 PhantomData：当作编译期标签用](./2026/06/phantom-data-yamux)
- [实现 egui 窗体隐藏和重新展示](./2025/03/a7485831)
- [解决 Tauri2 无法拖拽](./2024/12/7368f4eb)
- [Avalonia 采用 AOT 编译后无法运行解决办法](./2024/09/185a27cb)
