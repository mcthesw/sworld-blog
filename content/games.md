---
title: 游戏
comments: false
enableToc: false
cssclasses:
  - list-page
---

<div class="games-taste">

<a class="internal" href="games/taste">我的游戏偏好</a>

![[games/taste#最爱的几款游戏]]

</div>

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
        - note.status != "Demo"
    sort:
      - property: date
        direction: DESC
  - type: cover-grid
    name: Demo
    filters:
      and:
        - note.status == "Demo"
    sort:
      - property: date
        direction: DESC
```
