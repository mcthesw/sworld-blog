<script setup lang="ts">
import { computed } from 'vue'
import { usePostsData, type ThemePostsItem } from 'vuepress-theme-plume/client'

const avatarUrl = 'https://avatars.githubusercontent.com/u/61224072?v=4'

const postsData = usePostsData()

const allPosts = computed<ThemePostsItem[]>(() => {
  return postsData.value['/'] ?? postsData.value['/blog/'] ?? []
})

function postCategorySegments(post: ThemePostsItem): string[] {
  return (post.categoryList ?? []).map((c) => c.name)
}

const latestPosts = computed(() => {
  return allPosts.value
    .filter((p) => !p.draft && postCategorySegments(p)[0] !== 'games')
    .slice(0, 4)
})

const recentGamePosts = computed(() => {
  return allPosts.value
    .filter((p) => !p.draft && postCategorySegments(p)[0] === 'games')
    .slice(0, 4)
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}-${day}`
}

function blogCategory(post: ThemePostsItem): string {
  const category = postCategorySegments(post)[0]
  if (category === 'computer') return '技术'
  if (category === 'misc') return '杂谈'
  if (category === 'reading') return '阅读'
  return category ?? ''
}

function gameSubCategory(post: ThemePostsItem): string {
  const segs = postCategorySegments(post)
  if (segs[1] === 'demo') return 'Demo'
  if (segs[1] === 'review') return '评测'
  if (segs[1] === 'clear') return '记录'
  return ''
}

const cardClass = 'about-card flex min-w-0 flex-col items-start justify-start overflow-hidden rounded-xl border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg-soft)] px-5 pb-5 pt-4 transition-[border-color,box-shadow] duration-300 sm:aspect-square'
const cardTitleClass = 'about-card-title m-0 mb-2.5 text-[0.9375rem] font-bold tracking-[-0.01em] text-[var(--vp-c-text-1)]'
const cardListClass = 'm-0 flex w-full min-w-0 list-none flex-col gap-[0.4375rem] p-0 text-[0.8125rem] leading-[1.6] text-[var(--vp-c-text-2)] [&>li]:min-w-0'
const linkClass = 'about-link text-[var(--vp-c-brand-1)] no-underline transition-colors duration-150'
const socialButtonClass = 'about-social-btn inline-flex items-center gap-1.5 rounded-lg border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg-soft)] px-2.5 py-1.5 text-[0.8125rem] text-[var(--vp-c-text-2)] no-underline transition-[color,border-color,background-color] duration-200'
const socialIconClass = 'h-4 w-4 shrink-0'
const sponsorLinkClass = 'about-sponsor-link py-0.5 text-xs text-[var(--vp-c-text-3)] no-underline transition-colors duration-200'
const tagClass = 'inline-flex items-center whitespace-nowrap rounded bg-[var(--vp-c-bg)] px-1.5 py-px align-middle text-[0.6875rem] text-[var(--vp-c-text-3)]'
const moreLinkClass = 'mt-auto self-end pt-3 inline-flex items-center gap-0.5 text-xs font-medium text-[var(--vp-c-brand-1)] no-underline opacity-60 transition-opacity duration-150 hover:opacity-100'
</script>

<template>
  <div class="mx-auto grid max-w-[1160px] grid-cols-1 items-start gap-6 px-4 md:px-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-8 xl:max-w-[1220px] xl:px-0">
    <section class="flex flex-col gap-3 lg:sticky lg:top-24 lg:pr-2">
      <img
        class="h-44 w-44 rounded-2xl border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg-soft)] object-cover shadow-[0_18px_40px_-34px_rgba(15,23,42,0.26)]"
        :src="avatarUrl"
        alt="avatar"
      >

      <h1 class="mt-1 text-[1.5rem] font-extrabold tracking-[-0.02em] text-[var(--vp-c-text-1)]">Sworld</h1>
      <p class="m-0 text-[0.8125rem] leading-[1.6] text-[var(--vp-c-text-3)]">
        The only way to do great work is to love what you do.
      </p>

      <div class="mt-1 flex flex-wrap gap-1.5">
        <a :class="socialButtonClass" href="https://github.com/mcthesw" target="_blank" rel="noopener noreferrer">
          <svg :class="socialIconClass" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
          GitHub
        </a>
        <a :class="socialButtonClass" href="https://space.bilibili.com/4087637" target="_blank" rel="noopener noreferrer">
          <svg :class="socialIconClass" viewBox="0 0 24 24" fill="currentColor"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" /></svg>
          Bilibili
        </a>
        <a :class="socialButtonClass" href="mailto:t.sworld@qq.com">
          <svg :class="socialIconClass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
          Email
        </a>
        <a :class="socialButtonClass" href="https://t.me/sworld233" target="_blank" rel="noopener noreferrer">
          <svg :class="socialIconClass" viewBox="0 0 24 24" fill="currentColor"><path d="M23.91 3.79 20.3 20.82c-.27 1.2-.98 1.5-1.99.93l-5.5-4.05-2.65 2.55c-.29.29-.54.54-1.11.54l.39-5.6L19.64 6c.44-.39-.1-.61-.68-.22L6.36 13.71.93 12.01c-1.18-.37-1.2-1.18.25-1.75L22.4 2.08c.98-.36 1.84.22 1.51 1.71Z" /></svg>
          Telegram
        </a>
      </div>

      <div class="mt-1 flex flex-wrap items-center gap-2 border-t border-[var(--vp-c-divider)] pt-3">
        <a :class="sponsorLinkClass" href="https://afdian.com/a/Sworld" target="_blank" rel="noopener noreferrer">☕ 爱发电</a>
        <div class="group relative">
          <a :class="sponsorLinkClass" href="/images/sponsor_wechat.png" target="_blank" rel="noopener noreferrer">💝 赞赏码</a>
          <div class="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-xl border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg)] p-2 opacity-0 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
            <img class="block w-full rounded-lg" src="/images/sponsor_wechat.png" alt="赞赏码" loading="lazy">
          </div>
        </div>
      </div>
    </section>

    <section class="min-w-0 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div :class="cardClass">
        <h2 :class="cardTitleClass">Projects</h2>
        <ul :class="cardListClass">
          <li>
            <a :class="linkClass" href="https://github.com/mcthesw/game-save-manager" target="_blank" rel="noopener noreferrer">game-save-manager</a>
            <span :class="[tagClass, 'ml-1.5', 'about-tag-accent']">寻找合作者</span>
          </li>
          <li>
            <a :class="linkClass" href="https://github.com/mcthesw/easy-nats" target="_blank" rel="noopener noreferrer">easy-nats</a>
            <span :class="[tagClass, 'ml-1.5', 'about-tag-accent']">寻找合作者</span>
          </li>
          <li>
            <a :class="linkClass" href="https://github.com/mcthesw/TractorBeam" target="_blank" rel="noopener noreferrer">tractor-beam</a>
            <span :class="[tagClass, 'ml-1.5', 'about-tag-accent']">以撒联机小工具</span>
          </li>
          <li>
            <a :class="linkClass" href="https://github.com/chevey339/kelivo" target="_blank" rel="noopener noreferrer">kelivo</a>
            <span :class="[tagClass, 'ml-1.5', 'about-tag-accent']">参与贡献</span>
          </li>
        </ul>
      </div>

      <div :class="cardClass">
        <h2 :class="cardTitleClass">Latest blogs</h2>
        <ul :class="cardListClass">
          <li
            v-for="post in latestPosts"
            :key="post.path"
            class="relative flex w-full min-w-0 items-baseline justify-between gap-2 before:absolute before:left-[-0.75rem] before:top-[0.625rem] before:h-1 before:w-1 before:rounded-full before:bg-[var(--vp-c-text-3)] before:content-['']"
          >
            <RouterLink :to="post.path" :class="[linkClass, 'block min-w-0 flex-1 truncate']">{{ post.title }}</RouterLink>
            <span class="ml-2 flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[0.6875rem] text-[var(--vp-c-text-3)]">
              <span>{{ formatDate(post.createTime ?? '') }}</span>
              <span v-if="blogCategory(post)" :class="tagClass">{{ blogCategory(post) }}</span>
            </span>
          </li>
          <li v-if="!latestPosts.length" class="text-xs text-[var(--vp-c-text-3)]">暂无文章</li>
        </ul>
        <RouterLink to="/blog/archives/" :class="moreLinkClass">more <span aria-hidden="true">&rarr;</span></RouterLink>
      </div>

      <div :class="cardClass">
        <h2 :class="cardTitleClass">About me</h2>
        <p class="m-0 text-[0.8125rem] leading-[1.75] text-[var(--vp-c-text-3)]">WIP</p>
      </div>

      <div :class="cardClass">
        <h2 :class="cardTitleClass">Likes</h2>
        <ul :class="cardListClass">
          <li>学习新事物</li>
          <li>玩电子游戏</li>
          <li>想看一次极光</li>
        </ul>
      </div>

      <div :class="cardClass">
        <h2 :class="cardTitleClass">Recommends</h2>
        <ul :class="cardListClass">
          <li>
            <a :class="linkClass" href="https://store.steampowered.com/app/4122860" target="_blank" rel="noopener noreferrer">Z.A.T.O.</a>
            <span :class="[tagClass, 'ml-1.5']">游戏</span>
            <span class="mt-1 block text-xs text-[var(--vp-c-text-3)]">I love the world and everything in it</span>
          </li>
          <li>
            <a :class="linkClass" href="https://comiccune.jp/series/simejisimulation/" target="_blank" rel="noopener noreferrer">蘑菇的拟态日常</a>
            <span :class="[tagClass, 'ml-1.5']">漫画</span>
          </li>
          <li>
            <a :class="linkClass" href="https://github.com/wez/wezterm" target="_blank" rel="noopener noreferrer">WezTerm</a>
            <span :class="[tagClass, 'ml-1.5']">工具</span>
          </li>
          <li>
            <a :class="linkClass" href="https://apps.ankiweb.net/" target="_blank" rel="noopener noreferrer">Anki</a>
            <span :class="[tagClass, 'ml-1.5']">工具</span>
          </li>
        </ul>
      </div>

      <div :class="cardClass">
        <h2 :class="cardTitleClass">Aspirations</h2>
        <ul :class="cardListClass">
          <li>开发自己的独立游戏</li>
          <li>为教育学习领域做贡献</li>
        </ul>
      </div>

      <div :class="cardClass">
        <h2 :class="cardTitleClass">Learning</h2>
        <ul :class="cardListClass">
          <li>
            语言
            <span class="mt-1 block text-xs text-[var(--vp-c-text-3)]">俄语、日语</span>
          </li>
          <li>绘画</li>
          <li>平面设计</li>
        </ul>
      </div>

      <div :class="cardClass">
        <h2 :class="cardTitleClass">Now Playing</h2>
        <ul :class="cardListClass">
          <li>雨世界</li>
          <li>Hyperbolica</li>
          <li>以撒的结合</li>
          <li>天国拯救 2</li>
        </ul>
      </div>

      <div :class="cardClass">
        <h2 :class="cardTitleClass">Recent Games</h2>
        <ul :class="cardListClass">
          <li
            v-for="post in recentGamePosts"
            :key="post.path"
            class="relative flex w-full min-w-0 items-baseline justify-between gap-2 before:absolute before:left-[-0.75rem] before:top-[0.625rem] before:h-1 before:w-1 before:rounded-full before:bg-[var(--vp-c-text-3)] before:content-['']"
          >
            <RouterLink :to="post.path" :class="[linkClass, 'block min-w-0 flex-1 truncate']">{{ post.title }}</RouterLink>
            <span class="ml-2 flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[0.6875rem] text-[var(--vp-c-text-3)]">
              <span>{{ formatDate(post.createTime ?? '') }}</span>
              <span v-if="gameSubCategory(post)" :class="tagClass">{{ gameSubCategory(post) }}</span>
            </span>
          </li>
          <li v-if="!recentGamePosts.length" class="text-xs text-[var(--vp-c-text-3)]">暂无游戏文章</li>
        </ul>
        <RouterLink to="/games/" :class="moreLinkClass">more <span aria-hidden="true">&rarr;</span></RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-social-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 40%, var(--vp-c-divider));
  background: color-mix(in srgb, var(--vp-c-brand-1) 6%, var(--vp-c-bg-soft));
}

.about-sponsor-link:hover {
  color: var(--vp-c-text-2);
}

.about-card:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 36%, var(--vp-c-divider));
  box-shadow: 0 4px 20px -6px color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
}

.about-card > .about-card-title:first-of-type {
  margin-top: 0;
}

.about-link:hover {
  color: color-mix(in srgb, var(--vp-c-brand-1) 72%, var(--vp-c-text-1));
}

.about-tag-accent {
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
  color: var(--vp-c-brand-1);
}
</style>
