import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolveSeoOptions, seoPlugin } from './config/seoPlugin.ts'
import packageJson from './package.json' with { type: 'json' }

const seo = resolveSeoOptions(process.env)

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    seoPlugin(seo, new Date().toISOString().slice(0, 10)),
    VitePWA({
      registerType: 'prompt',
      // Registered from the app (services/pwa/serviceWorker.ts) so it can offer "Reload".
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon.ico', 'favicon-96x96.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Taskuda',
        short_name: 'Taskuda',
        description: 'Plan your day across every job, and send your end-of-day report in minutes.',
        theme_color: '#f6f1e7',
        background_color: '#f6f1e7',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        // The PNGs keep the note well inside the maskable safe zone, so each serves both purposes.
        icons: [
          { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // The social card is for crawlers, not the offline app.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['og-image.png'],
        navigateFallback: '/index.html',
        // /about is its own static page, and crawler files must come from the network.
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/about/,
          /^\/(robots|llms)\.txt$/,
          /^\/(sitemap\.xml|pricing\.md)$/,
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      // The app, plus the static /about page for search engines and AI crawlers (no React).
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        about: fileURLToPath(new URL('./about/index.html', import.meta.url)),
      },
      output: {
        // Libraries change less often than app code; separate chunks stay cached across releases.
        codeSplitting: {
          groups: [
            // Module ids use forward slashes on every OS.
            { name: 'react', test: /node_modules\/(react|react-dom|react-router|scheduler)\// },
            { name: 'ui', test: /node_modules\/(radix-ui|@radix-ui|@dnd-kit|sonner|lucide-react)\// },
            { name: 'data', test: /node_modules\/(dexie|dexie-react-hooks|zod|date-fns|zustand)\// },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
