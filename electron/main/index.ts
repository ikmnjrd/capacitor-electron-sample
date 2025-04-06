import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { BrowserWindow, app, ipcMain } from 'electron'

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let win: BrowserWindow | null

void app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  const isDev = !app.isPackaged
  if (isDev) {
    if (VITE_DEV_SERVER_URL === undefined) {
      console.error(chalk.red('Error: VITE_DEV_SERVER_URL is undefined. Exiting...'))
      app.quit()
      return
    }
    console.log('Running in', chalk.blue('development'), 'mode with:', `VITE_DEV_SERVER_URL=${VITE_DEV_SERVER_URL}`)
    void win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    console.log('Running in', chalk.magenta('production'), 'mode')
    void win.loadFile(path.join(__dirname, '../../www/index.html')) // Load built files in production
  }
})

ipcMain.on('request', (event, arg) => {
  console.log('Received message from renderer:', arg)
  event.reply('reply', 'pong')
})
