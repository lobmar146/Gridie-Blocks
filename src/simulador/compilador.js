// Compila el código Arduino del alumno a un .hex para el simulador.
//
// - En la app de escritorio (Electron) usa el arduino-cli que ya viene empaquetado.
// - En el navegador (modalidad a distancia por web) lo manda al servidor de compilación
//   (servidor-compilacion/). Su dirección se elige así (gana la primera que exista):
//     1. ?compilador=https://... en la dirección de la página (queda guardada en el navegador;
//        ?compilador=borrar la olvida). Sirve para probar contra otro servidor sin recompilar.
//     2. window.GRIDIE_CONFIG.compiladorUrl, que se define en public/config.js (se puede
//        editar en el sitio ya publicado, sin volver a compilar la web).
//     3. VITE_COMPILADOR_URL al compilar la web.
//     4. api/compilar en el mismo sitio (lo que pasa cuando el servidor de compilación también
//        sirve la web, o en desarrollo con npm run dev:web, donde lo atiende el propio Vite).

const CLAVE_GUARDADA = 'gridie-compilador-url'

function urlDelCompilador() {
  try {
    const pedida = new URLSearchParams(window.location.search).get('compilador')
    if (pedida === 'borrar') localStorage.removeItem(CLAVE_GUARDADA)
    else if (pedida) localStorage.setItem(CLAVE_GUARDADA, pedida)
    const guardada = localStorage.getItem(CLAVE_GUARDADA)
    if (guardada) return guardada
  } catch {
    // Sin localStorage (iframe con cookies bloqueadas, etc.): seguir con lo demás.
  }
  return (
    window.GRIDIE_CONFIG?.compiladorUrl ||
    import.meta.env.VITE_COMPILADOR_URL ||
    (import.meta.env.DEV ? '/api/compilar' : 'api/compilar')
  )
}

const esperar = ms => new Promise(resolve => setTimeout(resolve, ms))

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
  // Si el servidor está ocupado (503) se reintenta un par de veces antes de avisar.
  for (let intento = 0; ; intento++) {
    try {
      respuesta = await fetch(urlDelCompilador(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo })
      })
    } catch {
      throw new ErrorDeCompilacion(
        'No se pudo conectar con el servidor de compilación. Revisá tu conexión a internet.'
      )
    }
    if (respuesta.status !== 503 || intento >= 2) break
    await esperar(3000 * (intento + 1))
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
