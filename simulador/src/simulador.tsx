// Puente entre GrIDIE Blocks y ORBE.
// GrIDIE llama a montarSimulador() con la escena del desafío (scene.jsonc) y el .hex
// que compiló arduino-cli. El motor de ORBE corre en un Web Worker (WebAssembly) y el
// visor 3D se dibuja con su propio React dentro del elemento que nos pasan.
import { createRoot } from 'react-dom/client'
import { Viewer } from '../vendor/orbe-viewer/viewer'
import { workerSource, type ReusableSessionSource } from '../vendor/orbe-viewer/worker-source'
import type { Command, Reply, ToViewer } from '../vendor/orbe-viewer/protocol'

export interface OpcionesSimulador {
  /** Texto de scene.jsonc. Su placa debe usar "firmware": "build/sketch.hex". */
  escena: string
  /** El .hex compilado del programa del alumno. */
  hex: Uint8Array
  /** Carpeta donde están gridie-simulador.js, orbe-wasm/ y parts/ (por defecto, la de este módulo). */
  base?: string
  /** Arranca la simulación apenas abre. */
  reproducir?: boolean
  /** Recibe cada mensaje del simulador (scene, frame, reply, closed). */
  alMensaje?: (mensaje: ToViewer) => void
}

export interface Simulador {
  enviar(comando: Command): Promise<Reply>
  actualizar(opciones: Partial<Omit<OpcionesSimulador, 'base'>>): void
  cerrar(): void
}

const encoder = new TextEncoder()

// ORBE trata la carpeta como un "Block" (y lee las piezas del catálogo que le pasamos)
// solo si tiene block.jsonc.
const BLOCK_JSONC = JSON.stringify({
  format: 1,
  block: 'gridie-desafio',
  version: '0.1.0',
  title: 'Desafío de GrIDIE Blocks',
  summary: 'El programa del alumno, compilado por GrIDIE Blocks, en el circuito del desafío.',
  board: 'uno-board',
  tags: ['gridie'],
  license: 'MIT'
})

type IndicePiezas = Record<string, { files: string[]; deps: string[] }>

let indicePromesa: Promise<IndicePiezas | null> | null = null
let manifiestoCompleto: Promise<Map<string, Uint8Array>> | null = null
const cachePiezasPorId = new Map<string, Promise<Map<string, Uint8Array>>>()

function cargarIndicePiezas(base: URL): Promise<IndicePiezas | null> {
  if (indicePromesa === null) {
    indicePromesa = fetch(new URL('parts/deps.json', base))
      .then(res => (res.ok ? (res.json() as Promise<IndicePiezas>) : null))
      .catch(() => null)
  }
  return indicePromesa
}

function extraerTiposDeEscena(escena: string): string[] {
  const tipos = new Set<string>()
  for (const m of escena.matchAll(/"type"\s*:\s*"([^"]+)"/g)) {
    tipos.add(m[1])
  }
  return [...tipos]
}

function resolverPiezasNecesarias(indice: IndicePiezas, raices: string[]): string[] {
  const visitadas = new Set<string>()
  const cola = [...raices]
  while (cola.length > 0) {
    const id = cola.shift()!
    if (visitadas.has(id) || !indice[id]) continue
    visitadas.add(id)
    for (const dep of indice[id].deps) {
      if (!visitadas.has(dep)) cola.push(dep)
    }
  }
  return [...visitadas]
}

function cargarUnaPieza(base: URL, id: string, archivosDePieza: string[]): Promise<Map<string, Uint8Array>> {
  const existente = cachePiezasPorId.get(id)
  if (existente) return existente
  const promesa = (async () => {
    const mapa = new Map<string, Uint8Array>()
    await Promise.all(
      archivosDePieza.map(async archivo => {
        const ruta = `${id}/${archivo}`
        const r = await fetch(new URL(`parts/${ruta}`, base))
        if (!r.ok) throw new Error(`No se pudo cargar la pieza ${ruta} (${r.status})`)
        mapa.set(`parts/${ruta}`, new Uint8Array(await r.arrayBuffer()))
      })
    )
    return mapa
  })()
  promesa.catch(() => {
    cachePiezasPorId.delete(id)
  })
  cachePiezasPorId.set(id, promesa)
  return promesa
}

/** Descarga una sola vez todos los archivos de piezas (fallback si no existe deps.json). */
function cargarTodasLasPiezas(base: URL): Promise<Map<string, Uint8Array>> {
  if (manifiestoCompleto === null) {
    manifiestoCompleto = (async () => {
      const res = await fetch(new URL('parts/manifest.json', base))
      if (!res.ok) throw new Error(`No se encontró parts/manifest.json (${res.status})`)
      const rutas: string[] = await res.json()
      const archivos = new Map<string, Uint8Array>()
      await Promise.all(
        rutas.map(async ruta => {
          const r = await fetch(new URL(`parts/${ruta}`, base))
          if (!r.ok) throw new Error(`No se pudo cargar la pieza ${ruta} (${r.status})`)
          archivos.set(`parts/${ruta}`, new Uint8Array(await r.arrayBuffer()))
        })
      )
      return archivos
    })()
    manifiestoCompleto.catch(() => {
      manifiestoCompleto = null
    })
  }
  return manifiestoCompleto
}

/** Descarga solo las piezas necesarias para la escena (con caché por pieza en memoria). */
async function cargarPiezasDeEscena(base: URL, escena: string): Promise<Map<string, Uint8Array>> {
  const indice = await cargarIndicePiezas(base)
  if (!indice) return cargarTodasLasPiezas(base)
  const necesarias = resolverPiezasNecesarias(indice, extraerTiposDeEscena(escena))
  const mapas = await Promise.all(necesarias.map(id => cargarUnaPieza(base, id, indice[id].files)))
  const resultado = new Map<string, Uint8Array>()
  for (const mapa of mapas) {
    for (const [ruta, bytes] of mapa) resultado.set(ruta, bytes)
  }
  return resultado
}

/** Precarga el índice de piezas (y opcionalmente las piezas de una escena y el binario WASM en caché HTTP). */
export async function precargarSimulador(opciones: { base?: string; escena?: string } = {}): Promise<void> {
  const base = new URL(opciones.base ?? './', import.meta.url)
  const tareas: Promise<unknown>[] = [
    fetch(new URL('orbe-wasm/orbe_wasm_bg.wasm', base)).catch(() => {}),
    cargarIndicePiezas(base)
  ]
  if (opciones.escena) {
    tareas.push(cargarPiezasDeEscena(base, opciones.escena).catch(() => {}))
  }
  await Promise.all(tareas)
}

export function montarSimulador(elemento: HTMLElement, opciones: OpcionesSimulador): Simulador {
  const base = new URL(opciones.base ?? './', import.meta.url)
  let escenaActual = opciones.escena
  let hexActual = opciones.hex
  let reproducirActual = Boolean(opciones.reproducir)
  let alMensajeActual = opciones.alMensaje
  let yaReprodujo = false

  const armarBloque = async () => {
    const files = await cargarPiezasDeEscena(base, escenaActual)
    files.set('block.jsonc', encoder.encode(BLOCK_JSONC))
    files.set('scene.jsonc', encoder.encode(escenaActual))
    files.set('build/sketch.hex', hexActual)
    return { name: 'gridie', files }
  }

  const source: ReusableSessionSource = workerSource(
    () => new Worker(new URL('orbe-wasm/worker.js', base), { type: 'module' }),
    armarBloque
  )
  let desuscribir: (() => void) | null = null
  desuscribir = source.subscribe(mensaje => {
    alMensajeActual?.(mensaje)
    if (reproducirActual && !yaReprodujo && mensaje.type === 'scene') {
      yaReprodujo = true
      source.send({ cmd: 'play' }).catch(() => {})
    }
  })
  const root = createRoot(elemento)
  root.render(<Viewer source={source} />)
  return {
    enviar: comando => source.send(comando),
    actualizar(nuevasOpciones) {
      if (nuevasOpciones.escena !== undefined) escenaActual = nuevasOpciones.escena
      if (nuevasOpciones.hex !== undefined) hexActual = nuevasOpciones.hex
      if (nuevasOpciones.reproducir !== undefined) reproducirActual = nuevasOpciones.reproducir
      if (nuevasOpciones.alMensaje !== undefined) alMensajeActual = nuevasOpciones.alMensaje
      yaReprodujo = false
      source.reload(armarBloque)
    },
    cerrar() {
      desuscribir?.()
      root.unmount()
      source.close()
    }
  }
}
