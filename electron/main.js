// import path from 'path'
import { app, BrowserWindow } from 'electron'

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      // preload: path.join(path.dirname(new URL(import.meta.url).pathname), 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  win.setMenu(null) // ← Esto quita completamente la barra de menú

  win.loadURL('http://localhost:5173')
}

app.whenReady().then(createWindow)
