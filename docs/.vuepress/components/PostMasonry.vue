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
    /** Max number of posts to render. */
    limit?: number
  }>(),
  {
    limit: 999,
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
    const cover = post.cover
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
</script>

<template>
  <section>
    <h2 v-if="title" class="mb-3 text-lg font-bold">
      {{ title }}
    </h2>

    <div class="columns-1 gap-x-4 md:columns-2 lg:columns-3">
      <article
        v-for="{ post, hasCover, coverSrc, excerpt, meta } in cards"
        :key="post.path"
        class="mb-4 inline-block w-full break-inside-avoid rounded-xl border shadow-sm [border-color:var(--vp-c-divider)]"
        :class="[
          hasCover ? 'bg-[var(--vp-c-bg)]' : 'bg-gradient-to-b from-[var(--vp-c-bg-soft)] to-[var(--vp-c-bg)]',
        ]"
      >
        <RouterLink class="block no-underline [color:inherit]" :to="post.path">
          <div v-if="hasCover" class="aspect-video bg-[var(--vp-c-bg-soft)]">
            <img
              class="h-full w-full object-cover"
              :src="coverSrc"
              :alt="post.title"
              loading="lazy"
            >
          </div>
          <div class="px-3 py-3">
            <div class="text-sm font-semibold leading-5">
              {{ post.title }}
            </div>
            <div v-if="meta" class="mt-2 text-xs leading-5 text-[var(--vp-c-text-3)]">
              {{ meta }}
            </div>
            <div v-if="excerpt" class="mt-2 text-xs leading-5 text-[var(--vp-c-text-2)]">
              {{ excerpt }}
            </div>
          </div>
        </RouterLink>
      </article>
    </div>
  </section>
</template>
