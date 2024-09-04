---
title: Nust.js content使用项目组件报错
tags:
  - 前端
  - Nuxt.js
  - 错误解决
abbrlink: 2a91406b
date: 2024-09-04 13:50:05
---
# 问题描述

最近使用 Nuxt.js 的 [Content 模块](https://nuxt.com/modules/content)时，发现其支持项目中写好的 Vue 组件，相关文档可以参考 [这里](https://content.nuxt.com/usage/markdown#vue-components)
我在页面中尝试添加如下组件，该组件位于`~/components/XXX/VideoArea.vue`

```vue
<script setup lang="ts">
import ArtPlayer from "artplayer"

const art_ref = ref<HTMLInputElement | null>(null)
const art_instance = ref<Artplayer | null>(null);

const props = defineProps<{ url: string }>()

onMounted(() => {
    if (!art_ref.value) return
    // 文档参考： https://artplayer.org/document/start/option.html
    art_instance.value = new ArtPlayer({
        // 指定播放器的容器元素
        container: art_ref.value,
        // 设置视频的 URL
        url: props.url,
        // 启用自动迷你模式
        autoMini: true,
        // 启用自动调整大小
        autoSize: true,
        // 启用全屏模式
        fullscreen: true,
        // 使用服务器端渲染
        // useSSR: true,
        // 启用快进功能
        fastForward: true,
        // 锁定播放器界面
        lock: true
    })
})
</script>

<template>
    <div ref="art_ref" class="h-96 mr-auto">
        <slot></slot>
    </div>
</template>
```

对应 Content

```mdx
---
title: '标题'
description: '简述'
---
::xxx-video-area{url="视频链接"}
视频描述
::
```

发现启动后报错 `If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement.`，后来发现可能是没有设定全局组件，文档中有提到：
> Components that are used in Markdown has to be marked as global in your Nuxt app if you don't use the components/content/ directory, visit Nuxt 3 docs to learn more about it.
> 如果在Nuxt应用中使用的组件未放置在components/content/目录下，则需将其标记为全局组件。

对比一下，我的组件在`~/components/XXX/`下，而不是在`~/components/content/`下，因此无法访问到该组件。

# 解决方案

## 方案一：将组件移动到`~/components/content/`目录下

假设你的组件仅用于内容页面，可以将其移动到`~/components/content/`目录下，这样 Nuxt Content 模块会自动识别并加载这些组件。

## 方案二：将组件名称改为`VideoArea.global.vue`

参考[官方文档](https://nuxt.com/docs/guide/directory-structure/components#dynamic-components)，我们修改文件后缀名也可以达到全局化的效果

## 方案三：将所有组件默认设为全局

在`nuxt.config.ts`中，我们需要增加组件选项，设为全局即可

```ts
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: ['@nuxt/content'],

  // 为了适配 Nuxt content 必须全局注册
  // 注意下面这块，上面的如果你和我不同不需要改动
  components: {
    global: true,
    dirs: ['~/components']
  },
})
```
