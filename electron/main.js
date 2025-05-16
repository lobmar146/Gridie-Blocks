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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  win.maximize() // Esto inicia la ventana maximizada
  win.setMenu(null)
  win.loadURL('http://localhost:5173')
}

app.whenReady().then(createWindow)

// Ruta a arduino-cli y a la carpeta de cores/tools locales
const arduinoCliPath = path.join(__dirname, 'arduino-cli.exe')
const arduinoDataDir = path.join(__dirname, 'arduino')

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

// Subir código a la placa
ipcMain.handle('arduino:uploadCode', async (event, { placa, codigo }) => {
  return new Promise((resolve, reject) => {
    const tempFilePath = path.join(__dirname, 'build', 'build.ino') // Archivo temporal para el código
    const buildPath = path.join(__dirname, 'build') // Carpeta para los archivos compilados
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
            const hexFilePath = path.join(buildPath, 'build.ino.hex')
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
