---
title: 项目
comments: false
enableToc: false
cssclasses:
  - list-page
---

```base
filters:
  and:
    - file.ext == "md"
    - note.type == "项目"
views:
  - type: project-showcase
    name: 项目
    sort:
      - property: date
        direction: ASC
```
