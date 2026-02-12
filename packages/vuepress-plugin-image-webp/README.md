# @sworld/vuepress-plugin-image-webp

Workspace-local VuePress plugin used in this repo.

Build-time behavior:

- Collect markdown/frontmatter image rewrite rules from source files
- Convert dist `.png/.jpg/.jpeg` files to `.webp`
- Rewrite references in dist text assets (`html/js/css/json/xml/txt/webmanifest`)
- Prune original files when safe (`keepOriginalInDist: false`)
- Cache converted files by `mtime + size + quality`

It never writes back to markdown/source images in `docs/`.
