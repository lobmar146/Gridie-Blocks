// Compila un sketch de Arduino Uno con arduino-cli y devuelve el texto del .hex.
// Lo usan el servidor de compilación (servidor.mjs) y el modo desarrollo de Vite.
//
// - Caché por hash (SHA-256) del código: en memoria y, si se indica CARPETA_CACHE, también en disco.
//   Muchos alumnos mandan el mismo programa, así que la mayoría de los pedidos no compila nada.
// - Cola con límite: compila de a CONCURRENCIA por vez (por defecto 1) y rechaza pedidos si
//   ya hay COLA_MAXIMA esperando, para que el servidor no se quede sin memoria.
// - Si dos alumnos mandan el mismo código a la vez, se compila una sola vez.
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Si no se configura nada, se usa el arduino-cli que ya trae GrIDIE en electron/
// (core AVR en electron/arduino-data/arduino15 y Servo en electron/arduino-data/libraries).
const ELECTRON = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'electron'
)
const DATOS = path.join(ELECTRON, 'arduino-data')

function cliPorDefecto() {
  const exe = path.join(ELECTRON, 'arduino-cli.exe')
  if (process.platform === 'win32' && existsSync(exe)) return exe
  return 'arduino-cli'
}

function configPorDefecto() {
  // Fuera de Windows, el core de electron/ no sirve (sus herramientas son .exe):
  // se usa la instalación normal de arduino-cli (arduino-cli core install arduino:avr).
  if (process.platform !== 'win32') return undefined
  const arduino15 = path.join(DATOS, 'arduino15')
  if (!existsSync(path.join(arduino15, 'packages', 'arduino', 'hardware', 'avr')))
    return undefined
  const archivo = path.join(os.tmpdir(), 'gridie-arduino-cli.yaml')
  const datos = arduino15.replace(/\\/g, '/')
  writeFileSync(archivo, `directories:\n  data: "${datos}"\n  user: "${datos}"\n`)
  return archivo
}

function libreriasPorDefecto() {
  const carpeta = path.join(DATOS, 'libraries')
  return existsSync(carpeta) ? carpeta : undefined
}

const numero = (valor, porDefecto) =>
  Number.isFinite(Number(valor)) && Number(valor) > 0 ? Number(valor) : porDefecto

export const MAXIMO_CODIGO = 200_000 // bytes
const TIEMPO_MAXIMO = numero(process.env.TIEMPO_MAXIMO_MS, 60_000)
const MAXIMO_CACHE_MEMORIA = numero(process.env.CACHE_MEMORIA, 500)
const CONCURRENCIA = numero(process.env.CONCURRENCIA, 1)
const COLA_MAXIMA = numero(process.env.COLA_MAXIMA, 30)
const CARPETA_CACHE = process.env.CARPETA_CACHE || ''

export class ServidorOcupado extends Error {}
export class ErrorDelPrograma extends Error {}

// ---------- Caché ----------

const cacheHex = new Map() // hash -> hex (orden de inserción = LRU sencillo)

function leerDeMemoria(hash) {
  const hex = cacheHex.get(hash)
  if (hex === undefined) return undefined
  cacheHex.delete(hash)
  cacheHex.set(hash, hex)
  return hex
}

function guardarEnMemoria(hash, hex) {
  cacheHex.delete(hash)
  cacheHex.set(hash, hex)
  while (cacheHex.size > MAXIMO_CACHE_MEMORIA)
    cacheHex.delete(cacheHex.keys().next().value)
}

async function leerDeDisco(hash) {
  if (!CARPETA_CACHE) return undefined
  try {
    return await fs.readFile(path.join(CARPETA_CACHE, `${hash}.hex`), 'utf8')
  } catch {
    return undefined
  }
}

async function guardarEnDisco(hash, hex) {
  if (!CARPETA_CACHE) return
  try {
    await fs.mkdir(CARPETA_CACHE, { recursive: true })
    const temporal = path.join(CARPETA_CACHE, `${hash}.${process.pid}.tmp`)
    await fs.writeFile(temporal, hex)
    await fs.rename(temporal, path.join(CARPETA_CACHE, `${hash}.hex`))
  } catch (error) {
    console.warn('No se pudo guardar en la caché de disco:', error.message)
  }
}

// ---------- Compilación ----------

function opcionesEfectivas(opciones = {}) {
  return {
    cli: opciones.cli ?? process.env.ARDUINO_CLI ?? cliPorDefecto(),
    config:
      opciones.config ?? process.env.ARDUINO_CLI_CONFIG ?? configPorDefecto(),
    librerias:
      opciones.librerias ?? process.env.ARDUINO_LIBRERIAS ?? libreriasPorDefecto()
  }
}

function hashDe(codigo, { cli, config, librerias }) {
  return createHash('sha256')
    .update(`arduino:avr:uno\0${cli}\0${config ?? ''}\0${librerias ?? ''}\0`)
    .update(codigo)
    .digest('hex')
}

function validar(codigo) {
  if (typeof codigo !== 'string' || codigo.trim().length === 0)
    throw new ErrorDelPrograma('No hay código para compilar.')
  if (Buffer.byteLength(codigo) > MAXIMO_CODIGO)
    throw new ErrorDelPrograma('El programa es demasiado largo.')
}

// Cada "lugar" de compilación tiene su propia carpeta de build, que se reutiliza entre
// compilaciones: así el core de Arduino se compila una sola vez y después cada programa
// tarda pocos segundos.
const lugaresLibres = Array.from({ length: CONCURRENCIA }, (_, i) =>
  path.join(os.tmpdir(), `gridie-avr-build-${i}`)
)

async function correrArduinoCli(codigo, rutaBuild, { cli, config, librerias }) {
  await fs.mkdir(rutaBuild, { recursive: true })
  const carpeta = await fs.mkdtemp(path.join(os.tmpdir(), 'gridie-'))
  try {
    const sketch = path.join(carpeta, 'sketch')
    const salida = path.join(carpeta, 'salida')
    await fs.mkdir(sketch)
    await fs.writeFile(path.join(sketch, 'sketch.ino'), codigo)
    const args = []
    if (config) args.push('--config-file', config)
    args.push(
      'compile',
      '--fqbn',
      'arduino:avr:uno',
      '--build-path',
      rutaBuild,
      '--output-dir',
      salida
    )
    if (librerias) args.push('--libraries', librerias)
    args.push(sketch)
    await new Promise((resolve, reject) => {
      execFile(
        cli,
        args,
        { timeout: TIEMPO_MAXIMO, maxBuffer: 4 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error?.code === 'ENOENT')
            reject(
              new Error(
                `No se encontró arduino-cli (${cli}). Instalalo o indicá su ruta en la variable ARDUINO_CLI.`
              )
            )
          else if (error?.killed)
            reject(new Error('La compilación tardó demasiado.'))
          else if (error)
            reject(
              new ErrorDelPrograma((stderr || stdout || error.message).trim())
            )
          else resolve()
        }
      )
    })
    return await fs.readFile(path.join(salida, 'sketch.ino.hex'), 'utf8')
  } finally {
    await fs.rm(carpeta, { recursive: true, force: true })
  }
}

// ---------- Cola ----------

const esperando = [] // funciones que arrancan cuando se libera un lugar
const enCurso = new Map() // hash -> Promise<hex>, para no compilar dos veces lo mismo

export const estadisticas = {
  pedidos: 0,
  desdeCache: 0,
  compilados: 0,
  errores: 0,
  rechazados: 0,
  get enCola() {
    return esperando.length
  },
  get compilando() {
    return CONCURRENCIA - lugaresLibres.length
  },
  get enCacheMemoria() {
    return cacheHex.size
  },
  concurrencia: CONCURRENCIA,
  colaMaxima: COLA_MAXIMA
}

async function conLugar(tarea) {
  let lugar
  if (lugaresLibres.length > 0) lugar = lugaresLibres.pop()
  else {
    if (esperando.length >= COLA_MAXIMA) {
      estadisticas.rechazados++
      throw new ServidorOcupado(
        'El servidor de compilación está muy ocupado. Probá de nuevo en unos segundos.'
      )
    }
    // El que termina le pasa su lugar directamente al primero que espera.
    lugar = await new Promise(resolve => esperando.push(resolve))
  }
  try {
    return await tarea(lugar)
  } finally {
    const siguiente = esperando.shift()
    if (siguiente) siguiente(lugar)
    else lugaresLibres.push(lugar)
  }
}

/**
 * Compila (o saca de la caché) y devuelve el texto del .hex.
 * @param {string} codigo  El .ino generado por GrIDIE.
 * @param {{ cli?: string, config?: string, librerias?: string }} opciones
 *   cli: ruta a arduino-cli (por defecto ARDUINO_CLI o "arduino-cli" del PATH).
 *   config: --config-file de arduino-cli (por defecto ARDUINO_CLI_CONFIG).
 *   librerias: carpeta de librerías extra, por ejemplo Servo (por defecto ARDUINO_LIBRERIAS).
 */
export async function compilarEnCola(codigo, opciones) {
  validar(codigo)
  estadisticas.pedidos++
  const efectivas = opcionesEfectivas(opciones)
  const hash = hashDe(codigo, efectivas)

  const enMemoria = leerDeMemoria(hash)
  if (enMemoria !== undefined) {
    estadisticas.desdeCache++
    return enMemoria
  }
  if (enCurso.has(hash)) {
    estadisticas.desdeCache++
    return enCurso.get(hash)
  }

  const trabajo = (async () => {
    const enDisco = await leerDeDisco(hash)
    if (enDisco !== undefined) {
      estadisticas.desdeCache++
      guardarEnMemoria(hash, enDisco)
      return enDisco
    }
    try {
      const hex = await conLugar(lugar =>
        correrArduinoCli(codigo, lugar, efectivas)
      )
      estadisticas.compilados++
      guardarEnMemoria(hash, hex)
      await guardarEnDisco(hash, hex)
      return hex
    } catch (error) {
      if (!(error instanceof ServidorOcupado)) estadisticas.errores++
      throw error
    }
  })()
  enCurso.set(hash, trabajo)
  try {
    return await trabajo
  } finally {
    enCurso.delete(hash)
  }
}

// Se mantiene por compatibilidad con el código anterior.
export const compilarSketch = compilarEnCola

/** Atiende POST { codigo } y responde { hex } o { error }. Sirve para node:http y para Vite. */
export function manejarPedido(req, res, opciones) {
  const responder = (estado, cuerpo) => {
    if (res.headersSent) return
    res.statusCode = estado
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    if (estado === 503) res.setHeader('Retry-After', '5')
    res.end(JSON.stringify(cuerpo))
  }
  if (req.method !== 'POST') return responder(405, { error: 'Usá POST.' })
  const partes = []
  let largo = 0
  let cortado = false
  req.on('data', parte => {
    largo += parte.length
    if (largo > MAXIMO_CODIGO * 2) {
      cortado = true
      responder(413, { error: 'El programa es demasiado largo.' })
      req.destroy()
    } else partes.push(parte)
  })
  req.on('end', async () => {
    if (cortado) return
    let codigo
    try {
      codigo = JSON.parse(Buffer.concat(partes).toString('utf8')).codigo
    } catch {
      return responder(400, { error: 'Pedido inválido.' })
    }
    try {
      responder(200, { hex: await compilarEnCola(codigo, opciones) })
    } catch (error) {
      if (error instanceof ServidorOcupado)
        responder(503, { error: error.message })
      else if (error instanceof ErrorDelPrograma)
        responder(400, { error: error.message })
      else {
        console.error('Error del servidor de compilación:', error.message)
        responder(500, { error: error.message })
      }
    }
  })
}
