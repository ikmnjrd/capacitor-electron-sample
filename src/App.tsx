import chalk from 'chalk'
import { useEffect, useState } from 'react'
import { getImagePlugin } from './plugins'

declare global {
  interface Window {
    // expose in the `electron/preload/index.ts`
    ipcRenderer?: import('electron').IpcRenderer
  }
}

function App() {
  const [message, setMessage] = useState<string>('')
  const [imageSrc, setImageSrc] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; error?: string } | null>(null)

  useEffect(() => {
    // 基本的なIPC通信（サンプル）
    if (window.ipcRenderer) {
      window.ipcRenderer.on('reply', (_event, data) => {
        setMessage(data as string)
      })

      window.ipcRenderer.send('request', 'ping')
      console.log(chalk.green('Sent request to main process'))
    }

    // サンプル画像を取得
    loadSampleImage()
  }, [])

  // サンプル画像を取得する関数
  const loadSampleImage = async () => {
    try {
      const imagePlugin = getImagePlugin()
      const result = await imagePlugin.getSampleImage()
      setImageSrc(result.src)
    } catch (error) {
      console.error('Failed to load sample image:', error)
      // 確実なフォールバック
      setImageSrc('/images/sample.jpg')
    }
  }

  // 画像を保存する関数
  const handleSaveImage = async () => {
    if (!imageSrc || isSaving) return

    setIsSaving(true)
    setSaveResult(null)

    try {
      const imagePlugin = getImagePlugin()
      const result = await imagePlugin.saveImage({ src: imageSrc })
      setSaveResult(result)
    } catch (error) {
      console.error('Failed to save image:', error)
      setSaveResult({ success: false, error: String(error) || 'Failed to save image' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>画像表示・保存サンプル</h1>

      {message && (
        <div style={{ margin: '10px 0' }}>
          <p>
            メインプロセスからのメッセージ: <span style={{ fontWeight: 'bold' }}>{message}</span>
          </p>
        </div>
      )}

      <div style={{ margin: '20px 0', minHeight: '300px' }}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="サンプル画像"
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              backgroundColor: '#f5f5f5',
              border: '1px dashed #ccc',
              borderRadius: '4px',
            }}
          >
            <p>画像を読み込み中...</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSaveImage}
        disabled={!imageSrc || isSaving}
        style={{
          padding: '10px 20px',
          background: !imageSrc || isSaving ? '#cccccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !imageSrc || isSaving ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          transition: 'background-color 0.3s',
        }}
      >
        {isSaving ? '保存中...' : '画像を保存'}
      </button>

      {saveResult && (
        <div
          style={{
            margin: '15px 0',
            padding: '10px',
            backgroundColor: saveResult.success ? '#e8f5e9' : '#ffebee',
            borderRadius: '4px',
            color: saveResult.success ? '#2e7d32' : '#c62828',
          }}
        >
          {saveResult.success ? (
            <p>画像を正常に保存しました！</p>
          ) : (
            <p>画像の保存に失敗しました: {saveResult.error || 'エラーが発生しました'}</p>
          )}
        </div>
      )}

      <p style={{ fontSize: '12px', color: '#666', marginTop: '30px' }}>
        このサンプルはElectronとCapacitorの両環境で動作します
      </p>
    </div>
  )
}

export default App
