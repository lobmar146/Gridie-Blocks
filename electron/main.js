import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import { app, BrowserWindow, ipcMain } from 'electron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  // win.maximize() // Esto inicia la ventana maximizada
  win.setMenu(null)
  // Open dev tools
  // win.webContents.openDevTools()
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

// Ruta a arduino-cli
let arduinoCliPath
if (process.defaultApp || process.env.NODE_ENV === 'development') {
  arduinoCliPath = path.join(__dirname, 'arduino-cli.exe')
} else {
  arduinoCliPath = path.join(process.resourcesPath, 'arduino-cli.exe')
}

// Helper para ejecutar arduino-cli con el entorno adecuado
function execArduinoCli(command, callback) {
  exec(`"${arduinoCliPath}" ${command}`, { env: process.env }, callback)
}

// Listar placas conectadas
ipcMain.handle('arduino:listBoards', async () => {
  return new Promise((resolve, reject) => {
    execArduinoCli('board list', (error, stdout, stderr) => {
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

// Helper para obtener rutas de build y archivos temporales
function getBuildPaths() {
  let buildPath
  if (process.defaultApp || process.env.NODE_ENV === 'development') {
    buildPath = path.join(__dirname, 'build')
  } else {
    buildPath = path.join(app.getPath('userData'), 'build')
  }
  if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath, { recursive: true })
  }
  const tempFilePath = path.join(buildPath, 'build.ino')
  const hexFilePath = path.join(buildPath, 'build.ino.hex')
  return { buildPath, tempFilePath, hexFilePath }
}

// Subir código a la placa
ipcMain.handle('arduino:uploadCode', async (event, { placa, codigo }) => {
  return new Promise((resolve, reject) => {
    const { buildPath, tempFilePath, hexFilePath } = getBuildPaths()
    const fqbn = 'arduino:avr:uno' // Cambia esto según tu placa

    // Lógica principal
    ;(async () => {
      try {
        // Escribir el código en un archivo temporal
        fs.writeFileSync(tempFilePath, codigo)

        // Compilar el archivo .ino
        execArduinoCli(
          `compile --fqbn ${fqbn} --output-dir "${buildPath}" "${tempFilePath}"`,
          (compileError, compileStdout, compileStderr) => {
            if (compileError) {
              reject(`Error al compilar: ${compileError.message}`)
              return
            }
            if (compileStderr) {
              reject(`Error al compilar: ${compileStderr}`)
              return
            }

            console.log('Compilación exitosa:', compileStdout)

            // Subir el archivo compilado (.hex)
            execArduinoCli(
              `upload -p ${placa} -b ${fqbn} -i "${hexFilePath}"`,
              (uploadError, uploadStdout, uploadStderr) => {
                if (uploadError) {
                  reject(`Error al subir: ${uploadError.message}`)
                  return
                }
                if (uploadStderr) {
                  reject(`Error al subir: ${uploadStderr}`)
                  return
                }
                resolve(uploadStdout)
              }
            )
          }
        )
      } catch (error) {
        reject(error)
      }
    })()
  })
})
