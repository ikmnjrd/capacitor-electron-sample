// vite.config.ts
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  root: 'src',
  plugins: [mkcert(), react()],
  build: {
    outDir: '../www',
    emptyOutDir: true,
  },
})
