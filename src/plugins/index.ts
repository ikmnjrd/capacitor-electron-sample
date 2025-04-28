import { Capacitor } from '@capacitor/core'
import { CapacitorImagePlugin } from './image/CapacitorImagePlugin'
import { WebImagePlugin } from './image/ImagePlugin'
import type { ImagePluginInterface } from './image/interface'

// グローバル型定義の拡張
declare global {
  interface Window {
    Plugins?: {
      ImagePlugin: ImagePluginInterface
    }
  }
}

// 適切なプラグインを環境に応じて返すファクトリ関数
export const getImagePlugin = (): ImagePluginInterface => {
  // Electronの場合
  if (window.Plugins?.ImagePlugin) {
    return window.Plugins.ImagePlugin
  }

  // Capacitorの場合
  if (Capacitor.isNativePlatform()) {
    return new CapacitorImagePlugin()
  }

  // Webの場合
  return new WebImagePlugin()
}
