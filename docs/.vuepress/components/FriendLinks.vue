<script setup lang="ts">
import { usePageFrontmatter } from 'vuepress/client'
import { computed, ref } from 'vue'

interface FriendLink {
  name: string
  url: string
  avatar?: string
  description?: string
}

const frontmatter = usePageFrontmatter<{ links?: FriendLink[] }>()
const links = computed(() => frontmatter.value.links ?? [])

const brokenAvatars = ref(new Set<string>())

/* biome-ignore lint/correctness/noUnusedVariables: used in template */
function showAvatar(link: FriendLink): boolean {
  return !!link.avatar && !brokenAvatars.value.has(link.avatar)
}

/* biome-ignore lint/correctness/noUnusedVariables: used in template */
function onAvatarError(url: string): void {
  brokenAvatars.value = new Set([...brokenAvatars.value, url])
}

function setSpotlight(el: HTMLElement, x: number, y: number): void {
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--spotlight-x', (x - rect.left) + 'px')
  el.style.setProperty('--spotlight-y', (y - rect.top) + 'px')
}

/* biome-ignore lint/correctness/noUnusedVariables: used in template */
function onMouseMove(e: MouseEvent): void {
  const el = e.currentTarget as HTMLElement
  if (el) setSpotlight(el, e.clientX, e.clientY)
}

/* biome-ignore lint/correctness/noUnusedVariables: used in template */
function onMouseEnter(e: MouseEvent): void {
  const el = e.currentTarget as HTMLElement
  if (!el) return
  setSpotlight(el, e.clientX, e.clientY)
  el.style.setProperty('--spotlight-opacity', '1')
}

/* biome-ignore lint/correctness/noUnusedVariables: used in template */
function onMouseLeave(e: MouseEvent): void {
  const el = e.currentTarget as HTMLElement
  if (el) el.style.setProperty('--spotlight-opacity', '0')
}
</script>

<template>
  <div class="space-y-8">
    <p class="m-0 text-sm leading-relaxed text-[var(--vp-c-text-2)]">
      厉害的人们
    </p>

    <div v-if="links.length" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <a
        v-for="link in links"
        :key="link.url"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="friend-link group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-[var(--vp-c-bg)] p-5 no-underline transition-all duration-500 [border-color:var(--vp-c-divider)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.08)]"
        style="--spotlight-x: 50%; --spotlight-y: 50%; --spotlight-opacity: 0;"
        @mousemove="onMouseMove"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
      >
        <!-- Spotlight -->
        <div
          class="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-[var(--spotlight-opacity)] transition-opacity duration-500"
          style="background: radial-gradient(240px circle at var(--spotlight-x) var(--spotlight-y), color-mix(in srgb, var(--vp-c-brand-1) 16%, transparent), transparent 72%);"
        />

        <!-- Avatar -->
        <div class="relative z-[2] h-12 w-12 flex-shrink-0">
          <img
            v-if="showAvatar(link)"
            :src="link.avatar"
            :alt="link.name"
            class="h-12 w-12 rounded-xl border bg-[var(--vp-c-bg-soft)] object-cover [border-color:var(--vp-c-divider)]"
            loading="lazy"
            @error="onAvatarError(link.avatar!)"
          >
          <div
            v-else
            class="flex h-12 w-12 items-center justify-center rounded-xl border bg-[var(--vp-c-brand-soft)] text-base font-bold text-[var(--vp-c-brand-1)] [border-color:var(--vp-c-divider)]"
          >
            {{ link.name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- Text -->
        <div class="relative z-[2] min-w-0 flex-1">
          <h3 class="m-0 truncate text-sm font-semibold text-[var(--vp-c-text-1)] transition-colors duration-300 group-hover:text-[var(--vp-c-brand-1)]">
            {{ link.name }}
          </h3>
          <p v-if="link.description" class="m-0 mt-1 truncate text-xs leading-relaxed text-[var(--vp-c-text-3)]">
            {{ link.description }}
          </p>
        </div>

        <!-- Arrow -->
        <span class="relative z-[2] flex-shrink-0 text-xs text-[var(--vp-c-text-3)] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-[var(--vp-c-brand-1)]">
          &#8599;
        </span>
      </a>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center [border-color:var(--vp-c-divider)]"
    >
      <p class="text-sm font-medium text-[var(--vp-c-text-2)]">暂无友链</p>
    </div>
  </div>
</template>

<style scoped>
.friend-link,
.friend-link:hover,
.friend-link:focus,
.friend-link:active {
  text-decoration: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.friend-link:hover {
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.08) !important;
}
</style>
