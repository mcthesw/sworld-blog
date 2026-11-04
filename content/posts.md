---
title: 时间线
comments: false
enableToc: false
cssclasses:
  - list-page
---

```base
filters:
  and:
    - file.ext == "md"
    - file.hasProperty("date")
    - note.type != "随记"
    - note.type != "项目"
    - note.type != "页面"
views:
  - type: post-list
    name: 全部
    grouped: true
    sort:
      - property: date
        direction: DESC
  - type: post-list
    name: 文章
    grouped: true
    showDescription: true
    filters:
      and:
        - note.type != "游戏"
    sort:
      - property: date
        direction: DESC
  - type: post-list
    name: 精选
    featured: true
    filters:
      and:
        - note.featured == true
    sort:
      - property: date
        direction: DESC
```
