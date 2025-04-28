import type { ImagePluginInterface } from './interface'

export class WebImagePlugin implements ImagePluginInterface {
  // デフォルト実装（Web向け）
  async getSampleImage(): Promise<{ src: string }> {
    // Web環境ではパブリックディレクトリのサンプル画像を返す
    return { src: '/images/sample.jpg' }
  }

  async saveImage(options: { src: string }): Promise<{ success: boolean }> {
    // Web環境ではダウンロードダイアログを表示
    try {
      const link = document.createElement('a')
      link.href = options.src
      link.download = 'sample-image.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return { success: true }
    } catch (error) {
      console.error('Failed to save image:', error)
      return { success: false }
    }
  }
}
