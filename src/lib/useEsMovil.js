import { useEffect, useState } from 'react'

// Pantallas chicas (celulares, y tablets chicas en vertical): el desafío se muestra
// una pantalla por vez, con botones Siguiente / Atrás.
export const CONSULTA_MOVIL =
  '(max-width: 767px), (max-height: 500px) and (pointer: coarse)'

export const esPantallaMovil = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(CONSULTA_MOVIL).matches

const useEsMovil = () => {
  const [esMovil, setEsMovil] = useState(esPantallaMovil)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined
    const consulta = window.matchMedia(CONSULTA_MOVIL)
    const alCambiar = () => setEsMovil(consulta.matches)
    alCambiar()
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])

  return esMovil
}

export default useEsMovil
