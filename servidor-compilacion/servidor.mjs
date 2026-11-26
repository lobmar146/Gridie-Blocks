// Servidor de compilación (y, opcionalmente, de la versión web) para la modalidad a distancia.
// Recibe el código que genera GrIDIE Blocks y devuelve el .hex que corre el simulador.
//
//   node servidor-compilacion/servidor.mjs
//
// Rutas:
//   POST /api/compilar   { codigo }  ->  { hex }  o  { error }
//   GET  /salud          estado y estadísticas (sirve para ver si está vivo)
//   GET  /...            la versión web de GrIDIE (carpeta dist/), si existe
//
// Variables de entorno (todas opcionales):
//   PUERTO (o PORT)        puerto donde escucha. Por defecto 8787.
//   ARDUINO_CLI            ruta a arduino-cli. Por defecto el de electron/ (Windows) o el del PATH.
//   ARDUINO_CLI_CONFIG     --config-file para arduino-cli.
//   ARDUINO_LIBRERIAS      carpeta con librerías extra (Servo).
//   CONCURRENCIA           cuántas compilaciones a la vez. Por defecto 1.
//   COLA_MAXIMA            cuántos pedidos pueden esperar antes de responder "ocupado". Por defecto 30.
//   CARPETA_CACHE          carpeta para guardar los .hex compilados (sobrevive a reinicios).
//   LIMITE_POR_MINUTO      compilaciones por minuto por cada IP. Por defecto 120. 0 = sin límite.
//   ORIGEN_PERMITIDO       orígenes que pueden llamar a la API (CORS), separados por coma. Por defecto "*".
//   PERMITIR_IFRAME_EN     sitios que pueden mostrar GrIDIE en un iframe (p. ej. tu Moodle),
//                          separados por espacio. Por defecto "*" (cualquiera).
//   CARPETA_WEB            carpeta con la versión web compilada. Por defecto dist/.
//   CALENTAR               "0" para no compilar un programa de prueba al arrancar.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compilarEnCola, estadisticas, manejarPedido } from './compilar.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const puerto = Number(process.env.PUERTO || process.env.PORT || 8787)
const origenes = (process.env.ORIGEN_PERMITIDO || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
const iframeEn = process.env.PERMITIR_IFRAME_EN || '*'
const limitePorMinuto = Number(process.env.LIMITE_POR_MINUTO ?? 120)
const carpetaWeb = path.resolve(
  process.env.CARPETA_WEB || path.join(AQUI, '..', 'dist')
)
const hayWeb = fs.existsSync(path.join(carpetaWeb, 'index.html'))
const arranque = Date.now()

// ---------- CORS e iframe ----------

function ponerCors(req, res) {
  const origen = req.headers.origin
  if (origenes.includes('*')) res.setHeader('Access-Control-Allow-Origin', '*')
  else if (origen && origenes.includes(origen)) {
    res.setHeader('Access-Control-Allow-Origin', origen)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
}

// ---------- Límite por IP ----------

const pedidosPorIp = new Map() // ip -> { desde, cantidad }
function superaLimite(req) {
  if (!limitePorMinuto) return false
  const ip =
    String(req.headers['cf-connecting-ip'] || '') ||
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress
  const ahora = Date.now()
  let registro = pedidosPorIp.get(ip)
  if (!registro || ahora - registro.desde > 60_000) {
    registro = { desde: ahora, cantidad: 0 }
    pedidosPorIp.set(ip, registro)
  }
  registro.cantidad++
  return registro.cantidad > limitePorMinuto
}
setInterval(() => {
  const ahora = Date.now()
  for (const [ip, r] of pedidosPorIp)
    if (ahora - r.desde > 60_000) pedidosPorIp.delete(ip)
}, 60_000).unref()

// ---------- Archivos de la versión web ----------

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.hex': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
}

function servirArchivo(req, res, url) {
  let relativa
  try {
    relativa = decodeURIComponent(url.pathname)
  } catch {
    res.statusCode = 400
    return res.end()
  }
  let archivo = path.join(carpetaWeb, path.normalize(relativa))
  if (!archivo.startsWith(carpetaWeb)) {
    res.statusCode = 403
    return res.end()
  }
  fs.stat(archivo, (error, info) => {
    if (!error && info.isDirectory()) {
      archivo = path.join(archivo, 'index.html')
    } else if (error) {
      // Rutas de la app sin archivo (por si se usa BrowserRouter): devolver la app.
      if (path.extname(archivo)) {
        res.statusCode = 404
        return res.end('No encontrado')
      }
      archivo = path.join(carpetaWeb, 'index.html')
    }
    fs.stat(archivo, (error2, info2) => {
      if (error2) {
        res.statusCode = 404
        return res.end('No encontrado')
      }
      const extension = path.extname(archivo).toLowerCase()
      res.setHeader('Content-Type', TIPOS[extension] || 'application/octet-stream')
      res.setHeader('Content-Length', info2.size)
      // Los archivos de assets/ llevan un hash en el nombre: se pueden guardar para siempre.
      res.setHeader(
        'Cache-Control',
        relativa.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache'
      )
      if (req.method === 'HEAD') return res.end()
      fs.createReadStream(archivo).pipe(res)
    })
  })
}

// ---------- Servidor ----------

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  // Permite que GrIDIE se muestre dentro de un iframe (por ejemplo, en Moodle).
  res.setHeader('Content-Security-Policy', `frame-ancestors ${iframeEn}`)
  res.setHeader('X-Content-Type-Options', 'nosniff')

  if (url.pathname === '/api/compilar' || url.pathname === '/salud') {
    ponerCors(req, res)
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      return res.end()
    }
  }

  if (url.pathname === '/api/compilar') {
    if (req.method === 'POST' && superaLimite(req)) {
      res.statusCode = 429
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Retry-After', '30')
      return res.end(
        JSON.stringify({
          error: 'Demasiados pedidos seguidos. Esperá unos segundos y probá de nuevo.'
        })
      )
    }
    return manejarPedido(req, res)
  }

  if (url.pathname === '/salud') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.end(
      JSON.stringify({
        ok: true,
        activoHaceSegundos: Math.round((Date.now() - arranque) / 1000),
        sirveWeb: hayWeb,
        ...JSON.parse(JSON.stringify(estadisticas))
      })
    )
  }

  if (hayWeb && (req.method === 'GET' || req.method === 'HEAD'))
    return servirArchivo(req, res, url)

  res.statusCode = 404
  res.end('No encontrado')
})

servidor.listen(puerto, () => {
  console.log(`Servidor de compilación en http://localhost:${puerto}/api/compilar`)
  if (hayWeb) console.log(`Versión web de GrIDIE en http://localhost:${puerto}/`)
  else console.log(`(No se encontró ${carpetaWeb}: solo se atiende la API.)`)

  // Compila un programa vacío al arrancar para tener listo el core de Arduino:
  // así la primera compilación de un alumno no tarda de más.
  if (process.env.CALENTAR !== '0') {
    const inicio = Date.now()
    compilarEnCola('void setup() {}\nvoid loop() {}\n')
      .then(() =>
        console.log(
          `Compilador listo (prueba en ${((Date.now() - inicio) / 1000).toFixed(1)} s).`
        )
      )
      .catch(error =>
        console.error('Falló la compilación de prueba:\n' + error.message)
      )
  }
})

// Render y Docker apagan el proceso con SIGTERM.
for (const senal of ['SIGTERM', 'SIGINT'])
  process.on(senal, () => {
    servidor.close()
    process.exit(0)
  })
