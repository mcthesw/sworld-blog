<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const categories = [
  { label: 'Demo 体验', desc: '上手体验速报', path: '/games/demo/', icon: '🕹️' },
  { label: '长评', desc: '深度游戏评测', path: '/games/review/', icon: '✍️' },
  { label: '游玩记录', desc: '通关 / 搁置 / 在玩', path: '/games/clear/', icon: '📋' },
]

const isHub = computed(() => {
  const p = route.path
  return p === '/games/' || p === '/games'
})

function isActive(path: string): boolean {
  const p = route.path
  return p === path || p === path.replace(/\/$/, '') || p.startsWith(path)
}
</script>

<template>
  <nav class="my-5">
    <RouterLink
      v-if="!isHub"
      to="/games/"
      class="game-nav-back mb-3 inline-flex items-center gap-1 text-sm text-[var(--vp-c-text-2)] no-underline transition-colors duration-150 hover:text-[var(--vp-c-brand-1)]"
    >
      <span aria-hidden="true">←</span>
      游戏偏好
    </RouterLink>

    <div class="flex flex-col gap-2.5 sm:flex-row">
      <RouterLink
        v-for="cat in categories"
        :key="cat.path"
        :to="cat.path"
        class="game-nav-item flex flex-1 flex-col gap-1 rounded-xl border px-4 py-2.5 no-underline transition-all duration-200"
        :class="isActive(cat.path)
          ? 'active border-[var(--vp-c-brand-1)] bg-[var(--vp-c-brand-soft)]'
          : 'border-[var(--vp-c-divider)] bg-[var(--vp-c-bg-soft)]'"
      >
        <span class="flex items-center gap-1.5">
          <span class="text-base leading-none">{{ cat.icon }}</span>
          <span
            class="text-sm font-semibold leading-snug"
            :class="isActive(cat.path) ? 'text-[var(--vp-c-brand-1)]' : 'text-[var(--vp-c-text-1)]'"
          >{{ cat.label }}</span>
        </span>
        <span class="text-xs leading-relaxed text-[var(--vp-c-text-3)]">{{ cat.desc }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.game-nav-back,
.game-nav-back:hover,
.game-nav-back:active,
.game-nav-back:focus {
  text-decoration: none !important;
  background-image: none !important;
}

.game-nav-item,
.game-nav-item:hover,
.game-nav-item:active,
.game-nav-item:focus {
  text-decoration: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.game-nav-item:not(.active):hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 40%, var(--vp-c-divider));
  background-color: color-mix(in srgb, var(--vp-c-brand-1) 4%, var(--vp-c-bg-soft));
}
</style>
