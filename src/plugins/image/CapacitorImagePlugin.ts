import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { ImagePluginInterface } from './interface'

export class CapacitorImagePlugin implements ImagePluginInterface {
  async getSampleImage(): Promise<{ src: string }> {
    // Capacitor環境で実行されている場合、適切なパスを返す
    if (Capacitor.isNativePlatform()) {
      // Capacitorの場合は内部アセットに含まれるイメージを使用
      // 実際にはアプリ内アセットへのパスを返す
      return { src: '/images/sample.jpg' }
    }
    // Web環境の場合はデフォルトのパスを返す
    return { src: '/images/sample.jpg' }
  }

  async saveImage(options: { src: string }): Promise<{ success: boolean }> {
    try {
      if (Capacitor.isNativePlatform()) {
        // ネイティブ環境の場合
        const platform = Capacitor.getPlatform()

        if (platform === 'ios' || platform === 'android') {
          // 一時ディレクトリにコピーしてから共有
          const fileName = options.src.split('/').pop() || 'sample-image.jpg'

          // ファイルシステムからファイルを読み込み
          const base64Data = await this.getBase64FromAsset(options.src)

          if (!base64Data) {
            return { success: false }
          }

          // 一時ディレクトリに保存
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          })

          // 共有ダイアログを表示
          await Share.share({
            title: 'サンプル画像',
            url: savedFile.uri,
            dialogTitle: '画像を保存/共有',
          })

          return { success: true }
        }
      }

      // Webフォールバック - HTMLのダウンロードリンクを使用
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

  // ヘルパーメソッド: アセットからBase64データを取得
  private async getBase64FromAsset(_assetPath: string): Promise<string | null> {
    try {
      // 実際のアプリでは、アセットのパスを適切に変換する必要がある
      // このサンプルコードは実装例として提供

      // 本来はCapacitorの適切なAPIを使ってアセットファイルを読み込む
      // 例えば、HTTPリクエストや、アセットローダーなど

      // 単純化のため、ダミーデータを返す
      return 'base64データ' // 実際の実装では実際のbase64データを返す
    } catch (error) {
      console.error('Failed to get base64 from asset:', error)
      return null
    }
  }
}
