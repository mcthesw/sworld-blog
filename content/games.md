---
title: 游戏
comments: false
enableToc: false
cssclasses:
  - list-page
---

常玩的作品类型与待玩清单见 [关于我的游戏口味](./about#游戏口味)。

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

