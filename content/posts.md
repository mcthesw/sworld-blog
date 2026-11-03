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
views:
  - type: post-list
    name: 全部
    grouped: true
    showDescription: true
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
    grouped: false
    showDescription: true
    filters:
      or:
        - note.featured == true
        - note.abbrlink == "phantom-data-yamux"
        - note.abbrlink == "6c2e5cd3"
        - note.abbrlink == "f4b3b128"
        - note.abbrlink == "d70d6661"
    sort:
      - property: date
        direction: DESC
```

