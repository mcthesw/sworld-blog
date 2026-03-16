<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vuepress/client'
import { type ThemePostsItem, usePostsData } from 'vuepress-theme-plume/client'

type CardVariant = 'default' | 'game-review' | 'game-demo' | 'game-log'
type GamePlayStatus = '通关！' | '游玩中' | '搁置' | '想玩' | '放弃'

const props = withDefaults(
  defineProps<{
    /**
     * Category path like "games/demo" or "computer".
     * Matches both prefix and suffix of the post's categoryList names.
     */
    category?: string
    /** Collection key from postsData, for example "/" or "/blog/". */
    collection?: string
    /** Optional heading rendered above the grid. */
    title?: string
    /** Max number of posts to render. */
    limit?: number
  }>(),
  {
    limit: 999,
  },
)

const postsData = usePostsData()

const localCoverMap = import.meta.glob<string>(
  '../../{computer,misc,games}/**/*.{png,jpg,jpeg,webp,avif,gif,PNG,JPG,JPEG,WEBP,AVIF,GIF}',
  { eager: true, query: '?url', import: 'default' },
)

const statusAliasMap: Record<string, GamePlayStatus> = {
  '通关': '通关！',
  '通关！': '通关！',
  '已通关': '通关！',
  '游玩中': '游玩中',
  '在玩': '游玩中',
  '搁置': '搁置',
  '想玩': '想玩',
  '放弃': '放弃',
  '弃坑': '放弃',
}

function normalizeSegments(input?: string): string[] {
  return (input ?? '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
}

function normalizeCollectionPath(input?: string): string {
  const trimmed = (input ?? '').trim()
  if (!trimmed) return ''

  let out = trimmed
  if (!out.startsWith('/')) out = '/' + out
  if (!out.endsWith('/')) out = out + '/'
  return out
}

function postCategorySegments(post: ThemePostsItem): string[] {
  return (post.categoryList ?? []).map((c) => c.name)
}

function matchCategory(post: ThemePostsItem, expected: string[]): boolean {
  if (!expected.length) return true

  const segs = postCategorySegments(post)
  if (!segs.length) return false

  const prefix = segs.slice(0, expected.length)
  if (prefix.join('/') === expected.join('/')) return true

  const suffix = segs.slice(-expected.length)
  return suffix.join('/') === expected.join('/')
}

function excerptText(excerpt: string): string {
  const text = excerpt
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= 120) return text
  return text.slice(0, 120) + '…'
}

function isAbsoluteCoverPath(input: string): boolean {
  return /^(?:[a-z]+:)?\/\//i.test(input) || input.startsWith('/') || input.startsWith('data:')
}

function normalizeCoverPath(input: string): string {
  return input.trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '')
}

function resolveCoverSrc(post: ThemePostsItem): string {
  const rawCover = typeof post.cover === 'string' ? post.cover.trim() : ''
  if (!rawCover) return ''

  if (isAbsoluteCoverPath(rawCover)) return withBase(rawCover)

  const normalizedCover = normalizeCoverPath(rawCover)
  const categories = postCategorySegments(post)
  if (categories.length) {
    const localKey = `../../${categories.join('/')}/${normalizedCover}`
    const localCover = localCoverMap[localKey]
    if (localCover) return withBase(localCover)
  }

  return withBase(rawCover)
}

function tagBasePath(collectionKey: string): string {
  if (collectionKey === '/games/') return '/games/posts/tags/'
  return '/blog/tags/'
}

function tagLink(tag: string, collectionKey: string): string {
  return tagBasePath(collectionKey) + '?tag=' + encodeURIComponent(tag)
}

function detectVariant(post: ThemePostsItem): CardVariant {
  const [first, second] = postCategorySegments(post)
  if (first !== 'games') return 'default'
  if (second === 'review') return 'game-review'
  if (second === 'demo') return 'game-demo'
  if (second === 'clear') return 'game-log'
  return 'default'
}

function normalizeScore(value: string): string | undefined {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0 || num > 10) return undefined
  if (Number.isInteger(num)) return String(num)
  return num.toFixed(1).replace(/\.0$/, '')
}

function parseScoreTag(tag: string): string | undefined {
  const t = tag.trim()
  const byKey = t.match(/^(?:score|评分)\s*[:：]\s*([0-9]+(?:\.[0-9]+)?)$/i)
  if (byKey) return normalizeScore(byKey[1])

  const bySuffix = t.match(/^([0-9]+(?:\.[0-9]+)?)\s*分$/)
  if (bySuffix) return normalizeScore(bySuffix[1])

  return undefined
}

function parseExpectationTag(tag: string): string | undefined {
  const t = tag.trim()
  const byKey = t.match(/^(?:expect|期待|期待值)\s*[:：]\s*([0-9]+(?:\.[0-9]+)?)$/i)
  if (byKey) return normalizeScore(byKey[1])

  const byPrefix = t.match(/^期待\s*([0-9]+(?:\.[0-9]+)?)$/)
  if (byPrefix) return normalizeScore(byPrefix[1])

  return undefined
}

function parseStatusTag(tag: string): GamePlayStatus | undefined {
  const direct = statusAliasMap[tag.trim()]
  if (direct) return direct

  const m = tag.trim().match(/^(?:状态|status)\s*[:：]\s*(.+)$/i)
  if (!m) return undefined
  return statusAliasMap[m[1].trim()]
}

function statusTone(status?: GamePlayStatus): string {
  if (status === '通关！') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
  if (status === '游玩中') return 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
  if (status === '搁置') return 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
  if (status === '想玩') return 'bg-violet-500/15 text-violet-600 dark:text-violet-300'
  if (status === '放弃') return 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
  return 'bg-[var(--vp-c-bg-soft)] text-[var(--vp-c-text-2)]'
}

function splitSpecialTags(tags: string[]): {
  score?: string
  expectation?: string
  status?: GamePlayStatus
  displayTags: string[]
} {
  let score: string | undefined
  let expectation: string | undefined
  let status: GamePlayStatus | undefined
  const displayTags: string[] = []

  for (const tag of tags) {
    const foundExpectation = parseExpectationTag(tag)
    if (!expectation && foundExpectation) {
      expectation = foundExpectation
      continue
    }

    const foundScore = parseScoreTag(tag)
    if (!score && foundScore) {
      score = foundScore
      continue
    }

    const foundStatus = parseStatusTag(tag)
    if (!status && foundStatus) {
      status = foundStatus
      continue
    }

    displayTags.push(tag)
  }

  return { score, expectation, status, displayTags }
}

function gameNameOf(post: ThemePostsItem): string {
  const segs = postCategorySegments(post)
  if (segs[0] !== 'games') return post.title
  return segs[2] || post.title
}

function setSpotlightPosition(el: HTMLElement, clientX: number, clientY: number): void {
  const rect = el.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top
  el.style.setProperty('--spotlight-x', x + 'px')
  el.style.setProperty('--spotlight-y', y + 'px')
}

function handleCardMouseMove(event: MouseEvent): void {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return
  setSpotlightPosition(el, event.clientX, event.clientY)
}

function handleCardMouseEnter(event: MouseEvent): void {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return
  setSpotlightPosition(el, event.clientX, event.clientY)
  el.style.setProperty('--spotlight-opacity', '1')
}

function handleCardMouseLeave(event: MouseEvent): void {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return
  el.style.setProperty('--spotlight-opacity', '0')
}

function handleCardFocus(event: FocusEvent): void {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return

  const rect = el.getBoundingClientRect()
  el.style.setProperty('--spotlight-x', rect.width / 2 + 'px')
  el.style.setProperty('--spotlight-y', rect.height / 2 + 'px')
  el.style.setProperty('--spotlight-opacity', '1')
}

function handleCardBlur(event: FocusEvent): void {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return
  el.style.setProperty('--spotlight-opacity', '0')
}

const categorySegments = computed(() => normalizeSegments(props.category))
const selectedCollection = computed(() => normalizeCollectionPath(props.collection))

const activeCollection = computed(() => {
  const collectionKey = selectedCollection.value
  if (collectionKey) return collectionKey
  return postsData.value['/'] ? '/' : '/blog/'
})

const allPosts = computed<ThemePostsItem[]>(() => {
  const collectionKey = selectedCollection.value
  if (collectionKey) return postsData.value[collectionKey] ?? []

  return postsData.value['/'] ?? postsData.value['/blog/'] ?? []
})

const filteredPosts = computed(() => {
  const list = allPosts.value
    .filter((p) => !p.draft)
    .filter((p) => matchCategory(p, categorySegments.value))

  return list.slice(0, Math.max(0, props.limit))
})

/* biome-ignore lint/correctness/noUnusedVariables: used in template */
const cards = computed(() => {
  return filteredPosts.value.map((post) => {
    const coverSrc = resolveCoverSrc(post)
    const hasCover = !!coverSrc
    const variant = detectVariant(post)
    const gameName = gameNameOf(post)
    const { score, expectation, status, displayTags } = splitSpecialTags(post.tags ?? [])

    return {
      post,
      variant,
      hasCover,
      coverSrc,
      excerpt: post.excerpt ? excerptText(post.excerpt) : '',
      date: post.createTime || '',
      gameName,
      score,
      expectation: expectation || score,
      status,
      showTitleInLog: post.title !== gameName,
      tags: displayTags.slice(0, 4),
    }
  })
})
</script>

<template>
  <section class="space-y-8">
    <h2 v-if="title" class="flex items-center gap-3 text-2xl font-bold tracking-tight text-[var(--vp-c-text-1)]">
      <span class="h-6 w-1.5 rounded-full bg-gradient-to-b from-[var(--vp-c-brand-1)] to-[var(--vp-c-brand-2)]" />
      {{ title }}
    </h2>

    <div v-if="cards.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      <article
        v-for="{ post, variant, hasCover, coverSrc, excerpt, date, gameName, score, expectation, status, showTitleInLog, tags } in cards"
        :key="post.path"
        class="group relative overflow-hidden rounded-[20px] border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]"
        style="--spotlight-x: 50%; --spotlight-y: 50%; --spotlight-opacity: 0;"
        @mousemove="handleCardMouseMove"
        @mouseenter="handleCardMouseEnter"
        @mouseleave="handleCardMouseLeave"
        @focusin="handleCardFocus"
        @focusout="handleCardBlur"
      >
        <div
          class="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-[var(--spotlight-opacity)] transition-opacity duration-500 ease-out"
          style="background: radial-gradient(320px circle at var(--spotlight-x) var(--spotlight-y), color-mix(in srgb, var(--vp-c-brand-1) 24%, transparent), transparent 72%);"
        />
        <div
          class="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100"
          style="background: linear-gradient(180deg, color-mix(in srgb, white 16%, transparent), transparent 24%);"
        />

        <RouterLink
          class="masonry-card-link absolute inset-0 z-[2] rounded-[inherit]"
          :to="post.path"
          :aria-label="'查看文章：' + post.title"
        />

        <div class="relative z-[3] flex h-full flex-col pointer-events-none">
          <div v-if="hasCover" class="relative w-full overflow-hidden" :class="variant === 'game-log' ? 'aspect-[21/9]' : 'aspect-[16/9]'">
            <img
              class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              :src="coverSrc"
              :alt="post.title"
              loading="lazy"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>

          <div v-if="variant === 'game-review'" class="flex flex-1 flex-col gap-4 p-6">
            <div class="flex items-center justify-between gap-3">
              <span class="inline-flex items-center rounded-full bg-[var(--vp-c-bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--vp-c-text-2)]">{{ gameName }}</span>
              <span class="inline-flex items-center rounded-full bg-[var(--vp-c-brand-soft)] px-2.5 py-1 text-xs font-bold text-[var(--vp-c-brand-1)]">{{ score ? '评分 ' + score + '/10' : '未评分' }}</span>
            </div>

            <h3 class="text-lg font-bold leading-snug tracking-tight text-[var(--vp-c-text-1)] transition-colors duration-300 group-hover:text-[var(--vp-c-brand-1)]">
              {{ post.title }}
            </h3>

            <p class="line-clamp-2 text-sm leading-relaxed text-[var(--vp-c-text-2)]">
              {{ excerpt || '待补充一句话简评。' }}
            </p>

            <div class="mt-auto flex items-center justify-between text-xs text-[var(--vp-c-text-3)]">
              <span>{{ date }}</span>
              <span class="opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-[var(--vp-c-brand-1)]">查看文章 &rarr;</span>
            </div>

            <div v-if="tags.length" class="pointer-events-auto flex flex-wrap gap-2">
              <RouterLink
                v-for="tag in tags"
                :key="post.path + '-' + tag"
                :to="tagLink(tag, activeCollection)"
                class="masonry-tag inline-flex items-center rounded-md bg-[var(--vp-c-bg-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--vp-c-text-2)] transition-colors hover:bg-[var(--vp-c-brand-soft)] hover:text-[var(--vp-c-brand-1)]"
                @click.stop
              >
                {{ tag }}
              </RouterLink>
            </div>
          </div>

          <div v-else-if="variant === 'game-demo'" class="flex flex-1 flex-col gap-4 p-6">
            <div class="flex items-center justify-between text-xs text-[var(--vp-c-text-3)]">
              <span>{{ date }}</span>
              <span class="inline-flex items-center rounded-full bg-[var(--vp-c-brand-soft)] px-2.5 py-1 text-xs font-bold text-[var(--vp-c-brand-1)]">{{ expectation ? '期待 ' + expectation + '/10' : '未标注期待值' }}</span>
            </div>

            <h3 class="text-xl font-bold leading-snug tracking-tight text-[var(--vp-c-text-1)] transition-colors duration-300 group-hover:text-[var(--vp-c-brand-1)]">
              {{ post.title }}
            </h3>

            <div v-if="tags.length" class="pointer-events-auto mt-auto flex flex-wrap gap-2">
              <RouterLink
                v-for="tag in tags"
                :key="post.path + '-' + tag"
                :to="tagLink(tag, activeCollection)"
                class="masonry-tag inline-flex items-center rounded-md bg-[var(--vp-c-bg-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--vp-c-text-2)] transition-colors hover:bg-[var(--vp-c-brand-soft)] hover:text-[var(--vp-c-brand-1)]"
                @click.stop
              >
                {{ tag }}
              </RouterLink>
            </div>
          </div>

          <div v-else-if="variant === 'game-log'" class="flex flex-1 flex-col gap-3 p-5">
            <div class="flex items-center justify-between gap-3">
              <h3 class="m-0 text-base font-bold leading-snug text-[var(--vp-c-text-1)] transition-colors duration-300 group-hover:text-[var(--vp-c-brand-1)]">
                {{ gameName }}
              </h3>
              <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold" :class="statusTone(status)">{{ status || '未标注' }}</span>
            </div>

            <p v-if="showTitleInLog" class="line-clamp-1 text-sm text-[var(--vp-c-text-2)]">{{ post.title }}</p>

            <div class="mt-auto text-xs text-[var(--vp-c-text-3)]">{{ date }}</div>

            <div v-if="tags.length" class="pointer-events-auto flex flex-wrap gap-2">
              <RouterLink
                v-for="tag in tags"
                :key="post.path + '-' + tag"
                :to="tagLink(tag, activeCollection)"
                class="masonry-tag inline-flex items-center rounded-md bg-[var(--vp-c-bg-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--vp-c-text-2)] transition-colors hover:bg-[var(--vp-c-brand-soft)] hover:text-[var(--vp-c-brand-1)]"
                @click.stop
              >
                {{ tag }}
              </RouterLink>
            </div>
          </div>

          <div v-else class="flex flex-1 flex-col gap-4 p-6">
            <div class="flex items-center justify-between text-xs font-medium text-[var(--vp-c-text-3)]">
              <span>{{ date }}</span>
              <span class="opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-[var(--vp-c-brand-1)]">查看文章 &rarr;</span>
            </div>

            <h3 class="text-lg font-bold leading-snug tracking-tight text-[var(--vp-c-text-1)] transition-colors duration-300 group-hover:text-[var(--vp-c-brand-1)]">
              {{ post.title }}
            </h3>

            <div v-if="excerpt" class="line-clamp-3 text-sm leading-relaxed text-[var(--vp-c-text-2)] opacity-80">
              {{ excerpt }}
            </div>

            <div v-if="tags.length" class="pointer-events-auto mt-auto flex flex-wrap gap-2 pt-2">
              <RouterLink
                v-for="tag in tags"
                :key="post.path + '-' + tag"
                :to="tagLink(tag, activeCollection)"
                class="masonry-tag inline-flex items-center rounded-md bg-[var(--vp-c-bg-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--vp-c-text-2)] transition-colors hover:bg-[var(--vp-c-brand-soft)] hover:text-[var(--vp-c-brand-1)]"
                @click.stop
              >
                {{ tag }}
              </RouterLink>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--vp-c-divider)] bg-[var(--vp-c-bg-soft)]/50 px-6 py-16 text-center"
    >
      <div class="text-4xl">🍃</div>
      <p class="text-sm font-medium text-[var(--vp-c-text-2)]">暂无符合条件的文章</p>
      <p class="text-xs text-[var(--vp-c-text-3)]">试试切换分类或稍后再来</p>
    </div>
  </section>
</template>

<style scoped>
.masonry-card-link,
.masonry-card-link:hover,
.masonry-card-link:focus,
.masonry-card-link:active {
  text-decoration: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.masonry-tag,
.masonry-tag:hover,
.masonry-tag:focus,
.masonry-tag:active {
  text-decoration: none !important;
  box-shadow: none !important;
  background-image: none !important;
}
</style>
