import { defineConfig } from 'astro/config';

// Static output (the default). Builds to plain HTML/CSS/JS in `dist/`,
// which can be hosted for free on GitHub Pages, Netlify, or Cloudflare Pages.
//
// `site` is used to generate absolute URLs (e.g. for sharing individual pieces).
// Update it to the real domain at deploy time.
export default defineConfig({
  site: 'https://robertpotts.example',
});
