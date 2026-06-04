# Image WebP Workflow

This repository keeps visitor-facing images under `docs/` but avoids committing
large PNG/JPEG sources when WebP is materially smaller.

## Pre-Commit Behavior

The pre-commit hook runs:

```bash
pnpm exec tsc -p scripts/tsconfig.json
node .local/scripts/image-webp.js --staged --stage
node .local/scripts/privacy-guard.js --staged
```

`image-webp.js --staged --stage` checks staged `docs/**/*.png`,
`docs/**/*.jpg`, and `docs/**/*.jpeg` files, excluding `docs/.vuepress/**` and
`.local/**`.

For each eligible image, it converts the file to WebP with `sharp` at quality
82. The source image is replaced only when the WebP output is smaller by at
least 128 KiB. When a replacement happens, the script also updates Markdown
image references and frontmatter `cover:` values that point to the image.

The hook stages the generated `.webp`, the rewritten Markdown files, and the
source image deletion. Review the final staged diff before committing.

## Manual Commands

Use these commands to optimize staged images exactly as the hook does:

```bash
pnpm exec tsc -p scripts/tsconfig.json
node .local/scripts/image-webp.js --staged --stage
```

Use this command to optimize all tracked source images under `docs/` without
automatically staging the result:

```bash
pnpm exec tsc -p scripts/tsconfig.json
node .local/scripts/image-webp.js --all
```

Run the script test after changing the optimizer:

```bash
pnpm exec tsc -p scripts/tsconfig.json
node --test scripts/image-webp.test.mjs
```

Run the site build after a bulk image migration:

```bash
pnpm build
```
