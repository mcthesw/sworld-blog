<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id?: string
  book: string
  author?: string
  year?: string
  kind?: string
  status?: string
  date?: string
  progress?: string
  tags?: string
  review?: string
  anki?: string
  telegram?: string
}>()

const tagList = computed(() => {
  return (props.tags ?? '')
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
})

const statusClass = computed(() => {
  const status = props.status?.trim()
  if (status === '读完') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
  if (status === '在读') return 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
  if (status === '暂停') return 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
  if (status === '想读') return 'bg-violet-500/15 text-violet-600 dark:text-violet-300'
  if (status === '放弃') return 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
  return 'bg-[var(--vp-c-bg-soft)] text-[var(--vp-c-text-2)]'
})

const links = computed(() => {
  const out: Array<{ label: string, href: string, external: boolean }> = []
  if (props.review) out.push({ label: '长文', href: props.review, external: false })
  if (props.anki) out.push({ label: 'Anki', href: props.anki, external: true })
  if (props.telegram) out.push({ label: 'Telegram', href: props.telegram, external: true })
  return out
})
</script>

<template>
  <article
    :id="id"
    class="reading-note rounded-lg border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg)] p-5 transition-[border-color,box-shadow] duration-300"
  >
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 space-y-2">
        <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--vp-c-text-3)]">
          <span v-if="date">{{ date }}</span>
          <span v-if="kind" class="rounded-md bg-[var(--vp-c-bg-soft)] px-2 py-0.5">{{ kind }}</span>
          <span v-if="year" class="rounded-md bg-[var(--vp-c-bg-soft)] px-2 py-0.5">年份 {{ year }}</span>
          <span v-if="progress" class="rounded-md bg-[var(--vp-c-bg-soft)] px-2 py-0.5">{{ progress }}</span>
        </div>
        <h3 class="m-0 text-lg font-bold leading-snug text-[var(--vp-c-text-1)]">「{{ book }}」</h3>
        <p v-if="author" class="m-0 text-sm text-[var(--vp-c-text-2)]">{{ author }}</p>
      </div>

      <span class="inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-bold" :class="statusClass">
        {{ status || '随读' }}
      </span>
    </header>

    <div class="reading-note-body mt-4 text-sm leading-7 text-[var(--vp-c-text-1)]">
      <slot />
    </div>

    <footer v-if="tagList.length || links.length" class="mt-5 flex flex-wrap items-center gap-2">
      <span
        v-for="tag in tagList"
        :key="tag"
        class="rounded-md bg-[var(--vp-c-bg-soft)] px-2 py-1 text-xs font-semibold text-[var(--vp-c-text-2)]"
      >
        {{ tag }}
      </span>

      <a
        v-for="link in links"
        :key="link.label"
        class="reading-note-link rounded-md border border-[var(--vp-c-divider)] px-2 py-1 text-xs font-bold text-[var(--vp-c-brand-1)] transition-colors hover:border-[var(--vp-c-brand-1)] hover:bg-[var(--vp-c-brand-soft)]"
        :href="link.href"
        :target="link.external ? '_blank' : undefined"
        :rel="link.external ? 'noreferrer' : undefined"
      >
        {{ link.label }}
      </a>
    </footer>
  </article>
</template>

<style scoped>
.reading-note {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 1px 4px -2px rgba(0, 0, 0, 0.08);
}

.reading-note:hover,
.reading-note:focus-within {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 24%, var(--vp-c-divider));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 8px 22px -14px color-mix(in srgb, var(--vp-c-brand-1) 32%, transparent);
}

.reading-note-body :deep(p) {
  margin: 0;
}

.reading-note-body :deep(p + p) {
  margin-top: 0.75rem;
}

.reading-note-link,
.reading-note-link:hover,
.reading-note-link:focus,
.reading-note-link:active {
  text-decoration: none !important;
  box-shadow: none !important;
  background-image: none !important;
}
</style>
