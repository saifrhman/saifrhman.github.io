// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** @param {string} pkg @param {string} file */
const fontFile = (pkg, file) => `./node_modules/${pkg}/files/${file}`;

export default defineConfig({
  site: 'https://saifrhman.github.io',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [sitemap()],
  vite: {
    // three.js is loaded lazily as its own chunk (~130 kB gzipped) for the hero figure.
    build: { chunkSizeWarningLimit: 600 },
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Newsreader',
      cssVariable: '--font-newsreader',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          {
            src: [fontFile('@fontsource-variable/newsreader', 'newsreader-latin-wght-normal.woff2')],
            weight: '200 800',
            style: 'normal',
          },
          {
            // Italic is used for one line per page, so a static 400 file is enough.
            src: [fontFile('@fontsource/newsreader', 'newsreader-latin-400-italic.woff2')],
            weight: 400,
            style: 'italic',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Sans',
      cssVariable: '--font-plex-sans',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: [fontFile('@fontsource-variable/ibm-plex-sans', 'ibm-plex-sans-latin-wght-normal.woff2')],
            weight: '100 700',
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
      fallbacks: ['ui-monospace', 'monospace'],
      options: {
        variants: [
          {
            src: [fontFile('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff2')],
            weight: 400,
            style: 'normal',
          },
          {
            src: [fontFile('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff2')],
            weight: 500,
            style: 'normal',
          },
        ],
      },
    },
  ],
});
