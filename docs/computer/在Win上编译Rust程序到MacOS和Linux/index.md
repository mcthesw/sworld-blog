---
title: 在Win上编译Rust程序到MacOS和Linux
tags:
  - Rust
  - 交叉编译
abbrlink: e57e33c6
date: 2025-03-22T16:18:03.000Z
createTime: 2025/03/22 16:18:03
permalink: /2025/03/e57e33c6/
excerpt: cross-rs 在 Windows 上交叉编译 Rust 到 macOS 和 Linux 的基础配置与使用方式。
---

我之前写过一篇文章介绍如何在Windows下编译适用于Linux的Rust程序，不过Rust原生的配置方法并不算简单，今天我想介绍一个更简单的方法来编译Rust程序到MacOS和Linux。同理，也可以在这些平台上编译到Windows。

## Cross-rs

[Cross-rs](https://github.com/cross-rs/cross)是一个Rust的交叉编译工具，在依赖不复杂的情况下，几乎能够一条指令就将Rust程序编译到其他平台。它的原理是使用Docker来运行交叉编译的工具链，因此需要机子上有Docker或Podman。*这个库也支持测试，这不是本文章关注的内容，因此只在这提一下。*

### 安装

值得注意的是，由于这个项目依赖Docker，所以在编译时需要保持网络畅通，Docker Hub的镜像下载速度可能会很慢，建议使用你能快速访问的镜像源。

在确保 Rust 工具链、Docker 或 Podman 已经安装的情况下，使用以下命令安装 cross：

```bash
cargo install cross --git https://github.com/cross-rs/cross
```

### 基本用法

对于简单的项目，安装完成后就可以直接使用 cross 来编译了：

```bash
# 编译到目标架构是x86_64的Linux
cross build --target x86_64-unknown-linux-gnu --release
# 编译到目标架构是aarch64的Linux
cross build --target aarch64-unknown-linux-gnu --release
```

这里以我以前练手写的一个[Socks5代理](https://github.com/mcthesw/Socks5-TCP-Demo)软件为例，编译结果如下：

```bash
cross build --target x86_64-unknown-linux-gnu --release

# info: syncing channel updates for 'stable-x86_64-unknown-linux-gnu'
# info: latest update on 2025-03-18, rust version 1.85.1 (4eb161250 2025-03-15)
# info: downloading component 'cargo'
# ......
# info: checking for self-update
# info: downloading component 'rust-src'
# info: installing component 'rust-src'

# Unable to find image 'ghcr.io/cross-rs/x86_64-unknown-linux-gnu:main' locally
# main: Pulling from cross-rs/x86_64-unknown-linux-gnu
# d9802f032d67: Pull complete
# ......
# b4f2b8f6bece: Pull complete
# Digest: sha256:e01aa4c146da3834f49ead052f7f9b9cff95e3dd576f909c87cea473bba84e1b
# Status: Downloaded newer image for ghcr.io/cross-rs/x86_64-unknown-linux-gnu:main

#    Compiling libc v0.2.159
# ......
#    Compiling tokio-byteorder v0.3.0
#    Compiling socks5_tcp v0.1.0 (/mnt/d/socks5_tcp)
#     Finished `release` profile [optimized] target(s) in 58.03s

```

可见，基本上分为以下几个阶段：

1. 安装目标平台的工具链
2. 下载用于编译的Docker镜像
3. 编译程序

然后我们就得到了一个在Linux上运行的可执行文件，位于`target/x86_64-unknown-linux-gnu/release/socks5_tcp`。然而，在面对复杂的项目时，可能会需要处理外部依赖；而编译到MacOS或MSVC目标时，需要处理一些额外的配置，请看下方章节。

## 处理外部依赖

为了对编译过程做一些定制，我们需要在项目根目录下创建一个`Cross.toml`文件，内容如下：

```toml
# 此处格式为 `target.<target-triple>`，可以存在多个不同目标的配置
[target.aarch64-unknown-linux-gnu]
# pre-build 可以在编译前执行一些命令，常用于安装依赖
pre-build = [
    "apt-get update",
    "apt-get install -y libssl-dev",
]
# 也可以用 image 来指定一个Docker镜像
image = "test-image"
# 指定一些环境变量
env.aaa = "bbb"
```

基本上配置方法就是如上，如果需要进一步定制，请参考[官方文档](https://github.com/cross-rs/cross/blob/main/docs/config_file.md)。

## 编译到MacOS

由于许可原因，`cross-rs`团队无法为我们提供预编译好的镜像，也不被允许分发Apple的SDK，所以我们需要自己以合法方式获取到SDK，进而编译一个镜像。下方我以`aarch64-apple-darwin`为例，其他平台类似。

### 编译镜像

我们需要克隆`cross-rs`的代码，并更新子模块，完成配置后构建镜像：

```bash
# Setup cross toolchains
git clone https://github.com/cross-rs/cross
cd cross
git submodule update --init --remote
cargo xtask configure-crosstool

# Build docker images
cargo build-docker-image aarch64-apple-darwin-cross --build-arg 'MACOS_SDK_URL=https://github.com/joseluisq/macosx-sdks/releases/download/12.3/MacOSX12.3.sdk.tar.xz' --tag local

# Compile our application
cross build --target aarch64-apple-darwin --release
```

构建对SDK版本要求如下：

- i686-apple-darwin: SDK <= 10.13
- x86_64-apple-darwin: SDK <= 13.0 or SDK <= 12.4
- aarch64-apple-darwin: SDK >= 10.16 and (SDK <= 13.0 or SDK <= 12.4)

### 配置 `Cross.tomml`

构建完毕后，就很简单了，我们只需要在项目根目录下创建一个`Cross.toml`文件，指定对应目标使用我们的本地镜像，内容如下：

```toml
# Reference: https://github.com/cross-rs/cross-toolchains
[target.aarch64-apple-darwin]
image = "ghcr.io/cross-rs/aarch64-apple-darwin-cross:local"
```

后续的编译就和Linux一样了，不再赘述。

## 编译到Windows

MSVC或许是Windows下最优的目标，然而为了方便起见，我还是选择了GNU工具链。我们可以使用`x86_64-pc-windows-gnu`或`i686-pc-windows-gnu`作为目标，编译方法和Linux类似：

```bash
cross build --target x86_64-pc-windows-gnu --release
```

这样我们就能够在Linux或MacOS上编译出Windows下的可执行文件了，不需要配置MSVC。如果你非常想要MSVC的编译结果，请自行阅读[官方仓库](https://github.com/cross-rs/cross-toolchains)的README和Issue吧。
