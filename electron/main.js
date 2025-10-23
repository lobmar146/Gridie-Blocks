import { exec, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import { app, BrowserWindow, ipcMain } from 'electron'

// Crear ventana principal (dev vs producción)
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
// - En dev usamos electron/arduino-cli.exe (.__dirname).
// - En producción usamos resources/arduino-cli.exe (process.resourcesPath).
let arduinoCliPath
if (process.defaultApp || process.env.NODE_ENV === 'development') {
  arduinoCliPath = path.join(__dirname, 'arduino-cli.exe')
} else {
  arduinoCliPath = path.join(process.resourcesPath, 'arduino-cli.exe')
}

// Ejecutar arduino-cli incluyendo automáticamente el --config-file cuando exista.
// Todas las invocaciones a arduino-cli deben pasar por aquí.
function execArduinoCli(command, callback) {
  const cfg = getArduinoConfigFile()
  const cfgArg = cfg && fs.existsSync(cfg) ? `--config-file "${cfg}"` : ''
  exec(
    `"${arduinoCliPath}" ${cfgArg} ${command}`,
    { env: process.env },
    callback
  )
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

    // Preparar ruta de librerías usadas por arduino-cli:
    // - Prioridad: librerías dentro de electron/arduino-data (packaged).
    // - Fallback en desarrollo: __dirname/libraries.
    // - Evitar rutas dentro de app.asar (arduino-cli no puede leer de .asar).
    let finalLibrariesPath = '' // <-- nuevo: ruta final que pasaremos a arduino-cli
    try {
      const isDev = process.defaultApp || process.env.NODE_ENV === 'development'

      // En desarrollo usar electron/arduino-data/libraries (local).
      // En producción usar resources/arduino-data/libraries.
      const candidates = [
        isDev
          ? path.join(__dirname, 'arduino-data', 'libraries')
          : path.join(
              process.resourcesPath || __dirname,
              'arduino-data',
              'libraries'
            )
      ]

      // DEBUG: mostrar rutas candidatas
      console.log('DEBUG: isDev=', isDev, 'candidates=', candidates)

      // Seleccionar rutas existentes y preferir las no empaquetadas en app.asar.
      const existing = candidates.filter(p => fs.existsSync(p))
      const unpacked = existing.filter(
        p => !p.split(path.sep).some(part => part.includes('app.asar'))
      )
      const localLibsDir = unpacked.length ? unpacked[0] : existing[0] || null
      const destLibsDir = path.join(buildPath, 'libraries')

      // Copiar a build/libraries si es posible; si falla, usar la ruta original en resources.
      if (localLibsDir) {
        if (fs.existsSync(destLibsDir)) {
          fs.rmSync(destLibsDir, { recursive: true, force: true })
        }
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
          isDev
            ? path.join(__dirname, 'arduino-data', 'libraries')
            : path.join(
                process.resourcesPath || __dirname,
                'arduino-data',
                'libraries'
              )
        ]
        console.log('DEBUG: resourceCandidates=', resourceCandidates)
        const resourceLibs = resourceCandidates.find(p => fs.existsSync(p))
        if (resourceLibs) {
          finalLibrariesPath = resourceLibs
          console.log('Usando librerías desde resources:', finalLibrariesPath)
        } else {
          try {
            const cfg = getArduinoConfigFile()
            const cfgArg =
              cfg && fs.existsSync(cfg) ? `--config-file "${cfg}"` : ''
            execSync(`"${arduinoCliPath}" ${cfgArg} lib install "Servo"`, {
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

        // Antes de compilar, asegurar que el core AVR esté instalado
        {
          // Reemplazar la llamada directa a 'core install arduino:avr' por:
          const isDev =
            process.defaultApp || process.env.NODE_ENV === 'development'
          if (isDev) {
            // En desarrollo sigue instalando si hace falta
            execArduinoCli(
              'core install arduino:avr',
              (coreErr, coreStdout, coreStderr) => {
                if (coreErr) {
                  reject(
                    `No se pudo instalar el core arduino:avr: ${coreErr.message}`
                  )
                  return
                }
                if (coreStderr && coreStderr.trim() !== '') {
                  console.warn('arduino-cli core install stderr:', coreStderr)
                }
                console.log(
                  'Core arduino:avr disponible:',
                  coreStdout || 'ya instalado'
                )
                // continuar con la compilación...
                // Ahora compilar (mantener la lógica existente)
                execArduinoCli(
                  `compile --fqbn ${fqbn} --output-dir "${buildPath}" ${librariesArg} "${tempFilePath}"`,
                  (compileError, compileStdout, compileStderr) => {
                    if (compileError) {
                      reject(`Error al compilar: ${compileError.message}`)
                      return
                    }
                    if (compileStderr && compileStderr.trim() !== '') {
                      reject(`Error al compilar: ${compileStderr}`)
                      return
                    }

                    console.log('Compilación exitosa:', compileStdout)

                    // Subir el binario (mantener la lógica existente)
                    execArduinoCli(
                      `upload -p ${placa} -b ${fqbn} -i "${hexFilePath}"`,
                      (uploadError, uploadStdout, uploadStderr) => {
                        if (uploadError) {
                          reject(`Error al subir: ${uploadError.message}`)
                          return
                        }
                        if (uploadStderr && uploadStderr.trim() !== '') {
                          // No tratar stderr como fatal si solo contiene warnings; ajustar si es necesario
                          console.warn(
                            'arduino-cli upload stderr:',
                            uploadStderr
                          )
                        }
                        resolve(uploadStdout)
                      }
                    )
                  }
                )
              }
            )
          } else {
            // Producción: esperar que el core esté preempaquetado (evitar descargas/timeouts)
            const packagedArduino15 = path.join(
              process.resourcesPath || __dirname,
              'arduino15'
            )
            const corePresent = fs.existsSync(packagedArduino15)
            if (!corePresent) {
              reject(
                'En producción el core arduino:avr debe preempaquetarse. ' +
                  'Empaqueta la carpeta .arduino15 (que contiene los cores) en resources/arduino15 ' +
                  'o incluye el core en extraResources. Ver README / electron-builder.json.'
              )
              return
            }
            console.log(
              'Producción: usando core preempaquetado en',
              packagedArduino15
            )
            // continuar con la compilación (sin intentar instalar core)
            execArduinoCli(
              `compile --fqbn ${fqbn} --output-dir "${buildPath}" ${librariesArg} "${tempFilePath}"`,
              (compileError, compileStdout, compileStderr) => {
                if (compileError) {
                  reject(`Error al compilar: ${compileError.message}`)
                  return
                }
                if (compileStderr && compileStderr.trim() !== '') {
                  reject(`Error al compilar: ${compileStderr}`)
                  return
                }

                console.log('Compilación exitosa:', compileStdout)

                // Subir el binario (mantener la lógica existente)
                execArduinoCli(
                  `upload -p ${placa} -b ${fqbn} -i "${hexFilePath}"`,
                  (uploadError, uploadStdout, uploadStderr) => {
                    if (uploadError) {
                      reject(`Error al subir: ${uploadError.message}`)
                      return
                    }
                    if (uploadStderr && uploadStderr.trim() !== '') {
                      // No tratar stderr como fatal si solo contiene warnings; ajustar si es necesario
                      console.warn('arduino-cli upload stderr:', uploadStderr)
                    }
                    resolve(uploadStdout)
                  }
                )
              }
            )
          }
        }
      } catch (error) {
        reject(error)
      }
    })()
  })
})

// Reemplaza la función getArduinoConfigFile por esta implementación
function getArduinoConfigFile() {
  const isDev = process.defaultApp || process.env.NODE_ENV === 'development'

  const packagedArduino15 = path.join(
    process.resourcesPath || __dirname,
    'arduino15'
  )
  const devArduino15 = path.join(__dirname, 'arduino-data', 'arduino15')

  const packagedYaml = path.join(
    process.resourcesPath || __dirname,
    'arduino-data',
    'arduino-cli.yaml'
  )
  const devYaml = path.join(__dirname, 'arduino-data', 'arduino-cli.yaml')

  const tempCfgPath = path.join(
    app.getPath('userData'),
    'arduino-cli-generated.yaml'
  )

  try {
    // Desarrollo: si existe una carpeta arduino15 local, crear config temporal que la apunte
    if (isDev) {
      if (fs.existsSync(devArduino15)) {
        const normalized = devArduino15.replace(/\\/g, '/')
        const yamlContent = `directories:\n  data: "${normalized}"\n`
        let writeNeeded = true
        if (fs.existsSync(tempCfgPath)) {
          try {
            const existing = fs.readFileSync(tempCfgPath, 'utf8')
            writeNeeded = existing !== yamlContent
          } catch (e) {
            writeNeeded = true
          }
        }
        if (writeNeeded) fs.writeFileSync(tempCfgPath, yamlContent, 'utf8')
        return tempCfgPath
      }
      // fallback dev: usar arduino-cli.yaml dentro de arduino-data si existe
      if (fs.existsSync(devYaml)) return devYaml
      // fallback final: usar empaquetado si existe
      if (fs.existsSync(packagedYaml)) return packagedYaml
      return ''
    }

    // Producción: comportamiento existente (usar arduino15 empaquetado o YAML empaquetado)
    if (fs.existsSync(packagedArduino15)) {
      const normalized = packagedArduino15.replace(/\\/g, '/')
      const yamlContent = `directories:\n  data: "${normalized}"\n`
      let writeNeeded = true
      if (fs.existsSync(tempCfgPath)) {
        try {
          const existing = fs.readFileSync(tempCfgPath, 'utf8')
          writeNeeded = existing !== yamlContent
        } catch (e) {
          writeNeeded = true
        }
      }
      if (writeNeeded) fs.writeFileSync(tempCfgPath, yamlContent, 'utf8')
      return tempCfgPath
    }

    if (fs.existsSync(packagedYaml)) return packagedYaml
    return ''
  } catch (err) {
    console.error('getArduinoConfigFile error:', err)
    return fs.existsSync(packagedYaml) ? packagedYaml : ''
  }
}
