// electron/vite.config.preload.ts
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
        preload: 'electron/preload/index.ts',
      },
      output: {
        format: 'cjs',
      },
    },
  },
})
