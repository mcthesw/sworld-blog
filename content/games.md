---
title: 游戏
comments: false
enableToc: false
cssclasses:
  - list-page
---

<a class="internal games-taste" href="games/taste">
  <strong>我的偏好</strong>
  <span>我想要尽可能多地体验各种类型的游戏！</span>
</a>

```base
filters:
  and:
    - file.ext == "md"
    - note.type == "游戏"
views:
  - type: cover-grid
    name: 全部
    sort:
      - property: date
        direction: DESC
  - type: cover-grid
    name: 游玩记录
    filters:
      and:
        - note.kind != "Demo"
    sort:
      - property: date
        direction: DESC
  - type: cover-grid
    name: Demo
    filters:
      and:
        - note.kind == "Demo"
    sort:
      - property: date
        direction: DESC
```
