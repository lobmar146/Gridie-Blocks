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
// Programa vacío para mostrar el circuito en la etapa de conexión, antes de compilar nada.
fs.copyFileSync(path.join(raiz, 'vacio.hex'), path.join(destino, 'vacio.hex'))
if (fs.existsSync(path.join(raiz, 'piezas'))) {
  fs.cpSync(path.join(raiz, 'piezas'), path.join(destino, 'parts'), { recursive: true })
}

const destinoParts = path.join(destino, 'parts')
const rutas = []
const recorrer = (dir, rel) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) recorrer(path.join(dir, e.name), r)
    else if (r !== 'manifest.json' && r !== 'deps.json' && !/^LICENSE|NOTICE/.test(e.name)) rutas.push(r)
  }
}
recorrer(destinoParts, '')
rutas.sort()
fs.writeFileSync(path.join(destinoParts, 'manifest.json'), JSON.stringify(rutas))

// Índice por pieza con sus archivos y sub-piezas ("type") para descargar solo lo que usa cada escena.
const ids = new Set(
  fs
    .readdirSync(destinoParts, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
)
const deps = {}
for (const id of [...ids].sort()) {
  const dir = path.join(destinoParts, id)
  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && !/^LICENSE|NOTICE/.test(e.name))
    .map(e => e.name)
    .sort()
  const sub = new Set()
  const partJson = path.join(dir, 'part.jsonc')
  if (fs.existsSync(partJson)) {
    const txt = fs.readFileSync(partJson, 'utf8')
    for (const m of txt.matchAll(/"type"\s*:\s*"([^"]+)"/g)) {
      if (ids.has(m[1]) && m[1] !== id) sub.add(m[1])
    }
  }
  deps[id] = { files, deps: [...sub].sort() }
}
fs.writeFileSync(path.join(destinoParts, 'deps.json'), JSON.stringify(deps))
console.log(`simulador: ${rutas.length} archivos de piezas (${ids.size} piezas) en public/simulador/parts`)
