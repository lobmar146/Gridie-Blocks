// Puente entre GrIDIE Blocks y ORBE.
// GrIDIE llama a montarSimulador() con la escena del desafío (scene.jsonc) y el .hex
// que compiló arduino-cli. El motor de ORBE corre en un Web Worker (WebAssembly) y el
// visor 3D se dibuja con su propio React dentro del elemento que nos pasan.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Viewer } from '../vendor/orbe-viewer/viewer'
import { workerSource } from '../vendor/orbe-viewer/worker-source'
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
let manifiesto: Promise<Map<string, Uint8Array>> | null = null

/** Descarga una sola vez todos los archivos de piezas que lista parts/manifest.json. */
function cargarPiezas(base: URL): Promise<Map<string, Uint8Array>> {
  if (manifiesto === null) {
    manifiesto = (async () => {
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
    manifiesto.catch(() => {
      manifiesto = null
    })
  }
  return manifiesto
}

export function montarSimulador(elemento: HTMLElement, opciones: OpcionesSimulador): Simulador {
  const base = new URL(opciones.base ?? './', import.meta.url)
  const source = workerSource(
    () => new Worker(new URL('orbe-wasm/worker.js', base), { type: 'module' }),
    async () => {
      const piezas = await cargarPiezas(base)
      const files = new Map(piezas)
      files.set('block.jsonc', encoder.encode(BLOCK_JSONC))
      files.set('scene.jsonc', encoder.encode(opciones.escena))
      files.set('build/sketch.hex', opciones.hex)
      return { name: 'gridie', files }
    }
  )
  let desuscribir: (() => void) | null = null
  let yaReprodujo = false
  desuscribir = source.subscribe(mensaje => {
    opciones.alMensaje?.(mensaje)
    if (opciones.reproducir && !yaReprodujo && mensaje.type === 'scene') {
      yaReprodujo = true
      source.send({ cmd: 'play' }).catch(() => {})
    }
  })
  const root = createRoot(elemento)
  root.render(
    <StrictMode>
      <Viewer source={source} />
    </StrictMode>
  )
  return {
    enviar: comando => source.send(comando),
    cerrar() {
      desuscribir?.()
      root.unmount()
      source.close()
    }
  }
}
