// El simulador se abre en una ventana aparte. La pantalla del desafío le pasa el programa
// del alumno por localStorage, que avisa a las otras ventanas con el evento "storage": así
// la ventana del simulador ve cada cambio en los bloques.

const claveCodigo = toolBox => `gridie-codigo-${toolBox}`

/** Lo llama la pantalla del desafío cada vez que cambia el programa. */
export function publicarCodigo(toolBox, codigo) {
  try {
    localStorage.setItem(claveCodigo(toolBox), codigo ?? '')
  } catch {
    // sin almacenamiento, la ventana no se entera de los cambios
  }
}

export function leerCodigo(toolBox) {
  try {
    return localStorage.getItem(claveCodigo(toolBox)) ?? ''
  } catch {
    return ''
  }
}

/** Llama a `alCambiar(codigo)` cada vez que otra ventana publica el programa. */
export function escucharCodigo(toolBox, alCambiar) {
  const escuchar = evento => {
    if (evento.key === claveCodigo(toolBox)) alCambiar(evento.newValue ?? '')
  }
  window.addEventListener('storage', escuchar)
  return () => window.removeEventListener('storage', escuchar)
}

/** La dirección de la ventana del simulador (HashRouter en producción). */
function urlDeLaVentana(toolBox, { titulo, esquema }) {
  const consulta = new URLSearchParams()
  if (titulo) consulta.set('titulo', titulo)
  if (esquema) consulta.set('esquema', esquema)
  const ruta = `/ventana-simulador/${toolBox}?${consulta}`
  if (import.meta.env.MODE === 'development')
    return new URL(ruta, window.location.origin).href
  const url = new URL(window.location.href)
  url.hash = ruta
  return url.href
}

/**
 * Abre (o trae al frente) la ventana del simulador del desafío. Devuelve false si el
 * navegador bloqueó la ventana emergente.
 */
export function abrirVentanaSimulador(toolBox, datos = {}) {
  const ancho = Math.min(1280, window.screen.availWidth - 40)
  const alto = Math.min(860, window.screen.availHeight - 40)
  const ventana = window.open(
    urlDeLaVentana(toolBox, datos),
    `gridie-simulador-${toolBox}`,
    `popup,width=${ancho},height=${alto}`
  )
  if (!ventana) return false
  ventana.focus()
  return true
}
