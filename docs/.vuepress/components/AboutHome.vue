<script setup lang="ts">
/* biome-ignore lint/correctness/noUnusedVariables: used in template */
const avatarUrl = 'https://avatars.githubusercontent.com/u/61224072?v=4'
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
    <section class="flex flex-col gap-3 lg:sticky lg:top-24">
      <img
        class="h-48 w-48 rounded-2xl border bg-[var(--vp-c-bg-soft)] [border-color:var(--vp-c-divider)]"
        :src="avatarUrl"
        alt="avatar"
      >

      <h1 class="m-0 text-2xl font-extrabold">Sworld</h1>
      <p class="m-0 leading-relaxed text-[var(--vp-c-text-2)]">
        The only way to do great work is to love what you do.
      </p>

      <div class="flex flex-wrap gap-2">
        <a
          class="inline-flex items-center gap-1 rounded-full border bg-[var(--vp-c-bg-soft)] px-3 py-1.5 text-sm no-underline [border-color:var(--vp-c-divider)] [color:var(--vp-c-text-1)]"
          href="https://github.com/mcthesw"
          target="_blank"
          rel="noopener noreferrer"
        >GitHub</a>
        <a
          class="inline-flex items-center gap-1 rounded-full border bg-[var(--vp-c-bg-soft)] px-3 py-1.5 text-sm no-underline [border-color:var(--vp-c-divider)] [color:var(--vp-c-text-1)]"
          href="mailto:t.sworld@qq.com"
        >Email</a>
      </div>

      <div class="mt-2 border-t pt-3 [border-color:var(--vp-c-divider)]">
        <div class="flex flex-wrap items-center gap-2">
          <a
            class="inline-flex items-center gap-1 rounded-full border bg-[var(--vp-c-bg-soft)] px-3 py-1.5 text-sm no-underline [border-color:var(--vp-c-divider)] [color:var(--vp-c-text-1)]"
            href="https://afdian.com/a/Sworld"
            target="_blank"
            rel="noopener noreferrer"
          >爱发电</a>

          <div class="group relative">
            <a
              class="inline-flex items-center gap-1 rounded-full border bg-[var(--vp-c-bg-soft)] px-3 py-1.5 text-sm no-underline [border-color:var(--vp-c-divider)] [color:var(--vp-c-text-1)]"
              href="/images/sponsor_wechat.png"
              target="_blank"
              rel="noopener noreferrer"
            >赞赏码</a>

            <div class="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-72 -translate-x-1/2 rounded-xl border bg-[var(--vp-c-bg)] p-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [border-color:var(--vp-c-divider)]">
              <img
                class="w-full rounded-lg"
                src="/images/sponsor_wechat.png"
                alt="赞赏码"
                loading="lazy"
              >
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="grid grid-cols-3 gap-3">
        <a class="aspect-square flex items-center justify-center rounded-xl border bg-[var(--vp-c-bg-soft)] p-2 text-center no-underline [border-color:var(--vp-c-divider)] [color:var(--vp-c-text-1)]" href="/computer/">计算机</a>
        <a class="aspect-square flex items-center justify-center rounded-xl border bg-[var(--vp-c-bg-soft)] p-2 text-center no-underline [border-color:var(--vp-c-divider)] [color:var(--vp-c-text-1)]" href="/games/">游戏</a>
        <a class="aspect-square flex items-center justify-center rounded-xl border bg-[var(--vp-c-bg-soft)] p-2 text-center no-underline [border-color:var(--vp-c-divider)] [color:var(--vp-c-text-1)]" href="/misc/">杂项</a>
        <a class="aspect-square flex items-center justify-center rounded-xl border bg-[var(--vp-c-bg-soft)] p-2 text-center no-underline [border-color:var(--vp-c-divider)] [color:var(--vp-c-text-1)]" href="/blog/tags/">标签</a>
        <a class="aspect-square flex items-center justify-center rounded-xl border bg-[var(--vp-c-bg-soft)] p-2 text-center no-underline [border-color:var(--vp-c-divider)] [color:var(--vp-c-text-1)]" href="/blog/">全部文章</a>
        <div class="aspect-square flex items-center justify-center rounded-xl border bg-[var(--vp-c-bg-soft)] p-2 text-center [border-color:var(--vp-c-divider)]">占位符 A</div>
        <div class="aspect-square flex items-center justify-center rounded-xl border bg-[var(--vp-c-bg-soft)] p-2 text-center [border-color:var(--vp-c-divider)]">占位符 B</div>
        <div class="aspect-square flex items-center justify-center rounded-xl border bg-[var(--vp-c-bg-soft)] p-2 text-center [border-color:var(--vp-c-divider)]">占位符 C</div>
        <div class="aspect-square flex items-center justify-center rounded-xl border bg-[var(--vp-c-bg-soft)] p-2 text-center [border-color:var(--vp-c-divider)]">占位符 D</div>
      </div>
    </section>
  </div>
</template>
