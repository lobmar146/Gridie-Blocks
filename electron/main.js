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
    let finalLibrariesPath = '' // <-- nuevo: ruta final que pasaremos a arduino-cli
    try {
      // Buscar librerías locales en varios lugares:
      // 1) durante desarrollo: __dirname/libraries
      // 2) en la app empaquetada: process.resourcesPath/libraries
      // 3) si usas extraResources con carpeta 'arduino', también revisar process.resourcesPath/arduino/libraries
      // Priorizar las librerías fuera del asar (process.resourcesPath/libraries)
      const candidates = [
        path.join(process.resourcesPath || __dirname, 'libraries'),
        path.join(process.resourcesPath || __dirname, 'arduino', 'libraries'),
        path.join(__dirname, 'libraries')
      ]

      // Filtrar rutas existentes y evitar las que estén dentro de app.asar
      const existing = candidates.filter(p => fs.existsSync(p))
      const unpacked = existing.filter(
        p => !p.split(path.sep).some(part => part.includes('app.asar'))
      )
      const localLibsDir = unpacked.length ? unpacked[0] : existing[0] || null
      const destLibsDir = path.join(buildPath, 'libraries')

      if (localLibsDir) {
        // limpiar destino si existe
        if (fs.existsSync(destLibsDir)) {
          fs.rmSync(destLibsDir, { recursive: true, force: true })
        }
        // copiar recursivamente (Node >=16 soporta fs.cpSync)
        if (fs.cpSync) {
          try {
            fs.cpSync(localLibsDir, destLibsDir, { recursive: true })
            finalLibrariesPath = destLibsDir
          } catch (copyErr) {
            console.warn(
              'fs.cpSync falló, usaremos la ruta original en resources:',
              copyErr
            )
            finalLibrariesPath = localLibsDir
          }
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
          try {
            copyRecursive(localLibsDir, destLibsDir)
            finalLibrariesPath = destLibsDir
          } catch (copyErr) {
            console.warn(
              'Copia recursiva falló, usaremos la ruta original en resources:',
              copyErr
            )
            finalLibrariesPath = localLibsDir
          }
        }
        console.log(
          'Librerías locales copiadas a (o usadas desde):',
          finalLibrariesPath
        )
      } else {
        // fallback: usar las librerías empaquetadas en resources si existen, o intentar instalar Servo
        const resourceCandidates = [
          path.join(process.resourcesPath || __dirname, 'libraries'),
          path.join(process.resourcesPath || __dirname, 'arduino', 'libraries')
        ]
        const resourceLibs = resourceCandidates.find(p => fs.existsSync(p))
        if (resourceLibs) {
          finalLibrariesPath = resourceLibs
          console.log('Usando librerías desde resources:', finalLibrariesPath)
        } else {
          try {
            execSync(`"${arduinoCliPath}" lib install "Servo"`, {
              stdio: 'inherit'
            })
            // si la instalación local coloca la librería en el sketchbook, podríamos no conocer la ruta exacta;
            // en muchos casos arduino-cli instalará en el usuario, pero dejamos finalLibrariesPath vacío y arduino-cli buscará globalmente.
          } catch (err) {
            console.warn(
              'No se pudo instalar la librería Servo automáticamente:',
              err
            )
          }
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
        // preferimos la ruta final calculada arriba (finalLibrariesPath); si no existe, usamos build/libraries
        const fallbackBuildLibs = path.join(buildPath, 'libraries')
        const librariesArg =
          finalLibrariesPath && fs.existsSync(finalLibrariesPath)
            ? `--libraries "${finalLibrariesPath}"`
            : fs.existsSync(fallbackBuildLibs)
              ? `--libraries "${fallbackBuildLibs}"`
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
