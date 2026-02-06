<script setup lang="ts">
import { computed } from "vue";
import { withBase } from "vuepress/client";
import { type ThemePostsItem, usePostsData } from "vuepress-theme-plume/client";

const props = withDefaults(
	defineProps<{
		/**
		 * Category path like "demo" or "游戏/Demo体验".
		 * Matches both prefix and suffix of the post's categoryList names.
		 */
		category?: string;
		/** Collection key from postsData, for example "/computer/" or "/games/". */
		collection?: string;
		/** Optional heading rendered above the grid. */
		title?: string;
		/** Max number of posts to render. */
		limit?: number;
	}>(),
	{
		limit: 999,
	},
);

const postsData = usePostsData();

function normalizeSegments(input?: string): string[] {
	return (input ?? "")
		.split("/")
		.map((s) => s.trim())
		.filter(Boolean);
}

function normalizeCollectionPath(input?: string): string {
	const trimmed = (input ?? "").trim();
	if (!trimmed) return "";

	let out = trimmed;
	if (!out.startsWith("/")) out = `/${out}`;
	if (!out.endsWith("/")) out = `${out}/`;
	return out;
}

function matchCategory(post: ThemePostsItem, expected: string[]): boolean {
	if (!expected.length) return true;

	const segs = (post.categoryList ?? []).map((c) => c.name);
	if (!segs.length) return false;

	const prefix = segs.slice(0, expected.length);
	if (prefix.join("/") === expected.join("/")) return true;

	const suffix = segs.slice(-expected.length);
	return suffix.join("/") === expected.join("/");
}

function excerptText(excerpt: string): string {
	const text = excerpt
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (text.length <= 140) return text;
	return `${text.slice(0, 140)}…`;
}

function metaText(post: ThemePostsItem): string {
	const date = post.createTime || "";
	const tags = (post.tags ?? []).slice(0, 4);
	const tagsText = tags.length ? tags.join(" / ") : "";

	return [date, tagsText].filter(Boolean).join(" · ");
}

function tagBasePath(collectionKey: string): string {
	if (collectionKey === "/games/") return "/games/posts/tags/";
	return "/blog/tags/";
}

function tagLink(tag: string, collectionKey: string): string {
	return `${tagBasePath(collectionKey)}?tag=${encodeURIComponent(tag)}`;
}

function setSpotlightPosition(
	el: HTMLElement,
	clientX: number,
	clientY: number,
): void {
	const rect = el.getBoundingClientRect();
	const x = clientX - rect.left;
	const y = clientY - rect.top;
	el.style.setProperty("--spotlight-x", `${x}px`);
	el.style.setProperty("--spotlight-y", `${y}px`);
}

function handleCardMouseMove(event: MouseEvent): void {
	const el = event.currentTarget as HTMLElement | null;
	if (!el) return;

	setSpotlightPosition(el, event.clientX, event.clientY);
}

function handleCardMouseEnter(event: MouseEvent): void {
	const el = event.currentTarget as HTMLElement | null;
	if (!el) return;

	setSpotlightPosition(el, event.clientX, event.clientY);
	el.style.setProperty("--spotlight-opacity", "1");
}

function handleCardMouseLeave(event: MouseEvent): void {
	const el = event.currentTarget as HTMLElement | null;
	if (!el) return;

	el.style.setProperty("--spotlight-opacity", "0");
}

function handleCardFocus(event: FocusEvent): void {
	const el = event.currentTarget as HTMLElement | null;
	if (!el) return;

	const rect = el.getBoundingClientRect();
	el.style.setProperty("--spotlight-x", `${rect.width / 2}px`);
	el.style.setProperty("--spotlight-y", `${rect.height / 2}px`);
	el.style.setProperty("--spotlight-opacity", "1");
}

function handleCardBlur(event: FocusEvent): void {
	const el = event.currentTarget as HTMLElement | null;
	if (!el) return;

	el.style.setProperty("--spotlight-opacity", "0");
}

const categorySegments = computed(() => normalizeSegments(props.category));
const selectedCollection = computed(() =>
	normalizeCollectionPath(props.collection),
);

const activeCollection = computed(() => {
	const collectionKey = selectedCollection.value;
	if (collectionKey) return collectionKey;
	return postsData.value["/computer/"] ? "/computer/" : "/blog/";
});

const allPosts = computed<ThemePostsItem[]>(() => {
	const collectionKey = selectedCollection.value;
	if (collectionKey) return postsData.value[collectionKey] ?? [];

	// Fallback: computer is current default collection, keep '/blog/' for compatibility.
	return postsData.value["/computer/"] ?? postsData.value["/blog/"] ?? [];
});

const filteredPosts = computed(() => {
	const list = allPosts.value
		.filter((p) => !p.draft)
		.filter((p) => matchCategory(p, categorySegments.value));

	return list.slice(0, Math.max(0, props.limit));
});

/* biome-ignore lint/correctness/noUnusedVariables: used in template */
const cards = computed(() => {
	return filteredPosts.value.map((post) => {
		const cover = post.cover;
		const hasCover = !!cover;
		const tags = (post.tags ?? []).slice(0, 3);

		return {
			post,
			hasCover,
			coverSrc: hasCover ? withBase(cover) : "",
			excerpt: post.excerpt ? excerptText(post.excerpt) : "",
			meta: metaText(post),
			date: post.createTime || "",
			tags,
		};
	});
});
</script>

<template>
  <section class="space-y-8">
    <h2 v-if="title" class="flex items-center gap-3 text-2xl font-bold tracking-tight text-[var(--vp-c-text-1)]">
      <span class="h-6 w-1.5 rounded-full bg-gradient-to-b from-[var(--vp-c-brand-1)] to-[var(--vp-c-brand-2)]" />
      {{ title }}
    </h2>

    <div v-if="cards.length" class="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
      <article
        v-for="{ post, hasCover, coverSrc, excerpt, date, tags, meta } in cards"
        :key="post.path"
        class="group relative break-inside-avoid overflow-hidden rounded-[20px] bg-[var(--vp-c-bg)] border border-[var(--vp-c-divider)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]"
        style="--spotlight-x: 50%; --spotlight-y: 50%; --spotlight-opacity: 0;"
        @mousemove="handleCardMouseMove"
        @mouseenter="handleCardMouseEnter"
        @mouseleave="handleCardMouseLeave"
        @focusin="handleCardFocus"
        @focusout="handleCardBlur"
      >
        <div
          class="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-[var(--spotlight-opacity)] transition-opacity duration-500 ease-out"
          style="background: radial-gradient(320px circle at var(--spotlight-x) var(--spotlight-y), color-mix(in srgb, var(--vp-c-brand-1) 24%, transparent), transparent 72%);"
        />
        <div
          class="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100"
          style="background: linear-gradient(180deg, color-mix(in srgb, white 16%, transparent), transparent 24%);"
        />

		<RouterLink
			class="masonry-card-link absolute inset-0 z-[2] rounded-[inherit]"
			:to="post.path"
			:aria-label="`查看文章：${post.title}`"
		/>

		<div class="relative z-[3] flex h-full flex-col pointer-events-none">
	          <div v-if="hasCover" class="relative aspect-[16/9] w-full overflow-hidden rounded-t-[19px]">
	            <img
	              class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              :src="coverSrc"
              :alt="post.title"
              loading="lazy"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>

	          <div class="flex flex-1 flex-col gap-4 p-6">
	            <div class="flex items-center justify-between text-xs font-medium text-[var(--vp-c-text-3)]">
	              <div class="flex items-center gap-2">
	                 <span v-if="date">{{ date }}</span>
                 <span v-else-if="meta">{{ meta }}</span>
              </div>
				<span class="opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-[var(--vp-c-brand-1)]">
					查看文章 &rarr;
				</span>
            </div>

            <h3 class="text-lg font-bold leading-snug tracking-tight text-[var(--vp-c-text-1)] transition-colors duration-300 group-hover:text-[var(--vp-c-brand-1)]">
              {{ post.title }}
            </h3>

            <div
              v-if="excerpt"
              class="line-clamp-3 text-sm leading-relaxed text-[var(--vp-c-text-2)] opacity-80"
            >
              {{ excerpt }}
            </div>

	            <div v-if="tags.length" class="pointer-events-auto mt-auto flex flex-wrap gap-2 pt-2">
	              <RouterLink
	                v-for="tag in tags"
	                :key="`${post.path}-${tag}`"
	                :to="tagLink(tag, activeCollection)"
	                class="masonry-tag inline-flex items-center rounded-md bg-[var(--vp-c-bg-soft)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--vp-c-text-2)] transition-colors hover:bg-[var(--vp-c-brand-soft)] hover:text-[var(--vp-c-brand-1)]"
	                @click.stop
	              >
	                {{ tag }}
	              </RouterLink>
	            </div>
	          </div>
	        </div>
	      </article>
	    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--vp-c-divider)] bg-[var(--vp-c-bg-soft)]/50 px-6 py-16 text-center"
    >
      <div class="text-4xl">🍃</div>
      <p class="text-sm font-medium text-[var(--vp-c-text-2)]">
        暂无符合条件的文章
      </p>
		<p class="text-xs text-[var(--vp-c-text-3)]">
			试试切换分类或稍后再来
		</p>
	</div>
  </section>
</template>

<style scoped>
.masonry-card-link,
.masonry-card-link:hover,
.masonry-card-link:focus,
.masonry-card-link:active {
	text-decoration: none !important;
	box-shadow: none !important;
	background-image: none !important;
}

.masonry-tag,
.masonry-tag:hover,
.masonry-tag:focus,
.masonry-tag:active {
	text-decoration: none !important;
	box-shadow: none !important;
	background-image: none !important;
}
</style>
