import chalk from 'chalk'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    // expose in the `electron/preload/index.ts`
    ipcRenderer?: import('electron').IpcRenderer
  }
}

function App() {
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!window.ipcRenderer) return

    window.ipcRenderer.on('reply', (_event, data) => {
      setMessage(data as string)
    })

    window.ipcRenderer.send('request', 'ping')
    console.log(chalk.green('Sent request to main process'))
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>Electron + Vite + React</h1>
      <p>Message from main process:</p>
      <p style={{ fontWeight: 'bold' }}>{message}</p>
    </div>
  )
}

export default App
