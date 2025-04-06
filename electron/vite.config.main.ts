// electron/vite.config.main.ts
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'electron',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    ssr: true,
    rollupOptions: {
      input: {
        main: 'electron/main/index.ts',
      },
    },
  },
})
