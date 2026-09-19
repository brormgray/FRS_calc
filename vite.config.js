import fs from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'vite.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'CNAME'],
      manifest: {
        name: 'FRS Retirement Estimator',
        short_name: 'FRS Calc',
        description: 'Offline-First FRS Pension and DROP Calculator',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#1e3a8a',
        lang: 'en',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document' || request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 2,
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'style' ||
              request.destination === 'script' ||
              request.destination === 'worker',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
    {
      name: 'generate-200-html',
      closeBundle() {
        try {
          if (fs.existsSync('dist/index.html')) {
            fs.copyFileSync('dist/index.html', 'dist/200.html');
          }
        } catch (err) {
          console.error('Failed to copy 200.html:', err);
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
