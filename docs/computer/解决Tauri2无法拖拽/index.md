---
title: 解决Tauri2无法拖拽
tags:
  - Rust
  - Tauri
abbrlink: 7368f4eb
date: 2024-12-29T21:07:50.000Z
createTime: 2024/12/29 21:07:50
permalink: /2024/12/7368f4eb/
excerpt: 关闭窗口 dragDropEnabled 可恢复组件自身拖拽。
---

近期将我的[游戏存档管理器](https://github.com/mcthesw/game-save-manager)迁移到Tauri2出现点问题，想起来以前V1的时候也遇到过这个问题，故记录下来。

具体问题就是在前端一个可拖拽组件没有办法被拖动，处理方式很简单，直接修改`src-tauri/tauri.conf.json`文件，将`dragDropEnabled`设为`false`，作为参考，请看：

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "game-save-manager",
  "identifier": "com.game-save-manager",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "pnpm web:dev",
    "beforeBuildCommand": "pnpm web:generate"
  },
  "app": {
    "windows": [
      {
        "title": "Game Save Manager",
        "width": 1280,
        "height": 720,
        "resizable": true,
        "fullscreen": false,
        "dragDropEnabled": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}

```
