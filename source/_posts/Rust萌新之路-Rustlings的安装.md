---
title: Rust萌新之路-Rustlings的安装
tags:
  - Rust
  - 学习
  - 语言基础
abbrlink: 504048fe
date: 2022-11-16 02:19:23
---
# 专栏简介

我学习 Rust 已经有一小段时间了，[Rustling](https://github.com/rust-lang/rustlings) 这个项目我认为是新手学完Rust基本语法，或者在看完 [The Book](https://doc.rust-lang.org/stable/book/) ([中文版](https://rustwiki.org/zh-CN/book/)) 后，一个很适合的练习题组，这个项目提供了75道 Rust 语言的小题目，提供了方方面面的考验，对于绝大多数题目也都有足够的提示，但是鉴于我没有找到使用中文介绍这些题目的文章，便打算自己开一篇介绍和讲解，本人有的实现可能不够好，或者讲解有谬误，希望各位斧正。

# 安装 Rustlings

既然你已经开始想要写 Rust 练习题，那么你应该已经安装过Rust了，就不做多的介绍了，如果你还没有安装，请参考[官方的这个页面](https://www.rust-lang.org/tools/install)，可以先安装Visual Studio最新版后，勾选适用于桌面的C++开发，然后安装 Rustup 等工具。

接下来，打开 [Rustlings 官方仓库](https://github.com/rust-lang/rustlings) ，里面介绍了安装的方式，在 Mac OS 或者 Linux 操作系统上，安装 Rustlings 是很简单的

```bash
curl -L https://raw.githubusercontent.com/rust-lang/rustlings/main/install.sh | bash
```

使用这个命令就可以把它安装到你的电脑上，之后就可以使用 Rustlings 指令了。至于 Windows 下稍微复杂一点，你需要先激活 Powershell 的脚本运行权限，然后就可以运行安装指令了

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Start-BitsTransfer -Source https://raw.githubusercontent.com/rust-lang/rustlings/main/install.ps1 -Destination $env:TMP/install_rustlings.ps1; Unblock-File $env:TMP/install_rustlings.ps1; Invoke-Expression $env:TMP/install_rustlings.ps1
```

如果你不喜欢上面的安装方式，也可以手动安装，也没多麻烦，先下载这个 git 仓库，然后在里面运行 cargo install --path . 就行了，我使用 git clone 进行下载，指令可以参考如下(可以把5.2.1替换成最新版本)

```bash
git clone -b 5.2.1 --depth 1 https://github.com/rust-lang/rustlings
cd rustlings
cargo install --force --path .
```

这样，你就完成了 rustlings 的安装，尝试在命令行运行 rustlings ，它会给你反应

![在命令行运行 rustlings 指令](1.webp)

# 基础使用

其实需要做的操作很少，你如果只是做题的话在 rustlings 目录下使用 rustlings watch 就够了，以下内容主要是我对官方操作解释的翻译（注意，你的指令一定要在 rustlings 目录下运行，不要到上级或者子目录）

你要做的所有题目都在 rustlings/exercises/ 文件夹里，当你想以官方推荐的顺序来做的话，运行

```bash
rustlings watch
```

它会持续按顺序检查题目，并且给出错误（每当你编辑过之后），你需要修好错误或者使代码通过编译，它就会进入下一个题目，直到所有题目完成，或者你关闭了它，如果你只想运行一次而非持续运行，你可以允许下一条指令

```bash
rustlings verify
```

如果你想手动指定它检查的题目，你可以用 run 指令

```bash
rustlings run 测试名
```

或者使用 run next 来检查下一个的

```bash
rustlings run next
```

当你遇到了不会的题目，需要一定帮助时，可以使用 hint 指令，它的用法和 run 差不多，可以指定名字或者使用 next 来查找下一个

```bash
rustlings hint myExercise1
rustlings hint next
```

list 指令可以用于检查你的进度

```bash
rustlings list
```

例如我的输出就是都做完了

![我运行 rustlings list 的结果](2.png)

另外有一个非常重要的，就是你会发现你在编辑时无法使用 Rust-Analyzer ，这怎么行？启用的方法官方仓库也有给出，就是运行

```bash
rustlings lsp
```

另外，卸载的方法如下：

1. 先删除 rustlings 所在的文件夹
2. 运行 `cargo uninstall rustlings`

# 有用的其他参考

- [我在 v4.4.0 版本的解答仓库](https://github.com/mcthesw/my-rustlings-solution)
- [rustlings-idiomatic-solution](https://github.com/alexxroche/rustlings-idiomatic-solutions)
- [Rust 文档网 - Rust 官方文档中文教程 (rustwiki.org)](https://rustwiki.org/)
