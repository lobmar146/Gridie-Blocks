// Compila un sketch de Arduino Uno con arduino-cli y devuelve el texto del .hex.
// Lo usan el servidor de compilación (servidor.mjs) y el modo desarrollo de Vite.
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const MAXIMO_CODIGO = 200_000 // bytes
const TIEMPO_MAXIMO = 60_000 // ms

/**
 * @param {string} codigo  El .ino generado por GrIDIE.
 * @param {{ cli?: string, config?: string, librerias?: string }} opciones
 *   cli: ruta a arduino-cli (por defecto ARDUINO_CLI o "arduino-cli" del PATH).
 *   config: --config-file de arduino-cli (por defecto ARDUINO_CLI_CONFIG).
 *   librerias: carpeta de librerías extra, por ejemplo Servo (por defecto ARDUINO_LIBRERIAS).
 */
export async function compilarSketch(codigo, opciones = {}) {
  if (typeof codigo !== 'string' || codigo.length === 0)
    throw new Error('No hay código para compilar.')
  if (codigo.length > MAXIMO_CODIGO)
    throw new Error('El programa es demasiado largo.')

  const cli = opciones.cli ?? process.env.ARDUINO_CLI ?? 'arduino-cli'
  const config = opciones.config ?? process.env.ARDUINO_CLI_CONFIG
  const librerias = opciones.librerias ?? process.env.ARDUINO_LIBRERIAS

  const carpeta = await fs.mkdtemp(path.join(os.tmpdir(), 'gridie-'))
  try {
    const sketch = path.join(carpeta, 'sketch')
    const salida = path.join(carpeta, 'salida')
    await fs.mkdir(sketch)
    await fs.writeFile(path.join(sketch, 'sketch.ino'), codigo)
    const args = []
    if (config) args.push('--config-file', config)
    args.push('compile', '--fqbn', 'arduino:avr:uno', '--output-dir', salida)
    if (librerias) args.push('--libraries', librerias)
    args.push(sketch)
    await new Promise((resolve, reject) => {
      execFile(
        cli,
        args,
        { timeout: TIEMPO_MAXIMO },
        (error, stdout, stderr) => {
          if (error)
            reject(new Error((stderr || stdout || error.message).trim()))
          else resolve()
        }
      )
    })
    return await fs.readFile(path.join(salida, 'sketch.ino.hex'), 'utf8')
  } finally {
    await fs.rm(carpeta, { recursive: true, force: true })
  }
}

// Una compilación por vez: arduino-cli usa bastante CPU y memoria.
let cola = Promise.resolve()
export function compilarEnCola(codigo, opciones) {
  const resultado = cola.then(() => compilarSketch(codigo, opciones))
  cola = resultado.catch(() => {})
  return resultado
}

/** Atiende POST { codigo } y responde { hex } o { error }. Sirve para node:http y para Vite. */
export function manejarPedido(req, res, opciones) {
  const responder = (estado, cuerpo) => {
    res.statusCode = estado
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(cuerpo))
  }
  if (req.method !== 'POST') return responder(405, { error: 'Usá POST.' })
  let datos = ''
  req.on('data', parte => {
    datos += parte
    if (datos.length > MAXIMO_CODIGO * 2) req.destroy()
  })
  req.on('end', async () => {
    try {
      const { codigo } = JSON.parse(datos)
      responder(200, { hex: await compilarEnCola(codigo, opciones) })
    } catch (error) {
      responder(400, { error: error.message })
    }
  })
}
