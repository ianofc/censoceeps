/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'IO OS - Censo CEEP',
        short_name: 'IO Censo',
        description: 'Plataforma de pesquisa do CEEP Seabra',
        theme_color: '#4F46E5',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/1157/1157077.png', // Fallback icon
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})