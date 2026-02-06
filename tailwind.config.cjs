/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './docs/**/*.{md,vue,js,ts}',
    './docs/.vuepress/**/*.{vue,js,ts}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  corePlugins: {
    // Theme Plume already defines base styles; avoid Tailwind reset.
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
