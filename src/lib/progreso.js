// Registro de los desafíos que terminó el alumno, para que vea en la página principal qué
// hizo y con cuántos puntos de buenas prácticas. Es una guía para el alumno, no una nota:
// queda solo en este navegador (localStorage).
//
// Un desafío cuenta como terminado cuando aparece el cartel de felicitación: el simulador
// verificó que hace lo que pide la consigna, o (en los que no se pueden verificar) cumple
// todas las buenas prácticas. Se guarda el mejor puntaje que sacó.

import { useEffect, useState } from 'react'

const CLAVE = 'gridie-progreso'
const EVENTO = 'gridie-progreso'

/** { [toolBox]: { puntos, total, fecha } } con los desafíos terminados. */
export function leerProgreso() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || '{}')
    return datos && typeof datos === 'object' ? datos : {}
  } catch {
    return {}
  }
}

/** Lo que se sabe de un desafío (o null si todavía no lo terminó). */
export const progresoDe = toolBox => leerProgreso()[String(toolBox)] ?? null

/**
 * Anota que el desafío se terminó con `puntos` de `total`. Si ya estaba terminado, se queda
 * con el mejor puntaje (y la fecha en que lo sacó).
 */
export function registrarTerminado(toolBox, { puntos = 0, total = 0 } = {}) {
  const todos = leerProgreso()
  const clave = String(toolBox)
  const antes = todos[clave]
  if (antes && antes.puntos >= puntos) return antes
  todos[clave] = { puntos, total, fecha: new Date().toISOString() }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(todos))
    window.dispatchEvent(new Event(EVENTO))
  } catch {
    // Sin almacenamiento (modo privado, disco lleno): no se recuerda, pero no se rompe nada.
  }
  return todos[clave]
}

/** El progreso, actualizado si cambia (en esta pestaña o en otra). */
export function useProgreso() {
  const [progreso, setProgreso] = useState(leerProgreso)
  useEffect(() => {
    const releer = () => setProgreso(leerProgreso())
    window.addEventListener(EVENTO, releer)
    window.addEventListener('storage', releer)
    return () => {
      window.removeEventListener(EVENTO, releer)
      window.removeEventListener('storage', releer)
    }
  }, [])
  return progreso
}
