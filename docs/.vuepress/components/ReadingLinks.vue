<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title?: string
  description?: string
  stream?: string
  review?: string
  anki?: string
  telegram?: string
  image?: string
}>()

const links = computed(() => {
  const out: Array<{ label: string, href: string, external: boolean }> = []
  if (props.stream) out.push({ label: '随读记录', href: props.stream, external: false })
  if (props.review) out.push({ label: '长文', href: props.review, external: false })
  if (props.anki) out.push({ label: 'Anki 卡片', href: props.anki, external: true })
  if (props.telegram) out.push({ label: 'Telegram', href: props.telegram, external: true })
  return out
})
</script>

<template>
  <section v-if="links.length" class="reading-links rounded-lg border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg-soft)] p-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <img v-if="image" class="h-20 w-20 rounded-md object-cover" :src="image" :alt="title || 'reading links'">

      <div class="min-w-0 flex-1">
        <p class="m-0 text-sm font-bold text-[var(--vp-c-text-1)]">{{ title || '相关链接' }}</p>
        <p v-if="description" class="m-0 mt-1 text-sm leading-6 text-[var(--vp-c-text-2)]">{{ description }}</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <a
            v-for="link in links"
            :key="link.label"
            class="reading-links-anchor rounded-md bg-[var(--vp-c-bg)] px-3 py-1.5 text-sm font-bold text-[var(--vp-c-brand-1)] transition-colors hover:bg-[var(--vp-c-brand-soft)]"
            :href="link.href"
            :target="link.external ? '_blank' : undefined"
            :rel="link.external ? 'noreferrer' : undefined"
          >
            {{ link.label }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reading-links-anchor,
.reading-links-anchor:hover,
.reading-links-anchor:focus,
.reading-links-anchor:active {
  text-decoration: none !important;
  box-shadow: none !important;
  background-image: none !important;
}
</style>
