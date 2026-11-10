import { defineConfig } from 'astro/config';

// On GitHub Pages the deploy workflow sets these two, so the same code works
// for both https://<user>.github.io/ and https://<user>.github.io/<repo>/.
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  markdown: {
    shikiConfig: { theme: 'vitesse-dark', wrap: false },
  },
});
