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
    - note.status != "参与贡献"
views:
  - type: project-showcase
    name: 项目
    sort:
      - property: date
        direction: ASC
```

## 参与过

```base
filters:
  and:
    - file.ext == "md"
    - note.type == "项目"
    - note.status == "参与贡献"
views:
  - type: project-showcase
    name: 参与过
    compact: true
    sort:
      - property: date
        direction: ASC
```
