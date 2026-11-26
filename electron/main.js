import { exec, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import process from 'process'
import { fileURLToPath, pathToFileURL } from 'url'
import { app, BrowserWindow, ipcMain, net, protocol } from 'electron'

// Crear ventana principal (dev vs producción)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// En producción la interfaz se sirve con el protocolo app:// en vez de file://.
// El simulador (ORBE) necesita fetch() y Web Workers de módulo, que con file:// no andan.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
])

function registrarProtocoloApp() {
  const raiz = path.join(__dirname, '../dist')
  protocol.handle('app', request => {
    const { pathname } = new URL(request.url)
    const archivo = path.normalize(
      path.join(raiz, decodeURIComponent(pathname))
    )
    if (!archivo.startsWith(raiz)) {
      return new Response('Prohibido', { status: 403 })
    }
    return net.fetch(pathToFileURL(archivo).toString())
  })
}

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
  // El simulador se abre en una ventana aparte (window.open desde «Probar en simulador»),
  // con el mismo preload para poder compilar.
  win.webContents.setWindowOpenHandler(({ url }) => {
    const esDeGridie =
      url.startsWith('app://gridie/') || url.startsWith('http://localhost:5173/')
    if (!esDeGridie) return { action: 'allow' }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 1280,
        height: 860,
        icon: path.join(__dirname, '../public/favicon.ico'),
        autoHideMenuBar: true,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true
        }
      }
    }
  })
  win.webContents.on('did-create-window', ventana => ventana.setMenu(null))
  // Open dev tools
  // win.webContents.openDevTools()
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadURL('app://gridie/index.html')
  }
}

app.whenReady().then(() => {
  registrarProtocoloApp()
  createWindow()
})

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

// Prepara la carpeta de librerías (Servo, etc.) que se le pasa a arduino-cli.
// Devuelve el argumento --libraries listo para usar (o '' si no hay).
function prepararLibrerias(buildPath) {
  let finalLibrariesPath = '' // ruta final que pasaremos a arduino-cli
  // Preparar ruta de librerías usadas por arduino-cli:
  // - Prioridad: librerías dentro de electron/arduino-data (packaged).
  // - Fallback en desarrollo: __dirname/libraries.
  // - Evitar rutas dentro de app.asar (arduino-cli no puede leer de .asar).
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

    // Usar directamente la carpeta fuera de app.asar para evitar borrar y copiar librerías en cada compilación.
    if (localLibsDir) {
      if (!localLibsDir.split(path.sep).some(part => part.includes('app.asar'))) {
        finalLibrariesPath = localLibsDir
      } else {
        if (!fs.existsSync(destLibsDir)) {
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
        } else {
          finalLibrariesPath = destLibsDir
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

  const fallbackBuildLibs = path.join(buildPath, 'libraries')
  return finalLibrariesPath && fs.existsSync(finalLibrariesPath)
    ? `--libraries "${finalLibrariesPath}"`
    : fs.existsSync(fallbackBuildLibs)
      ? `--libraries "${fallbackBuildLibs}"`
      : ''
}

// Promesa sobre execArduinoCli. stderr con texto se toma como error si `stderrEsError`.
function ejecutarArduinoCli(comando, { stderrEsError = false } = {}) {
  return new Promise((resolve, reject) => {
    execArduinoCli(comando, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr && stderr.trim()) || error.message))
        return
      }
      if (stderrEsError && stderr && stderr.trim() !== '') {
        reject(new Error(stderr))
        return
      }
      if (stderr && stderr.trim() !== '')
        console.warn('arduino-cli stderr:', stderr)
      resolve(stdout)
    })
  })
}

// Asegura que el core arduino:avr esté disponible una sola vez por sesión.
// - En desarrollo usa el core empaquetado si existe; si no, lo instala una vez.
// - En producción tiene que venir preempaquetado (evita descargas/timeouts).
let coreAvrVerificado = false
async function asegurarCoreAvr() {
  if (coreAvrVerificado) return
  const isDev = process.defaultApp || process.env.NODE_ENV === 'development'
  if (isDev) {
    const avrEmpaquetado = path.join(
      __dirname,
      'arduino-data',
      'arduino15',
      'packages',
      'arduino',
      'hardware',
      'avr'
    )
    if (fs.existsSync(avrEmpaquetado)) {
      coreAvrVerificado = true
      return
    }
    try {
      const salida = await ejecutarArduinoCli('core install arduino:avr')
      console.log('Core arduino:avr disponible:', salida || 'ya instalado')
      coreAvrVerificado = true
    } catch (coreErr) {
      throw new Error(
        `No se pudo instalar el core arduino:avr: ${coreErr.message}`
      )
    }
    return
  }
  const packagedArduino15 = path.join(
    process.resourcesPath || __dirname,
    'arduino15'
  )
  if (!fs.existsSync(packagedArduino15)) {
    throw new Error(
      'En producción el core arduino:avr debe preempaquetarse. ' +
        'Empaqueta la carpeta .arduino15 (que contiene los cores) en resources/arduino15 ' +
        'o incluye el core en extraResources. Ver README / electron-builder.json.'
    )
  }
  coreAvrVerificado = true
  console.log('Producción: usando core preempaquetado en', packagedArduino15)
}

// Compila el código y devuelve la ruta del .hex. Las compilaciones van de a una,
// porque comparten la carpeta build.
let colaDeCompilacion = Promise.resolve()
function compilarCodigo(codigo) {
  const tarea = colaDeCompilacion.then(async () => {
    const { buildPath, tempFilePath, hexFilePath } = getBuildPaths()
    const fqbn = 'arduino:avr:uno' // Cambia esto según tu placa
    const librariesArg = prepararLibrerias(buildPath)
    fs.writeFileSync(tempFilePath, codigo)
    await asegurarCoreAvr()
    try {
      const salida = await ejecutarArduinoCli(
        `compile --fqbn ${fqbn} --output-dir "${buildPath}" ${librariesArg} "${tempFilePath}"`,
        { stderrEsError: true }
      )
      console.log('Compilación exitosa:', salida)
    } catch (compileError) {
      throw new Error(`Error al compilar: ${compileError.message}`)
    }
    return hexFilePath
  })
  colaDeCompilacion = tarea.catch(() => {})
  return tarea
}

// Subir código a la placa
ipcMain.handle('arduino:uploadCode', async (event, { placa, codigo }) => {
  const fqbn = 'arduino:avr:uno'
  const hexFilePath = await compilarCodigo(codigo)
  try {
    // No tratar stderr como fatal si solo contiene warnings
    return await ejecutarArduinoCli(
      `upload -p ${placa} -b ${fqbn} -i "${hexFilePath}"`
    )
  } catch (uploadError) {
    throw new Error(`Error al subir: ${uploadError.message}`)
  }
})

// Compilar para el simulador: devuelve el texto del .hex (con caché en memoria)
const cacheSimuladorHex = new Map()
ipcMain.handle('arduino:compile', async (event, { codigo }) => {
  const cacheado = cacheSimuladorHex.get(codigo)
  if (cacheado !== undefined) return cacheado
  const hexFilePath = await compilarCodigo(codigo)
  const hex = fs.readFileSync(hexFilePath, 'utf8')
  if (cacheSimuladorHex.size >= 30) {
    cacheSimuladorHex.delete(cacheSimuladorHex.keys().next().value)
  }
  cacheSimuladorHex.set(codigo, hex)
  return hex
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
