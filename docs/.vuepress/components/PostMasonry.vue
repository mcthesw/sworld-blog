<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vuepress/client'
import { usePostsData } from 'vuepress-theme-plume/client'
import type { ThemePostsItem } from 'vuepress-theme-plume/client'

const props = withDefaults(
  defineProps<{
    /**
     * Category path like "demo" or "游戏/Demo体验".
     * Matches both prefix and suffix of the post's categoryList names.
     */
    category?: string
    /** Collection key from postsData, for example "/computer/" or "/games/". */
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

function normalizeSegments(input?: string): string[] {
  return (input ?? '')
    .split('/')
    .map(s => s.trim())
    .filter(Boolean)
}

function normalizeCollectionPath(input?: string): string {
  const trimmed = (input ?? '').trim()
  if (!trimmed)
    return ''

  let out = trimmed
  if (!out.startsWith('/'))
    out = `/${out}`
  if (!out.endsWith('/'))
    out = `${out}/`
  return out
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
const selectedCollection = computed(() => normalizeCollectionPath(props.collection))

const allPosts = computed<ThemePostsItem[]>(() => {
  const collectionKey = selectedCollection.value
  if (collectionKey)
    return postsData.value[collectionKey] ?? []

  // Fallback: computer is current default collection, keep '/blog/' for compatibility.
  return postsData.value['/computer/'] ?? postsData.value['/blog/'] ?? []
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
    <h2 v-if="title" class="mb-6 text-xl font-bold tracking-tight text-[var(--vp-c-text-1)]">
      {{ title }}
    </h2>

    <div class="columns-1 md:columns-2 lg:columns-3 [column-gap:1.5rem]">
      <article
        v-for="{ post, hasCover, coverSrc, excerpt, meta } in cards"
        :key="post.path"
        class="group mb-6 break-inside-avoid overflow-hidden rounded-2xl border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <RouterLink class="block h-full no-underline [color:inherit]" :to="post.path">
          <div v-if="hasCover" class="aspect-[16/9] w-full overflow-hidden bg-[var(--vp-c-bg-soft)]">
            <img
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              :src="coverSrc"
              :alt="post.title"
              loading="lazy"
            >
          </div>
          <div class="flex flex-col p-5">
            <h3 class="text-base font-bold leading-snug tracking-tight text-[var(--vp-c-text-1)] transition-colors duration-200 group-hover:text-[var(--vp-c-brand-1)]">
              {{ post.title }}
            </h3>

            <div v-if="meta" class="mt-2 text-xs font-medium leading-5 text-[var(--vp-c-text-3)]">
              {{ meta }}
            </div>

            <div
              v-if="excerpt"
              class="mt-3 overflow-hidden text-sm leading-relaxed text-[var(--vp-c-text-2)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
            >
              {{ excerpt }}
            </div>
          </div>
        </RouterLink>
      </article>
    </div>
  </section>
</template>
