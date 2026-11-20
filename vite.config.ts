import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// @ts-expect-error plain ESM script
import { ensureAssets } from './scripts/ensure-assets.js';

ensureAssets();

const cacheAssetsDir = path.resolve(process.cwd(), 'node_modules/.cache/swid-assets');

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /.*\/assets\/logo_luminous\.png$/,
        replacement: path.join(cacheAssetsDir, 'logo_luminous.png'),
      },
      {
        find: /.*\/assets\/logo_transparent\.png$/,
        replacement: path.join(cacheAssetsDir, 'logo_transparent.png'),
      },
    ],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    hmr: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
});

