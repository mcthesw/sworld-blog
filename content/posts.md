---
title: 笔记
comments: false
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
    name: 时间线
    sort:
      - property: date
        direction: DESC
```
