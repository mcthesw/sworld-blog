<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {},
)
</script>

<template>
  <section class="reading-stream space-y-5">
    <div v-if="title || description" class="space-y-2">
      <h2 v-if="title" class="m-0 text-2xl font-bold text-[var(--vp-c-text-1)]">{{ title }}</h2>
      <p v-if="description" class="m-0 text-sm leading-7 text-[var(--vp-c-text-2)]">{{ description }}</p>
    </div>

    <div class="space-y-4">
      <slot />
    </div>
  </section>
</template>
