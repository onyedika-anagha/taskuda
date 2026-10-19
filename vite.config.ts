import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import packageJson from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      // Registered from the app (services/pwa/serviceWorker.ts) so it can offer "Reload".
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Taskuda',
        short_name: 'Taskuda',
        description: 'Plan your day across every job, and send your end-of-day report in minutes.',
        theme_color: '#f6f1e7',
        background_color: '#f6f1e7',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: {
    rolldownOptions: {
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
