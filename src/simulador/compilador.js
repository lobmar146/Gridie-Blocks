// Compila el código Arduino del alumno a un .hex para el simulador.
//
// - En la app de escritorio (Electron) usa el arduino-cli que ya viene empaquetado.
// - En el navegador (modalidad a distancia por web) lo manda al servidor de compilación
//   (servidor-compilacion/). Su dirección se configura con VITE_COMPILADOR_URL; por defecto
//   es /api/compilar, que en desarrollo (npm run dev:web) atiende el propio Vite.

const URL_COMPILADOR = import.meta.env.VITE_COMPILADOR_URL || '/api/compilar'

export class ErrorDeCompilacion extends Error {}

const MAXIMO_CACHE_HEX = 30
const cacheHexCliente = new Map()

/** Devuelve los bytes del .hex, o lanza ErrorDeCompilacion con el mensaje del compilador. */
export async function compilar(codigo) {
  const cacheado = cacheHexCliente.get(codigo)
  if (cacheado !== undefined) return new TextEncoder().encode(cacheado)

  if (window.electronAPI?.compilarCodigo) {
    try {
      const hex = await window.electronAPI.compilarCodigo(codigo)
      if (cacheHexCliente.size >= MAXIMO_CACHE_HEX) {
        cacheHexCliente.delete(cacheHexCliente.keys().next().value)
      }
      cacheHexCliente.set(codigo, hex)
      return new TextEncoder().encode(hex)
    } catch (error) {
      throw new ErrorDeCompilacion(
        limpiarMensaje(String(error?.message ?? error))
      )
    }
  }

  let respuesta
  try {
    respuesta = await fetch(URL_COMPILADOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo })
    })
  } catch {
    throw new ErrorDeCompilacion(
      'No se pudo conectar con el servidor de compilación. Revisá tu conexión a internet.'
    )
  }
  const cuerpo = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok || !cuerpo.hex) {
    throw new ErrorDeCompilacion(
      limpiarMensaje(
        cuerpo.error ||
          `El servidor de compilación respondió ${respuesta.status}`
      )
    )
  }
  if (cacheHexCliente.size >= MAXIMO_CACHE_HEX) {
    cacheHexCliente.delete(cacheHexCliente.keys().next().value)
  }
  cacheHexCliente.set(codigo, cuerpo.hex)
  return new TextEncoder().encode(cuerpo.hex)
}

// Saca el prefijo de Electron y las rutas temporales para que el error se lea mejor.
function limpiarMensaje(mensaje) {
  return mensaje
    .replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
    .replace(/[^\s]*[\\/]sketch[\\/]sketch\.ino:/g, 'línea ')
    .trim()
}
