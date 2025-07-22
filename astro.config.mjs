// @ts-check
import { defineConfig } from 'astro/config';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  adapter: process.argv.includes('--local') ? undefined : netlify(),
  vite: {
    optimizeDeps: {
      exclude: ['@duckdb/duckdb-wasm']
    },
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin'
      }
    }
  }
});