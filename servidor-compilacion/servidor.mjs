// Servidor de compilación para la modalidad a distancia por web.
// Recibe el código que genera GrIDIE Blocks y devuelve el .hex que corre el simulador.
//
//   ARDUINO_CLI=/ruta/arduino-cli PUERTO=8787 node servidor-compilacion/servidor.mjs
//
// Variables: ARDUINO_CLI, ARDUINO_CLI_CONFIG, ARDUINO_LIBRERIAS, PUERTO,
// ORIGEN_PERMITIDO (para CORS; por defecto "*").
import http from 'node:http'
import { manejarPedido } from './compilar.mjs'

const puerto = Number(process.env.PUERTO || 8787)
const origen = process.env.ORIGEN_PERMITIDO || '*'

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', origen)
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }
    if (req.url !== '/api/compilar') {
      res.statusCode = 404
      res.end()
      return
    }
    manejarPedido(req, res)
  })
  .listen(puerto, () =>
    console.log(
      `Servidor de compilación en http://localhost:${puerto}/api/compilar`
    )
  )
