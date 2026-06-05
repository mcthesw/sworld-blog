---
title: 向 Yamux 学 PhantomData：当作编译期标签用
tags:
  - 计算机
  - Rust
  - 协议解析
abbrlink: phantom-data-yamux
createTime: 2026/06/06 14:42:00
permalink: /2026/06/phantom-data-yamux/
excerpt: 从 rust-yamux 的源码出发，看 PhantomData 如何让同一份数据拥有不同的方法。
---

我第一次注意到 `PhantomData<T>` 是在研究生命周期协变的时候——`PhantomData<&'a T>` 告诉编译器"我这个结构体像持有了 `&'a T` 一样"，从而影响编译器对生命周期的推断。这应该是它最常见的用途。

但最近在读 [rust-yamux](https://github.com/libp2p/rust-yamux) 的源码时，我发现它把 `PhantomData` 用在了另一个方向上——不是生命周期标记，而是**编译期类型标签**。同一个 `Header` 结构体，靠一个不占空间的泛型参数，在不同场景下暴露完全不同的 API。

## 同一个字段的不同含义

Yamux 的帧头固定 12 字节：

```rust
pub const HEADER_SIZE: usize = 12;

pub fn encode<T>(hdr: &Header<T>) -> [u8; HEADER_SIZE] {
    let mut buf = [0; HEADER_SIZE];
    buf[0] = hdr.version.0;
    buf[1] = hdr.tag as u8;
    buf[2..4].copy_from_slice(&hdr.flags.0.to_be_bytes());
    buf[4..8].copy_from_slice(&hdr.stream_id.0.to_be_bytes());
    buf[8..HEADER_SIZE].copy_from_slice(&hdr.length.0.to_be_bytes());
    buf
}
```

里面有个 `Type` 字段（1 字节），它决定了这个帧是什么：

| Type | 值 | length 字段含义 |
|------|-----|----------------|
| Data | 0x0 | payload 长度 |
| WindowUpdate | 0x1 | 窗口增量 |
| Ping | 0x2 | opaque value |
| GoAway | 0x3 | 错误码 |

同一个 `length` 字段，`Type` 不同，含义完全不同。

## 旧写法要包 Option

如果不用泛型，`Header` 大概长这样：

```rust
pub struct Header {
    version: Version,
    tag: Tag,
    flags: Flags,
    stream_id: StreamId,
    length: Len,
}
```

想获取 GoAway 的错误码，每次都要判断 tag：

```rust
impl Header {
    pub fn error_code(&self) -> Option<u32> {
        if matches!(self.tag, Tag::GoAway) {
            Some(self.length.0)
        } else {
            None
        }
    }
}
```

返回值是 `Option`，调用方还得判断是不是 `None`。更糟的是，编译器没法阻止你在 Data 帧上调 `error_code()`——无效状态到运行时才被发现。

## 空结构体+泛型的魔法

rust-yamux 的办法是先定义四个空 enum：

```rust
pub enum Data {}
pub enum WindowUpdate {}
pub enum Ping {}
pub enum GoAway {}
```

然后让 `Header` 带上泛型：

```rust
pub struct Header<T> {
    version: Version,
    tag: Tag,
    flags: Flags,
    stream_id: StreamId,
    length: Len,
    _marker: std::marker::PhantomData<T>,
}
```

`PhantomData<T>` 不占空间（ZST），但 `Header<Data>` 和 `Header<GoAway>` 在类型系统里是不同的类型。

## GoAway 专属方法

确定了类型之后，就可以写专属实现了：

```rust
impl Header<GoAway> {
    pub fn term() -> Self {
        Self::go_away(0)
    }

    pub fn protocol_error() -> Self {
        Self::go_away(1)
    }

    pub fn internal_error() -> Self {
        Self::go_away(2)
    }

    fn go_away(code: u32) -> Self {
        Header {
            version: Version(0),
            tag: Tag::GoAway,
            flags: Flags(0),
            stream_id: StreamId(0),
            length: Len(code),
            _marker: std::marker::PhantomData,
        }
    }
}
```

调用方拿到 `Header<GoAway>` 就可以直接获取错误码，不用做任何判断——类型已经保证了。

## 共享方法

不涉及类型的通用方法，用 `impl<T>` 实现：

```rust
impl<T> Header<T> {
    pub fn tag(&self) -> Tag {
        self.tag
    }

    pub fn flags(&self) -> Flags {
        self.flags
    }

    pub fn stream_id(&self) -> StreamId {
        self.stream_id
    }

    pub fn len(&self) -> Len {
        self.length
    }
}
```

`impl<T> Header<T>` 是所有类型共享的，`impl Header<GoAway>` 只给 GoAway。

## 从解码到转换

网络解析出来的帧一开始不知道具体类型，用 `Header<()>` 作为中间状态：

```rust
pub fn decode(buf: &[u8; HEADER_SIZE]) -> Result<Header<()>, HeaderDecodeError> {
    // ...
    let hdr = Header {
        version: Version(buf[0]),
        tag: match buf[1] {
            0 => Tag::Data,
            1 => Tag::WindowUpdate,
            2 => Tag::Ping,
            3 => Tag::GoAway,
            t => return Err(HeaderDecodeError::Type(t)),
        },
        // ...
        _marker: std::marker::PhantomData,
    };
    Ok(hdr)
}
```

确认类型后再转换：

```rust
impl Header<()> {
    pub(crate) fn into_data(self) -> Header<Data> {
        debug_assert_eq!(self.tag, Tag::Data);
        self.cast()
    }

    pub(crate) fn into_window_update(self) -> Header<WindowUpdate> {
        debug_assert_eq!(self.tag, Tag::WindowUpdate);
        self.cast()
    }

    pub(crate) fn into_ping(self) -> Header<Ping> {
        debug_assert_eq!(self.tag, Tag::Ping);
        self.cast()
    }
}
```

内部用 `cast` 做零成本转换——数据结构完全一样，只是把类型标签换了：

```rust
fn cast<U>(self) -> Header<U> {
    Header {
        version: self.version,
        tag: self.tag,
        flags: self.flags,
        stream_id: self.stream_id,
        length: self.length,
        _marker: std::marker::PhantomData,
    }
}
```

## enum 和 phantom type

用表格总结一下两种方式：

| | enum | phantom type |
|--|------|-------------|
| **适用场景** | 可枚举的不同类型 | 相同数据的不同状态 |
| **运行时** | 需要 match/tag | 无开销，编译期已确定 |
| **方法分发** | 统一接口，内部判断 | 专属实现，直接调用 |
| **错误发现** | 运行时 | 编译期 |

在 Yamux 这个例子里：

- 解析网络包时用 `enum Tag` 识别类型
- 确认后用 `into_data()` 等转换成 phantom type
- 后续代码在类型安全的上下文中工作，不再纠结 "这个 length 到底是什么"

`enum` 适合表达"不同类型的值是不同东西"，phantom type 适合表达"同一个值在不同上下文中含义不同"。

## 不止一种用法

回到开头的说法——`PhantomData` 最常用的还是生命周期相关：

```rust
// 告诉编译器：我这个结构体像是持有 &'a T
struct RefWrapper<'a, T> {
    _marker: PhantomData<&'a T>,
}
```

但在协议解析、状态机这类场景里，把它当类型标签用也很自然。rust-yamux 的 `Header<T>` 算是这种用法的教科书级示例——代码不多，概念清晰，推荐直接看源码。

## 参考

- [rust-yamux/frame/header.rs](https://github.com/libp2p/rust-yamux/blob/master/yamux/src/frame/header.rs)
- [Yamux 协议规范](https://github.com/hashicorp/yamux/blob/master/spec.md)
