import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { externalizeCojsonWasm } from './build/externalize-wasm.js'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    externalizeCojsonWasm(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered manually in main.tsx — the desktop shell has no service worker.
      injectRegister: null,
      includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Habits — track together',
        short_name: 'Habits',
        description:
          'A local-first, end-to-end encrypted habit tracker you can share with your people.',
        theme_color: '#f0eee9',
        background_color: '#f0eee9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app shell is cached; all user data lives in IndexedDB, so the
        // service worker never needs to cache API responses.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,wasm}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    // The sync engine is the bulk of the app and changes on its own cadence;
    // splitting it keeps the UI chunk small and independently cacheable.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/jazz-tools|cojson/.test(id)) return 'jazz'
          if (/[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return 'vendor'
        },
      },
    },
  },
})
