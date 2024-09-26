---
title: Avalonia采用AOT编译后无法运行解决办法
date: 2024-09-26 16:24:23
tags:
- Avalonia
- CSharp
---

近日在制作Avalonia程序过程中，发现调试时很正常，发布后却无法运行，感觉很奇怪，我的发布配置有以下两条：

```xml
    <PublishTrimmed>True</PublishTrimmed>
    <PublishAot Condition="'$(Configuration)' != 'Debug'">true</PublishAot>
```

第一条启用了裁剪，第二条启用了AOT编译（但是在开发时没开启，因为预览窗口不支持AOT）

经过一番排查，发现这两个都有问题：

1. 反射对AOT不友好，我的`ViewLocator.cs`使用了反射来创建对象
2. 有的库对剪裁支持不好，因此要对其关闭剪裁

## 解决方案

### 问题1: 消除反射

原代码使用反射创建对象：

```csharp
public Control? Build(object? param)
{
    if (param != null && param is ViewModelBase)
    {
        var viewModelType = param.GetType();
        if (_viewModelViewMappings.TryGetValue(viewModelType, out var viewType))
        {
            return (Control)Activator.CreateInstance(viewType)!; // 这里使用了反射
        }
        return new TextBlock { Text = "Not Found: " + viewModelType.FullName };
    }
    return null;
}
```

修改后使用工厂方法：

```csharp
public Control? Build(object? param)
{
    if (param != null && param is ViewModelBase)
    {
        var viewModelType = param.GetType();
        if (_viewModelViewMappings.TryGetValue(viewModelType, out var viewFactory))
        {
            return viewFactory(); // 使用了工厂方法
        }
        return new TextBlock { Text = "Not Found: " + viewModelType.FullName };
    }
    return null;
}

```

这样就可以消除反射了

### 问题2: 关闭特定库的剪裁

发布时我注意到很多这样的剪裁警告

```text
2>Assembly 'Serilog' produced trim warnings. For more information see https://aka.ms/dotnet-illink/libraries
2>Assembly 'ReactiveUI' produced trim warnings. For more information see https://aka.ms/dotnet-illink/libraries
2>Assembly 'SukiUI' produced trim warnings. For more information see https://aka.ms/dotnet-illink/libraries
2>Assembly 'Avalonia.Controls.DataGrid' produced trim warnings. For more information see https://aka.ms/dotnet-illink/libraries
2>Assembly 'Avalonia.Controls.DataGrid' produced AOT analysis warnings.
```

因此我修改项目的sln文件，增加以下片段，通过外部的xml文件来限制剪裁

```xml
  <ItemGroup>
    <TrimmerRootDescriptor Include="TrimmerRoots.xml" />
  </ItemGroup>
```

下面是`TrimmerRoots.xml`的内容

```xml
<?xml version="1.0" encoding="utf-8" ?>
<linker>
  <assembly fullname="Serilog" />
  <assembly fullname="Serilog.Sinks.Console" />
  <assembly fullname="Serilog.Sinks.File" />
  <assembly fullname="ReactiveUI" />
  <assembly fullname="SukiUI" />
  <assembly fullname="Serilog.Sinks.File" />
</linker>
```

我将所有报警告的项目都加入了进去，虽然后面的编译依旧有新的警告，但是程序可以正常运行了。至此，所有问题解决。
