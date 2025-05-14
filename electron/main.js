import { exec } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { app, BrowserWindow, ipcMain } from 'electron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  win.setMenu(null)
  win.loadURL('http://localhost:5173')
}

app.whenReady().then(createWindow)

// 🔽 Paso 3: Manejo del comando arduino-cli
ipcMain.handle('arduino:listBoards', async () => {
  return new Promise((resolve, reject) => {
    exec('arduino-cli board list', (error, stdout, stderr) => {
      if (error) {
        reject(error.message)
        return
      }
      if (stderr) {
        reject(stderr)
        return
      }
      resolve(stdout)
    })
  })
})
