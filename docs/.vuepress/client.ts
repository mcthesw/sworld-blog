/// <reference path="./shim.d.ts" />

import { defineClientConfig } from 'vuepress/client'
// import RepoCard from 'vuepress-theme-plume/features/RepoCard.vue'
// import NpmBadge from 'vuepress-theme-plume/features/NpmBadge.vue'
// import NpmBadgeGroup from 'vuepress-theme-plume/features/NpmBadgeGroup.vue'
// import Swiper from 'vuepress-theme-plume/features/Swiper.vue'

// import CustomComponent from './theme/components/Custom.vue'

import './theme/styles/tailwind.css'

import AboutHome from './components/AboutHome.vue'
import FriendLinks from './components/FriendLinks.vue'
import GameNav from './components/GameNav.vue'
import PostMasonry from './components/PostMasonry.vue'
import ReadingHome from './components/ReadingHome.vue'
import ReadingLinks from './components/ReadingLinks.vue'
import ReadingNote from './components/ReadingNote.vue'
import ReadingStream from './components/ReadingStream.vue'

export default defineClientConfig({
  enhance({ app }) {
    // built-in components
    // app.component('RepoCard', RepoCard)
    // app.component('NpmBadge', NpmBadge)
    // app.component('NpmBadgeGroup', NpmBadgeGroup)
    // app.component('Swiper', Swiper) // you should install `swiper`

    // your custom components
    // app.component('CustomComponent', CustomComponent)

    app.component('AboutHome', AboutHome)
    app.component('FriendLinks', FriendLinks)
    app.component('GameNav', GameNav)
    app.component('PostMasonry', PostMasonry)
    app.component('ReadingHome', ReadingHome)
    app.component('ReadingLinks', ReadingLinks)
    app.component('ReadingNote', ReadingNote)
    app.component('ReadingStream', ReadingStream)
  },
})
