---
title: "解决GithubCopilot补全冲突"
date: "2025-10-18T15:38:43.000Z"
updated: "2026-11-08T19:12:40+08:00"
type: "技术"
description: "检查并调试快捷键冲突可解。"
abbrlink: "ca8f2d0d"
source: "siyuan"
siyuan-id: "20261103013249-wjlym9d"
---

相关：[GitHub Copilot](../../not-public)、[VSCode](../../not-public)

近期在使用Github Copilot时，发现在面对 NES(Next Edit Suggestions) 补全时，按下Tab键经常会出现空格，而非跳转到目标位置，经过一番排查，发现这是因为VSCode的Tab键绑定冲突导致的，本文记录下解决方法。

## 错误表现

在使用Github Copilot进行代码补全时，按下Tab键并没有跳转到补全建议的位置，而是插入了空格，导致无法顺利接受补全建议，如下图：

![产生提示](../../assets/ca8f2d0d/example1-20261103013249-aedex6v-4c51ad192b8c.webp)
![出现空格](../../assets/ca8f2d0d/example2-20261103013249-qse6kq0-88c300b33dd3.webp)

## 调试思路

首先我们启动VSCode的键盘快捷键调试功能，按下`Ctrl + Shift + P`搜索`shortcut troubleshooting`，打开快捷键调试面板。

![打开快捷键调试面板](../../assets/ca8f2d0d/check1-20261103013249-f93athe-7f36fce578d2.webp)

发现类似下方的信息：

![调试信息](../../assets/ca8f2d0d/check2-20261103013249-ds5zcik-d0e1684309fc.webp)

```log
2025-10-18 15:58:06.749 [info] [窗口] [KeybindingService]: / Received  keydown event - modifiers: [], code: Tab, keyCode: 9, key: Tab
2025-10-18 15:58:06.749 [info] [窗口] [KeybindingService]: | Converted keydown event - modifiers: [], code: Tab, keyCode: 2 ('Tab')
2025-10-18 15:58:06.749 [info] [窗口] [KeybindingService]: | Resolving Tab
2025-10-18 15:58:06.749 [info] [窗口] [KeybindingService]: \ From 14 keybinding entries, matched tabout, when: editorTextFocus && !editorHasMultipleSelections && !inSnippetMode && !inlineSuggestionVisible && !suggestWidgetVisible, source: user extension albert.TabOut.
2025-10-18 15:58:06.749 [info] [窗口] [KeybindingService]: + Invoking command tabout.
```

显然，Tab键被`TabOut`插件占用了。

## 解决方法

此时我们可以使用`Ctrl + K Ctrl + S`打开键盘快捷键设置，搜索`"Tab"`，找到`TabOut: Tab Out`，点击右侧的垃圾桶图标删除该快捷键绑定。

不过也有更好的办法，就是为 `TabOut`插件设置一个条件，使其在Github Copilot补全建议出现时不生效。我们可以将其`when`条件末尾追加`!inlineEditIsVisible`条件，最终得到该条件`editorTextFocus && !editorHasMultipleSelections && !inSnippetMode && !inlineSuggestionVisible && !suggestWidgetVisible && !inlineEditIsVisible` （编辑后按回车保存）。

现在，就能够正常补全了：

![出现补全，可以使用](../../assets/ca8f2d0d/example3-20261103013249-4x0ghid-7978601cd671.webp)

![日志正常](../../assets/ca8f2d0d/example4-20261103013249-gd5dpjz-1950f0490ee8.webp)

结束后重新按下`Ctrl + Shift + P`搜索`shortcut troubleshooting`以关闭快捷键调试面板。
