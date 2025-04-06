// vite.config.ts
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  base: './',
  root: 'src',
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  plugins: [mkcert(), react()],
  build: {
    outDir: '../www',
    emptyOutDir: true,
  },
})
