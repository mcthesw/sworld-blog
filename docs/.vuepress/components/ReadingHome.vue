<script setup lang="ts">
import { Comment, Text, computed, useSlots } from 'vue'

const slots = useSlots()

const hasIntro = computed(() => {
  return slots.default?.().some((node) => {
    if (node.type === Comment) return false
    if (node.type === Text && typeof node.children === 'string') return node.children.trim().length > 0
    return true
  }) ?? false
})
</script>

<template>
  <section class="reading-home space-y-8">
    <div class="space-y-4">
      <h1 class="m-0 text-4xl font-bold leading-tight text-[var(--vp-c-text-1)] md:text-5xl">阅读</h1>
      <div v-if="hasIntro" class="reading-home-intro max-w-3xl text-base leading-8 text-[var(--vp-c-text-2)]">
        <slot />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <RouterLink
        to="/reading/stream/"
        class="reading-home-link group rounded-lg border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg)] p-5 transition-[border-color,box-shadow] duration-300 hover:border-[var(--vp-c-brand-1)]"
      >
        <span class="block text-xl font-bold text-[var(--vp-c-text-1)] group-hover:text-[var(--vp-c-brand-1)]">随读流</span>
        <span class="mt-2 block text-sm leading-6 text-[var(--vp-c-text-2)]">
          零散片段、临时想法和正在读的作品。
        </span>
      </RouterLink>

      <RouterLink
        to="/reading/reviews/"
        class="reading-home-link group rounded-lg border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg)] p-5 transition-[border-color,box-shadow] duration-300 hover:border-[var(--vp-c-brand-1)]"
      >
        <span class="block text-xl font-bold text-[var(--vp-c-text-1)] group-hover:text-[var(--vp-c-brand-1)]">读后长文</span>
        <span class="mt-2 block text-sm leading-6 text-[var(--vp-c-text-2)]">
          读完后留下的整理、感想和复盘。
        </span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.reading-home-link,
.reading-home-link:hover,
.reading-home-link:focus,
.reading-home-link:active {
  text-decoration: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.reading-home-link {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 1px 4px -2px rgba(0, 0, 0, 0.08);
}

.reading-home-link:hover,
.reading-home-link:focus-visible {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 8px 24px -12px color-mix(in srgb, var(--vp-c-brand-1) 30%, transparent);
}

.reading-home-intro :deep(p) {
  margin: 0;
}

.reading-home-intro :deep(p + p) {
  margin-top: 0.75rem;
}
</style>
