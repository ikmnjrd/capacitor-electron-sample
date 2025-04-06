import path from 'node:path'

export namespace paths {
  export const root = process.cwd()

  export const viteConfig = path.join(root, 'vite.config.ts')

  export const electronRoot = path.join(root, 'electron')

  export const dist = path.join(electronRoot, 'dist')
  export const distMain = path.join(dist, 'main.mjs')

  export const release = path.join(electronRoot, 'release')

  export const main = path.join(electronRoot, 'main')
  export const preload = path.join(electronRoot, 'preload')

  export const electronBuilderConfig = path.join(electronRoot, 'electron-builder.config.ts')
  export const viteConfigMain = path.join(electronRoot, 'vite.config.main.ts')
  export const viteConfigPreload = path.join(electronRoot, 'vite.config.preload.ts')
}
