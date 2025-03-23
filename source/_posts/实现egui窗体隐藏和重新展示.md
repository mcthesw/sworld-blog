---
title: 实现egui窗体隐藏和重新展示
date: 2025-03-23 21:34:54
tags:
 - Rust
 - egui
 - GUI
---

近期在使用 `egui` 时遇到一个问题，我想要将窗体隐藏起来，再通过托盘图标唤出，本来以为如此简单的需求应当非常简单，结果我发现 `egui` 官方的框架 `eframe` 对这个功能的支持并不好，在 GitHub 上长期有着相关讨论，例如[这个Issue](https://github.com/emilk/egui/issues/5229#issuecomment-2740135925)。

本文中，我将首先复现 `eframe` 的问题，然后介绍一个通过 `egui_glow` 与 `egui_winit` 实现的解决方案，提供一个尚且能用的示例。

## 复现问题

### 前置依赖

以下是我的 `Cargo.toml` 文件：

```toml
[package]
name = "test_egui"
version = "0.1.0"
edition = "2024"

[dependencies]
egui = "0.31.1"
eframe = "0.31.1"
tokio = { version = "1.44.1", features = ["full"] }
```

### 问题复现

为了简化问题，我将上述问题抽象成这样一个模型：**编写一个rust程序，后台线程控制它定时出现或消失**。

为了实现这个功能，我们很容易就会写出这样的代码：

```rust
struct MyApp {}

impl eframe::App for MyApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.label("Hello, world!");
            });
        });
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let rt = tokio::runtime::Runtime::new()?;
    let _guard = rt.enter();

    eframe::run_native(
        "Egui Test App",
        Default::default(),
        Box::new(|_cc| {
            let ctx = _cc.egui_ctx.clone();
            rt.spawn(async move {
                loop {
                    println!("Running background task...");
                    ctx.send_viewport_cmd(egui::ViewportCommand::Visible(false));
                    ctx.request_repaint();
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                    ctx.send_viewport_cmd(egui::ViewportCommand::Visible(true));
                    ctx.request_repaint();
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                }
            });
            Ok(Box::new(MyApp {}))
        }),
    )?;

    Ok(())
}
```

然而很遗憾，这个代码并不能正常工作。我们可以看到，窗体在后台线程中是可以被隐藏的，但是调用 `ctx.send_viewport_cmd(egui::ViewportCommand::Visible(true));` 却没有任何效果，通过打印出来的日志可以看出，循环是正常执行的，但是窗体并没有重新展示出来。
这是因为 `eframe` 在窗体隐藏时不会去处理这些事件，从 GitHub 的相关讨论来看，目前这是一个没有被解决的问题，因此，我们需要暂时不使用 `eframe`，而是使用 `egui` 的底层库 `egui_glow` 和 `egui_winit` 来实现这个功能。

## 解决方案

如果我们能够自己处理 `winit` 的事件循环，那么就可以轻松定制有关窗体的行为了，我找到了官方的一个示例：[Prue-glow](https://github.com/emilk/egui/blob/master/crates/egui_glow/examples/pure_glow.rs)。

### 更新依赖

既然我们不再使用 `eframe` 了，那么我们需要参照上方链接把 `Cargo.toml` 中的依赖更新为：

```toml
[dependencies]
egui = "0.31.1"
egui-winit = "0.31.1"
winit = "0.30.9"
glow = "0.16.0"
egui_glow = {version = "0.31.1", features = ["winit"]}
glutin = "0.32.2"
glutin-winit = "0.5.0"

tokio = { version = "1.44.1", features = ["full"] }
log = "0.4.26"
```

### 改造后的`main`

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let event_loop = winit::event_loop::EventLoop::<event::UserEvent>::with_user_event()
        .build()
        .unwrap();
    let proxy = event_loop.create_proxy();

    let rt = tokio::runtime::Runtime::new()?;
    let _guard = rt.enter();
    let proxy_clone = proxy.clone(); // !NOTICE: clone the proxy for the background task

    rt.spawn(async move {
        loop {
            println!("Running background task...");
            proxy_clone
                .send_event(event::UserEvent::HideWindow)
                .unwrap();
            proxy_clone
                .send_event(event::UserEvent::Redraw(Duration::ZERO))
                .unwrap();
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            proxy_clone
                .send_event(event::UserEvent::ShowWindow)
                .unwrap();
            proxy_clone
                .send_event(event::UserEvent::Redraw(Duration::ZERO))
                .unwrap();
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        }
    });

    let mut app = app::GlowApp::new(
        proxy,
        Box::new(|egui_ctx| {
            egui::CentralPanel::default().show(egui_ctx, |ui| {
                ui.heading("Hello World!");
            });
        }),
    );
    event_loop.run_app(&mut app).expect("failed to run app");

    Ok(())
}
```

这是我改造之后的`main` 函数，主要的变化在于我们使用 `winit` 的事件循环来处理窗体的行为。我们在后台线程通过 `EventLoopProxy<UserEvent>` 中发送 `UserEvent` 来控制窗体的显示和隐藏。

### 事件处理

同理，我们需要实现 `ApplicationHandler<UserEvent>`，这里才是接受并处理 `UserEvent` 的地方。如果你需要管理应用的一些状态，可以直接在 `GlowApp` 结构体中添加相关字段（如我注释掉的 `AppState`），并且在 `user_event` 中处理与更新，这里我只建议进行简单的数据显示等操作，计算的部分还是放在后台比较好，否则会影响到UI的流畅度。另外，你也可能会需要更新 `update_ui` 以接受 `AppState`。

```rust
pub struct GlowApp {
    proxy: winit::event_loop::EventLoopProxy<UserEvent>,
    gl_window: Option<GlutinWindowContext>,
    gl: Option<Arc<glow::Context>>,
    egui_glow: Option<egui_glow::EguiGlow>,
    repaint_delay: std::time::Duration,
    clear_color: [f32; 3],
    window_hidden: bool,
    update_ui: Box<dyn Fn(&egui::Context) + Send + Sync + 'static>,
    // state: AppState,
}

impl winit::application::ApplicationHandler<UserEvent> for GlowApp {
    // ... skip other methods
    fn user_event(&mut self, _event_loop: &winit::event_loop::ActiveEventLoop, event: UserEvent) {
        match event {
            UserEvent::Redraw(delay) => self.repaint_delay = delay,
            UserEvent::ShowWindow => {
                self.window_hidden = false;
                if let Some(ref gl_window) = self.gl_window {
                    gl_window.window().set_visible(true);
                    gl_window.window().request_redraw();
                }
            }
            UserEvent::HideWindow => {
                self.window_hidden = true;
                if let Some(ref gl_window) = self.gl_window {
                    gl_window.window().set_visible(false);
                }
            }
        }
    }
}
```

### 总结

至此，程序窗体就会定时隐藏和重新展示了，若想要实现角标的事件处理功能，可以参考[这个示例](https://docs.rs/tray-icon/latest/tray_icon/#note-for-winit-or-tao-users)来把 tray 事件添加到我们的事件中，再在 `user_event` 中处理。

### 完整代码

为什么我不在上方直接呈现出所有代码呢？当然是因为太长了……我认为对于实现简单的需求来说，了解上面的部分就可以很快地上手修改了，把我的（或者官方的）案例复制走即可。当然，我这份代码有许多小问题，不适合直接用于生产环境，请仔细检查后再使用。

- [复现问题部分代码](https://github.com/mcthesw/egui-glow-winit-simple-example/tree/cb51c9316140bf4c91468c90429942b93a7c5ad0)
- [问题解决代码](https://github.com/mcthesw/egui-glow-winit-simple-example/tree/main)

另外，我也正在尝试构建一个 egui 桌面应用的模版，欢迎关注我的 GitHub 主页：[mcthesw](https://github.com/mcthesw)，如果成功，我会在这里更新相关信息。
