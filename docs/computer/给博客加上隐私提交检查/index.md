---
title: 给博客加上隐私提交检查
tags:
  - 计算机
abbrlink: d70d6661
createTime: 2026/03/16 21:57:27
permalink: /2026/03/d70d6661/
excerpt: 用一个 pre-commit 脚本拦截密钥、非公开邮箱和带 GPS 的图片，避免隐私数据进入 Git 历史。
---

前段时间审查博客仓库时发现，几张随手拍的照片里带着精确 GPS 坐标，直接暴露了拍摄地点。虽然文章本身没问题，但这些元数据一旦进了 Git 历史就很难彻底清除。于是我给仓库加了一套提交前检查，顺便记录一下做法。

<!-- more -->

## 问题

博客里经常会贴截图和照片。手机拍的 JPEG 默认带 EXIF 信息，其中就包括 GPS 坐标。除此之外，还有一些常见的隐私风险：

- 不小心把 API Key 或 token 写进配置示例
- 用了私人邮箱而不是公开联系邮箱
- 代码片段里残留了本机用户名路径，比如 `C:\Users\你的名字\...` <!-- privacy-ignore -->
- 提交了 `.env`、`.pem` 之类本不该入库的文件

这些东西靠人工注意太容易漏了，不如让 Git 在提交时自动拦。

## 方案

我用 `simple-git-hooks` 在 `pre-commit` 阶段调用一个自写的 Node 脚本，只扫描暂存区的文件。

检查项包括：

- **密钥与凭据**：GitHub token、OpenAI key、AWS Access Key、私钥块、JWT、URL 里嵌的密码等
- **邮箱**：默认只放行白名单里的公开邮箱，其他一律拦截
- **图片地理信息**：用 `exifr` 读取 JPEG/PNG/WebP/HEIC 等格式的 GPS 元数据
- **本机路径**：检测 `C:\Users\xxx`、`/Users/xxx`、`/home/xxx` 中的真实用户名 <!-- privacy-ignore -->
- **高风险文件**：`.pem`、`.key`、`.env`、`.kdbx` 等直接阻止提交

## 使用

安装依赖后 hook 会自动注册：

```bash
pnpm install
```

之后每次 `git commit` 都会自动执行检查。如果有问题会打印具体文件和行号，提交会被中止。

手动跑全仓审查：

```bash
pnpm privacy:audit
```

## 配置

根目录的 `privacy-guard.config.json` 控制所有行为，结构很直观：

```json
{
  "allowedEmails": ["你的公开邮箱"],
  "allowedEmailDomains": ["users.noreply.github.com"],
  "ignoredPathPrefixes": [".local/", "node_modules/"],
  "blockedFileExtensions": [".pem", ".key", ".env"],
  "blockedFileNames": ["id_rsa", ".env.local"]
}
```

需要放行某个邮箱或域名，直接加到对应数组里就行。

如果某一行是示例或文档，不想被检查拦住，可以在行尾加 `<!-- privacy-ignore -->` (HTML) 或 `// privacy-ignore` (JS/TS) 注释，该行会被跳过。

## 已有图片怎么办

如果仓库里已经有带 GPS 的图片，可以用 `sharp` 重写一遍去掉元数据：

```js
import sharp from 'sharp'
await sharp('photo.jpeg').rotate().jpeg({ quality: 95 }).toFile('photo.tmp')
// 然后用 photo.tmp 替换原文件
```

不过这只是改了当前版本。如果这些图片在 Git 历史里已经存在，还需要用 `git filter-repo` 之类的工具重写历史才能彻底清除。

## 小结

比起事后在 Git 历史里挖坟，提前防一下省心得多。
