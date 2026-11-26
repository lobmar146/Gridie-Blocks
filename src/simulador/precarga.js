import { escenaDelDesafio } from './escenas'

// En desarrollo la app vive en la raíz del servidor; en producción, al lado de index.html.
export const baseDeLaApp = () =>
  import.meta.env.MODE === 'development'
    ? `${window.location.origin}/`
    : document.baseURI

export const urlSimulador = ruta => new URL(`simulador/${ruta}`, baseDeLaApp()).href

let puentePromesa = null
export function cargarPuente() {
  if (!puentePromesa) {
    puentePromesa = import(
      /* @vite-ignore */ urlSimulador('gridie-simulador.js')
    ).catch(error => {
      puentePromesa = null
      throw error
    })
  }
  return puentePromesa
}

let hexVacioPromesa = null
export function cargarHexVacio() {
  if (!hexVacioPromesa) {
    hexVacioPromesa = fetch(urlSimulador('vacio.hex'))
      .then(async r => {
        if (!r.ok) throw new Error(`No se pudo cargar vacio.hex (${r.status})`)
        return new Uint8Array(await r.arrayBuffer())
      })
      .catch(error => {
        hexVacioPromesa = null
        throw error
      })
  }
  return hexVacioPromesa
}

/** Precarga en segundo plano el puente 3D, WASM, vacio.hex y las piezas del desafío. */
export function precargarSimuladorDesafio(toolBox) {
  cargarHexVacio().catch(() => {})
  cargarPuente()
    .then(puente => {
      const escena = toolBox ? escenaDelDesafio(toolBox)?.escena : undefined
      return puente.precargarSimulador?.({
        base: urlSimulador(''),
        escena
      })
    })
    .catch(() => {})
}
