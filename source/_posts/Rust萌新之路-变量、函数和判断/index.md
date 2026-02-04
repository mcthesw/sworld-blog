---
title: Rust萌新之路-变量、函数和判断
tags:
  - Rust
  - 学习
  - 语言基础
abbrlink: f1689981
date: 2022-11-17 06:25:34
---
# 我推荐的布局介绍

我推荐使用 Vscode 再安装 Rust-Analyzer 插件进行刷题，记得在开刷之前先执行 `rustlings lsp` 来启用语法提示，下面给大家看看各个布局窗口的作用
![在命令行运行rustlings指令](1.png)
1号区域是终端，我在里面启动了 `rustlings watch` 来检查进度，2号区域是各个题目(所有的题目都在 exercises 文件夹内)，3号区域就是代码编辑框了，这样简简单单就可以开始了

# Intro 和 Variables

Intro 部分其实没什么好看的，主要是教你如何使用 Rustlings ，在终端中提示通过编译后，你把注释中的 `// I AM NOT DONE` 删掉就可以了

Variables 里面的东西也比较简单，主要就是考变量的初始化语法、未初始化不能使用、如何创建可变变量、重新申明变量、常量必须指明类型这些，基本上没有什么问题，就不赘述了。

# Functions 和 If

Functions 内的内容也比较基础，主要考察了函数的创建、参数的定义和传入、返回值的定义方式、通过去掉分号来返回一个值
很轻松就能解决这一块，我也认为这一块不会出现什么问题，也不多讲了。

If 的第一题体现了我很喜欢的一点，就是 Rust 中的 if 语句是有返回值的，同样可以用去掉分号来表示返回，整体也可以作为函数的返回值，因此这题我的答案是这样的

```Rust
pub fn bigger(a: i32, b: i32) -> i32 {
    if a>b {
        a
    }else {
        b
    }
}
```

第二题也类似，答案如下

```Rust
pub fn foo_if_fizz(fizzish: &str) -> &str {
    if fizzish == "fizz" {
        "foo"
    } else if fizzish == "fuzz" {
        "bar"
    }else {
        "baz"
    }
}
```

不过这里其实有一个比较有意思的地方，返回值是一个`&str`，新手可能会忘记为什么这里不需要标注生命周期，请让我来解释一下，这是因为这个函数满足了**生命周期省略规则**，我认为这里满足的是“如果只有一个输入生命周期参数，那么它被赋予所有输出生命周期参数”，所以我觉得函数签名应该等价于 `pub fn foo_if_fizz<'a>(fizzish: &'a str) -> &'a str` ，不过考虑到字符串字面量的生命周期是 `'static` ，我认为这里也可以是 `pub fn foo_if_fizz(fizzish: &str) -> &'static str`，具体是什么样希望能有大神指出。

# Quiz1

终于到了第一个小测验了，这也会是第一篇的最后一题，这是关于上面的 Variables、Functions 和 If 的测验。
对于写完前面的你应该算是简简单单

```Rust
fn calculate_price_of_apples(num:i32)->i32{
    if num>40{
        num
    }else{
        num*2
    }
}
```

本章到此就结束了

# 有用的其他参考

- [我在 v4.4.0 版本的解答仓库](https://github.com/mcthesw/my-rustlings-solution)
- [rustlings-idiomatic-solution](https://github.com/alexxroche/rustlings-idiomatic-solutions)
- [Rust 文档网 - Rust 官方文档中文教程 (rustwiki.org)](https://rustwiki.org/)
- [本文的首发地址(我的博客)](https://blog.sworld.club)
