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
    coverFallback: '/images/placeholders/cover.svg',
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
    return {
      post,
      coverSrc: withBase(cover),
      excerpt: post.excerpt ? excerptText(post.excerpt) : '',
    }
  })
})
</script>

<template>
  <section class="sw-post-masonry">
    <h2 v-if="title" class="sw-post-masonry-title">
      {{ title }}
    </h2>

    <CardMasonry :cols="cols" :gap="gap">
      <article v-for="{ post, coverSrc, excerpt } in cards" :key="post.path" class="sw-post-card">
        <RouterLink class="sw-post-card-link" :to="post.path">
          <div class="sw-post-card-cover">
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
            <div v-if="excerpt" class="sw-post-card-excerpt">
              {{ excerpt }}
            </div>
          </div>
        </RouterLink>
      </article>
    </CardMasonry>
  </section>
</template>

<style scoped>
.sw-post-masonry-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
}

.sw-post-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-1);
  overflow: hidden;
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

.sw-post-card-excerpt {
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
  color: var(--vp-c-text-2);
}
</style>
