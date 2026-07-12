// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
//
// `site` is the public origin used by Layout.astro to build absolute
// og:image and og:url meta tags. The repo is published as the user site
// at https://ntworm.github.io (no path prefix needed).
// Update to `https://gabrielworm.com` when the custom domain is wired up.
export default defineConfig({
  site: 'https://ntworm.github.io',
});