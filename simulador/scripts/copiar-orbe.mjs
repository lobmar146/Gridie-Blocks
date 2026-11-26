// Copia el motor de ORBE (WebAssembly) y las piezas a public/simulador, y escribe
// parts/manifest.json con la lista de archivos que el puente descarga.
// Las piezas propias de GrIDIE (piezas/) se copian encima de las de ORBE.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const aca = path.dirname(fileURLToPath(import.meta.url))
const raiz = path.join(aca, '..')
const destino = path.join(raiz, '..', 'public', 'simulador')

fs.rmSync(path.join(destino, 'orbe-wasm'), { recursive: true, force: true })
fs.rmSync(path.join(destino, 'parts'), { recursive: true, force: true })
fs.cpSync(path.join(raiz, 'vendor', 'orbe-wasm'), path.join(destino, 'orbe-wasm'), { recursive: true })
fs.cpSync(path.join(raiz, 'vendor', 'orbe-parts'), path.join(destino, 'parts'), { recursive: true })
if (fs.existsSync(path.join(raiz, 'piezas'))) {
  fs.cpSync(path.join(raiz, 'piezas'), path.join(destino, 'parts'), { recursive: true })
}

const rutas = []
const recorrer = (dir, rel) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) recorrer(path.join(dir, e.name), r)
    else if (r !== 'manifest.json' && !/^LICENSE|NOTICE/.test(e.name)) rutas.push(r)
  }
}
recorrer(path.join(destino, 'parts'), '')
rutas.sort()
fs.writeFileSync(path.join(destino, 'parts', 'manifest.json'), JSON.stringify(rutas))
console.log(`simulador: ${rutas.length} archivos de piezas en public/simulador/parts`)
