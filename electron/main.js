import { exec, execSync } from 'child_process'
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

    // Copiar librerías locales (si existen) dentro de build/libraries para que arduino-cli las detecte
    try {
      const localLibsDir = path.join(__dirname, 'libraries') // colocar aqui tu carpeta con Servo/
      const destLibsDir = path.join(buildPath, 'libraries')

      if (fs.existsSync(localLibsDir)) {
        // limpiar destino si existe
        if (fs.existsSync(destLibsDir)) {
          fs.rmSync(destLibsDir, { recursive: true, force: true })
        }
        // copiar recursivamente (Node >=16 soporta fs.cpSync)
        if (fs.cpSync) {
          fs.cpSync(localLibsDir, destLibsDir, { recursive: true })
        } else {
          // fallback simple si no existe cpSync
          const copyRecursive = (src, dest) => {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
            for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
              const srcPath = path.join(src, entry.name)
              const destPath = path.join(dest, entry.name)
              if (entry.isDirectory()) copyRecursive(srcPath, destPath)
              else fs.copyFileSync(srcPath, destPath)
            }
          }
          copyRecursive(localLibsDir, destLibsDir)
        }
        console.log('Librerías locales copiadas a:', destLibsDir)
      } else {
        // fallback: instalar Servo vía arduino-cli si no hay librerías locales
        try {
          execSync(`"${arduinoCliPath}" lib install "Servo"`, {
            stdio: 'inherit'
          })
        } catch (err) {
          console.warn(
            'No se pudo instalar la librería Servo automáticamente:',
            err
          )
        }
      }
    } catch (err) {
      console.error('Error al preparar librerías locales:', err)
      // continuar; la compilación fallará si falta la librería
    }

    // Lógica principal
    ;(async () => {
      try {
        // Escribir el código en un archivo temporal
        fs.writeFileSync(tempFilePath, codigo)

        // Compilar el archivo .ino
        // incluir las librerías del build si existen para que arduino-cli las use
        const buildLibsDir = path.join(buildPath, 'libraries')
        const librariesArg = fs.existsSync(buildLibsDir)
          ? `--libraries "${buildLibsDir}"`
          : ''

        execArduinoCli(
          `compile --fqbn ${fqbn} --output-dir "${buildPath}" ${librariesArg} "${tempFilePath}"`,
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
