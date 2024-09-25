---
title: >-
  Avalonia Unable to resolve property or method of name 'Id' on type
  'XamlX.TypeSystem.XamlPseudoType'解决办法
date: 2024-09-26 00:12:30
tags:
- Avalonia
- XAML
- CSharp
---

近期我在使用Avalonia编写桌面程序时，用到了ItemRepeater组件，写出来大概是这样

```xml
<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
             mc:Ignorable="d" d:DesignWidth="800" d:DesignHeight="450"
             xmlns:vm="clr-namespace:CooingOwl.ViewModels"
             xmlns:suki="clr-namespace:SukiUI.Controls;assembly=SukiUI"
             x:DataType="vm:ExploreViewModel"
             x:Class="CooingOwl.Views.ExploreView">

  <ScrollViewer HorizontalScrollBarVisibility="Auto">
    <ItemsRepeater ItemsSource="{Binding B}" Margin="16">
      <ItemsRepeater.Layout>
        <StackLayout Spacing="20"
                     Orientation="Vertical" />
      </ItemsRepeater.Layout>
      <ItemsRepeater.ItemTemplate>
        <DataTemplate>
          <suki:GlassCard>
            <StackPanel Orientation="Vertical">
              <TextBlock Text="{Binding  Name}"/>
              <TextBlock Margin="4 0" FontWeight="Bold"
                         Text="{Binding Id}"/>
            </StackPanel>
          </suki:GlassCard>
        </DataTemplate>
      </ItemsRepeater.ItemTemplate>
    </ItemsRepeater>
  </ScrollViewer>

</UserControl>

```

其中`<TextBlock Text="{Binding  Name}"/>`和`Text="{Binding Id}"/>`产生了报错`AVLN2000 Unable to resolve property or method of name 'Id' on type 'XamlX.TypeSystem.XamlPseudoType'.`，查看类型`ExploreViewModel`，定义大概如下

```csharp
public class ExploreViewModel : ViewModelBase
{
    public A[] B { get; set; } = new A[] { ... };
}

public class B{
    int Id,
    string Name
}
```

造成该问题的原因是我需要使用的属性B是一个原始的数组，这里应该使用`ObservableCollection`因此解决方案是做出如下修改

```csharp
public class ExploreViewModel : ViewModelBase
{
    public ObservableCollection<Assistant> Assistants { get; set; } = new (new List<Assistant>{...});
}
```

至此能够成功编译运行
