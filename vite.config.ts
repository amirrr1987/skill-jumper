import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// `base: './'` keeps asset paths relative so the built `dist/` folder works on
// any static host (GitHub Pages, Netlify, itch.io, a subfolder, etc.).
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
  },
  plugins: [
    VitePWA({
      registerType: 'prompt', // نمایش دکمه نصب (install) با prompt
      injectRegister: 'auto', // اطمینان از inject شدن باشد
      manifest: {
        name: 'SkillJumper',
        short_name: 'Jumper',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        start_url: '.',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        // سایر مقدار‌های لازم مانیفست را اضافه کنید
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json,txt,wasm}'],
        runtimeCaching: [
          {
            urlPattern: /^https?.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'all-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
    })
  ]
})
