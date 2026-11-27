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
  /** La escena ya se ve en pantalla y (si `reproducir`) el programa está por arrancar. */
  alListo?: () => void
  /** Modo rápido: 1 (normal), 2 o 4 veces más rápido que el tiempo real. */
  velocidad?: number
}

export interface Simulador {
  enviar(comando: Command): Promise<Reply>
  actualizar(opciones: Partial<Omit<OpcionesSimulador, 'base'>>): void
  /** Cambia la velocidad de la simulación en curso (y de las que se abran después). */
  velocidad(factor: number): void
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

// Una vista: un visor de ORBE con su propio Worker, dibujado en una capa del elemento.
interface Capa {
  div: HTMLDivElement
  source: ReusableSessionSource
  root: ReturnType<typeof createRoot>
  desuscribir: () => void
  worker: Worker | null
}

/**
 * Monta el simulador en `elemento`. `actualizar` cambia la escena o el programa: arma una
 * vista nueva en una capa oculta y, cuando ya muestra la escena, la pone en lugar de la
 * anterior, así el alumno nunca ve la pantalla en negro mientras carga. (Reabrir la escena en
 * el mismo visor dejaba la vista en negro.) Las piezas quedan en memoria entre vistas.
 */
export function montarSimulador(elemento: HTMLElement, opciones: OpcionesSimulador): Simulador {
  const base = new URL(opciones.base ?? './', import.meta.url)
  let actual: OpcionesSimulador = { ...opciones }
  let visible: Capa | null = null
  let pendiente: Capa | null = null
  let cerrado = false

  const cerrarCapa = (capa: Capa | null) => {
    if (!capa) return
    capa.desuscribir()
    capa.root.unmount()
    capa.source.close()
    capa.div.remove()
  }

  const crearCapa = (opc: OpcionesSimulador, alMostrarse: (capa: Capa) => void): Capa => {
    const div = document.createElement('div')
    div.style.cssText = 'position:absolute;inset:0;'
    elemento.appendChild(div)
    const armarBloque = async () => {
      const files = await cargarPiezasDeEscena(base, opc.escena)
      files.set('block.jsonc', encoder.encode(BLOCK_JSONC))
      files.set('scene.jsonc', encoder.encode(opc.escena))
      files.set('build/sketch.hex', opc.hex)
      return { name: 'gridie', files }
    }
    // workerSource crea el Worker en el momento; lo guardamos para cambiarle la velocidad.
    let worker: Worker | null = null
    const source: ReusableSessionSource = workerSource(() => {
      worker = new Worker(new URL('orbe-wasm/worker.js', base), { type: 'module' })
      worker.postMessage({ type: 'velocidad', factor: actual.velocidad ?? 1 })
      return worker
    }, armarBloque)
    let yaReprodujo = false
    let llegoEscena = false
    let lista = false
    let mostrada = false
    let respaldo = 0
    const capa: Capa = { div, source, root: createRoot(div), desuscribir: () => {}, worker }
    const mostrar = () => {
      if (mostrada) return
      mostrada = true
      alMostrarse(capa)
    }
    // Se da play recién cuando la escena ya se ve: el motor corre con el reloj real, y si
    // arrancara mientras el visor carga los modelos 3D y compila los sombreadores (~1 s), el
    // alumno se perdería el comienzo del programa (los primeros parpadeos del setup, etc.).
    const arrancar = () => {
      if (cerrado || yaReprodujo || !llegoEscena || !lista) return
      if (capa !== visible && capa !== pendiente) return
      window.clearTimeout(respaldo)
      mostrar()
      opc.alListo?.()
      if (!opc.reproducir) return
      yaReprodujo = true
      // Un cuadro más, para que la capa ya esté a la vista cuando el programa empiece.
      requestAnimationFrame(() => {
        if (cerrado || (capa !== visible && capa !== pendiente)) return
        source.send({ cmd: 'play' }).catch(() => {})
      })
    }
    const alEstarLista = () => {
      lista = true
      arrancar()
    }
    capa.desuscribir = source.subscribe(mensaje => {
      if (cerrado) return
      if (capa !== visible && capa !== pendiente) return
      opc.alMensaje?.(mensaje)
      if (mensaje.type === 'scene') {
        llegoEscena = true
        // Por si el visor nunca avisa (una pieza que no carga, etc.): arrancar igual.
        window.clearTimeout(respaldo)
        respaldo = window.setTimeout(alEstarLista, 5000)
        arrancar()
      } else if (mensaje.type === 'closed') {
        window.clearTimeout(respaldo)
        mostrar()
      }
    })
    const desuscribirMensajes = capa.desuscribir
    capa.desuscribir = () => {
      window.clearTimeout(respaldo)
      desuscribirMensajes()
    }
    capa.root.render(<Viewer source={source} onReady={alEstarLista} sinEstado />)
    return capa
  }

  if (getComputedStyle(elemento).position === 'static') elemento.style.position = 'relative'
  visible = crearCapa(actual, () => {})

  return {
    enviar: comando =>
      visible ? visible.source.send(comando) : Promise.reject(new Error('simulador cerrado')),
    actualizar(nuevasOpciones) {
      if (cerrado) return
      actual = { ...actual, ...nuevasOpciones }
      cerrarCapa(pendiente)
      const nueva = crearCapa(actual, capa => {
        if (cerrado || capa !== pendiente) return
        const vieja = visible
        visible = capa
        pendiente = null
        capa.div.style.visibility = 'visible'
        cerrarCapa(vieja)
      })
      nueva.div.style.visibility = 'hidden'
      pendiente = nueva
    },
    velocidad(factor) {
      actual = { ...actual, velocidad: factor }
      for (const capa of [visible, pendiente])
        capa?.worker?.postMessage({ type: 'velocidad', factor })
    },
    cerrar() {
      cerrado = true
      cerrarCapa(pendiente)
      cerrarCapa(visible)
      pendiente = null
      visible = null
    }
  }
}
