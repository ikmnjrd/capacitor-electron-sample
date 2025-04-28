import fs from 'node:fs'
import path from 'node:path'
import { BrowserWindow, type IpcMainInvokeEvent, type IpcRenderer, dialog, type ipcMain } from 'electron'
import type { ImagePluginInterface } from './interface'

export const ELECTRON_IMAGE_CHANNELS = {
  GET_SAMPLE: 'image-plugin-get-sample',
  SAVE_IMAGE: 'image-plugin-save-image',
} as const

// --- Core Logic Class ---
// Contains the actual implementation without direct dependency on IPC event object
class ElectronImageLogic implements ImagePluginInterface {
  async getSampleImage(): Promise<{ src: string }> {
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
    // 開発環境ではpublicフォルダを直接参照
    if (isDev) {
      // 開発モードでは / から始まるパスにする必要がある
      return { src: '/images/sample.jpg' }
    }
    // 本番環境では適切なパスを構築
    return { src: 'images/sample.jpg' }
  }

  // Not working
  async saveImage(options: { src: string }): Promise<{ success: boolean; error?: string; filePath?: string }> {
    try {
      // Core logic doesn't need the event, get focused window directly
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        console.error('SaveImage Error: No focused window available.')
        return { success: false, error: 'No focused window' }
      } // <-- Corrected closing brace placement

      // ダイアログで保存先を選択 (Restored this block)
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Save Image',
        defaultPath: path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads/sample-image.jpg'),
        filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }],
      })

      if (canceled || !filePath) {
        return { success: false }
      }

      // 画像のパスを正規化
      const srcPath = options.src
      let imagePath: string

      // URLかローカルパスかを判断
      if (srcPath.startsWith('http')) {
        // 外部URLの場合は一旦ダウンロードが必要だが、
        // サンプルなのでローカルファイルに限定する
        return { success: false, error: 'External URLs not supported in this example' }
      }
      // ローカルファイルパスの場合
      const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

      if (isDev) {
        // 開発環境
        // パスが / で始まるかどうかに関わらず対応
        const cleanPath = srcPath.replace(/^\//, '')
        imagePath = path.resolve(process.cwd(), 'public', cleanPath)

        if (!fs.existsSync(imagePath)) {
          const altPath = path.resolve(process.cwd(), cleanPath)
          if (fs.existsSync(altPath)) {
            imagePath = altPath
          }
        }
      } else {
        // 本番環境
        imagePath = path.resolve(process.resourcesPath, 'app', 'dist', srcPath.replace(/^\//, ''))
      }

      if (!fs.existsSync(imagePath)) {
        console.error(`File not found: ${imagePath}`)
        return { success: false, error: 'File not found' }
      }

      fs.copyFileSync(imagePath, filePath)

      return { success: true, filePath }
    } catch (error) {
      console.error('Failed to save image:', error)
      return { success: false, error: String(error) }
    }
  }
}

class ElectronImageHandler {
  private logic: ElectronImageLogic

  constructor() {
    this.logic = new ElectronImageLogic()
  }

  async handleGetSample(_event: IpcMainInvokeEvent): ReturnType<ImagePluginInterface['getSampleImage']> {
    return await this.logic.getSampleImage()
  }

  async handleSaveImage(
    _event: IpcMainInvokeEvent,
    options: { src: string },
  ): ReturnType<ImagePluginInterface['saveImage']> {
    return await this.logic.saveImage(options)
  }
}

export const registerElectronImagePlugin = (ipcInstance: typeof ipcMain) => {
  const handler = new ElectronImageHandler()

  ipcInstance.handle(ELECTRON_IMAGE_CHANNELS.GET_SAMPLE, args => handler.handleGetSample(args))
  ipcInstance.handle(ELECTRON_IMAGE_CHANNELS.SAVE_IMAGE, (event, options) => handler.handleSaveImage(event, options))
}

export function createElectronImagePlugin(ipcRenderer: IpcRenderer): ImagePluginInterface {
  return {
    async getSampleImage(): Promise<{ src: string }> {
      return await ipcRenderer.invoke(ELECTRON_IMAGE_CHANNELS.GET_SAMPLE)
    },

    async saveImage(options: { src: string }): Promise<{ success: boolean }> {
      console.log('Saving image with options:', options)
      const result: { success: boolean; error?: string; filePath?: string } = await ipcRenderer.invoke(
        ELECTRON_IMAGE_CHANNELS.SAVE_IMAGE,
        options,
      )
      return { success: result.success }
    },
  }
}
