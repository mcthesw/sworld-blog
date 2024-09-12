---
title: Scoop意外卸载的处理办法
date: 2024-09-12 11:15:19
tags:
  - 错误解决
  - Scoop
---

这几天发现电脑上的[Scoop](https://scoop.sh/)莫名其妙消失了，我觉得可能是UniGetUI的问题，总之我的Scoop被卸载了，使用Scoop安装的软件的环境变量也失效了，这导致我写代码的相关环境无法使用。
在重新安装Scoop后，环境变量没有恢复，而我发现路径`C:\Users\用户名\scoop`没有丢失，那么说明软件文件和持久化数据应该没有丢失，寻找一些资料后，我在[一篇Github Issue](https://github.com/ScoopInstaller/Scoop/issues/4241)中找到了解决办法，如果你遇到了相同的问题，可以尝试按照以下步骤解决：

```pwsh
cd C:\Users\用户名\scoop\apps
scoop reset *
```

我在重新安装Scoop并且进行了该操作后，成功恢复了大多数软件对应的环境，除了一些我已经打开的一些软件没有恢复，不过后面也可以手动`scoop reset 软件名`来单独进行恢复
