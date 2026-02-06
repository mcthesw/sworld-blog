<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vuepress/client'
import { usePostsData } from 'vuepress-theme-plume/client'
import type { ThemePostsItem } from 'vuepress-theme-plume/client'

const props = withDefaults(
  defineProps<{
    /**
     * Category path like "游戏/Demo体验".
     * Matches both prefix and suffix of the post's categoryList names.
     */
    category?: string
    /** Optional heading rendered above the grid. */
    title?: string
    /** Card masonry columns. */
    cols?: number | { sm?: number, md?: number, lg?: number }
    /** Grid gap in px. */
    gap?: number
    /** Max number of posts to render. */
    limit?: number
    /** Fallback cover image when post.cover is empty. */
    coverFallback?: string
  }>(),
  {
    cols: () => ({ sm: 1, md: 2, lg: 3 }),
    gap: 16,
    limit: 999,
    coverFallback: '',
  },
)

const postsData = usePostsData()

function normalizeSegments(input?: string): string[] {
  return (input ?? '')
    .split('/')
    .map(s => s.trim())
    .filter(Boolean)
}

function matchCategory(post: ThemePostsItem, expected: string[]): boolean {
  if (!expected.length)
    return true

  const segs = (post.categoryList ?? []).map(c => c.name)
  if (!segs.length)
    return false

  const prefix = segs.slice(0, expected.length)
  if (prefix.join('/') === expected.join('/'))
    return true

  const suffix = segs.slice(-expected.length)
  return suffix.join('/') === expected.join('/')
}

function excerptText(excerpt: string): string {
  const text = excerpt
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= 140)
    return text
  return `${text.slice(0, 140)}…`
}

function metaText(post: ThemePostsItem): string {
  const date = post.createTime || ''
  const tags = (post.tags ?? []).slice(0, 4)
  const tagsText = tags.length ? tags.join(' / ') : ''

  return [date, tagsText].filter(Boolean).join(' · ')
}

const categorySegments = computed(() => normalizeSegments(props.category))

const allPosts = computed<ThemePostsItem[]>(() => {
  // Current site uses a single post collection with link '/blog/'.
  // We read that collection directly to avoid depending on current route context.
  return postsData.value['/blog/'] ?? []
})

const filteredPosts = computed(() => {
  const list = allPosts.value
    .filter(p => !p.draft)
    .filter(p => matchCategory(p, categorySegments.value))

  return list.slice(0, Math.max(0, props.limit))
})

/* biome-ignore lint/correctness/noUnusedVariables: used in template */
const cards = computed(() => {
  return filteredPosts.value.map((post) => {
    const cover = post.cover || props.coverFallback
    const hasCover = !!cover
    return {
      post,
      hasCover,
      coverSrc: hasCover ? withBase(cover) : '',
      excerpt: post.excerpt ? excerptText(post.excerpt) : '',
      meta: metaText(post),
    }
  })
})

const colsResolved = computed(() => {
  if (typeof props.cols === 'number') {
    const n = Math.max(1, Number(props.cols))
    return { sm: n, md: n, lg: n }
  }

  const c = props.cols ?? {}
  return {
    sm: Math.max(1, Number(c.sm ?? 1)),
    md: Math.max(1, Number(c.md ?? 2)),
    lg: Math.max(1, Number(c.lg ?? 3)),
  }
})

/* biome-ignore lint/correctness/noUnusedVariables: used in template */
const masonryStyle = computed(() => ({
  '--sw-masonry-gap': `${props.gap}px`,
  '--sw-masonry-cols-sm': String(colsResolved.value.sm),
  '--sw-masonry-cols-md': String(colsResolved.value.md),
  '--sw-masonry-cols-lg': String(colsResolved.value.lg),
}))
</script>

<template>
  <section class="sw-post-masonry">
    <h2 v-if="title" class="sw-post-masonry-title">
      {{ title }}
    </h2>

    <div class="sw-masonry" :style="masonryStyle">
      <article
        v-for="{ post, hasCover, coverSrc, excerpt, meta } in cards"
        :key="post.path"
        class="sw-post-card sw-masonry-item"
        :class="{ 'no-cover': !hasCover }"
      >
        <RouterLink class="sw-post-card-link" :to="post.path">
          <div v-if="hasCover" class="sw-post-card-cover">
            <img
              :src="coverSrc"
              :alt="post.title"
              loading="lazy"
            >
          </div>
          <div class="sw-post-card-body">
            <div class="sw-post-card-title">
              {{ post.title }}
            </div>
            <div v-if="meta" class="sw-post-card-meta">
              {{ meta }}
            </div>
            <div v-if="excerpt" class="sw-post-card-excerpt">
              {{ excerpt }}
            </div>
          </div>
        </RouterLink>
      </article>
    </div>
  </section>
</template>

<style scoped>
.sw-post-masonry-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
}

.sw-masonry {
  column-gap: var(--sw-masonry-gap);
  column-count: var(--sw-masonry-cols-sm);
}

@media (min-width: 640px) {
  .sw-masonry {
    column-count: var(--sw-masonry-cols-md);
  }
}

@media (min-width: 960px) {
  .sw-masonry {
    column-count: var(--sw-masonry-cols-lg);
  }
}

.sw-masonry-item {
  display: inline-block;
  width: 100%;
  margin: 0 0 var(--sw-masonry-gap);
  break-inside: avoid;
}

.sw-post-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-1);
  overflow: hidden;
}

.sw-post-card.no-cover {
  background: linear-gradient(180deg, var(--vp-c-bg-soft), var(--vp-c-bg));
}

.sw-post-card-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.sw-post-card-cover {
  aspect-ratio: 16 / 9;
  background: var(--vp-c-bg-soft);
}

.sw-post-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sw-post-card-body {
  padding: 12px 12px 14px;
}

.sw-post-card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.sw-post-card-meta {
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
  color: var(--vp-c-text-3);
}

.sw-post-card-excerpt {
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
  color: var(--vp-c-text-2);
}
</style>
