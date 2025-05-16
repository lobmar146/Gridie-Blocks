import { exec } from 'child_process'
import fs from 'fs'
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
    const arduinoCliPath = path.join(__dirname, 'arduino-cli.exe') // Ruta completa al ejecutable
    exec(`"${arduinoCliPath}" board list`, (error, stdout, stderr) => {
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

// Manejo del comando arduino-cli para subir código
ipcMain.handle('arduino:uploadCode', async (event, { placa, codigo }) => {
  return new Promise((resolve, reject) => {
    const arduinoCliPath = path.join(__dirname, 'arduino-cli.exe') // Ruta completa al ejecutable
    const tempFilePath = path.join(__dirname, 'build', 'build.ino') // Archivo temporal para el código
    const buildPath = path.join(__dirname, 'build') // Carpeta para los archivos compilados
    const fqbn = 'arduino:avr:uno' // Cambia esto según tu placa

    // Función para verificar si el core está instalado
    const verificarCoreInstalado = () => {
      return new Promise((resolve, reject) => {
        exec(`"${arduinoCliPath}" core list`, (error, stdout, stderr) => {
          if (error) {
            reject(error.message)
            return
          }
          if (stdout.includes('arduino:avr')) {
            resolve(true) // El core está instalado
          } else {
            resolve(false) // El core no está instalado
          }
        })
      })
    }

    // Función para instalar el core
    const instalarCore = () => {
      return new Promise((resolve, reject) => {
        exec(
          `"${arduinoCliPath}" core install arduino:avr`,
          (error, stdout, stderr) => {
            if (error) {
              reject(`Error al instalar el core: ${error.message}`)
              return
            }
            resolve(stdout) // Core instalado correctamente
          }
        )
      })
    }

    // Lógica principal
    ;(async () => {
      try {
        // Verificar si el core está instalado
        const coreInstalado = await verificarCoreInstalado()
        if (!coreInstalado) {
          console.log('El core arduino:avr no está instalado. Instalando...')
          await instalarCore()
          console.log('Core arduino:avr instalado correctamente.')
        }

        // Escribir el código en un archivo temporal
        fs.writeFileSync(tempFilePath, codigo)

        // Compilar el archivo .ino
        exec(
          `"${arduinoCliPath}" compile --fqbn ${fqbn} --output-dir "${buildPath}" "${tempFilePath}"`,
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
            exec(
              `"${arduinoCliPath}" upload -p ${placa} -b ${fqbn} -i "${hexFilePath}"`,
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
