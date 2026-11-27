// ¿El programa hizo lo que pide la consigna? Mientras corre la simulación se anota cada
// cambio de los pines que importan en el desafío (con su tiempo); al terminar se compara
// con lo esperado. Vale cualquier programa que logre ese comportamiento.

// Un estado que dura menos que esto no se llega a ver (un LED que se prende y se apaga
// enseguida, por ejemplo), así que no cuenta.
export const VISIBLE_MS = 150

const repetir = (pasos, veces) =>
  Array.from({ length: veces }, () => pasos).flat()

/**
 * Lo esperado en cada desafío, por número de toolbox. `pasos` es la secuencia de estados que
 * se tienen que ver, en orden: cada paso dice qué pines tienen que estar en 1 (prendido) o
 * 0 (apagado) y, si hace falta, cuánto tiempo como mínimo (minMs). Entre un paso y otro
 * puede pasar cualquier otra cosa.
 */
export const ESPERADO = {
  // Ejercicio 1: encender el LED del pin 13.
  1: {
    pasos: [{ pines: { D13: 1 } }],
    pista: 'El LED del pin 13 tiene que prenderse.'
  },
  // Problema 1: parpadear una vez, 1 segundo prendido y 1 segundo apagado.
  2: {
    pasos: [
      { pines: { D13: 1 }, minMs: 800 },
      { pines: { D13: 0 }, minMs: 800 }
    ],
    pista:
      'El LED tiene que quedar prendido 1 segundo y después apagado 1 segundo.'
  },
  // Ejercicio 2: semáforo, encender A (rojo, D7), B (amarillo, D6) y C (verde, D5) en orden.
  3: {
    pasos: [{ pines: { D7: 1 } }, { pines: { D6: 1 } }, { pines: { D5: 1 } }],
    pista: 'Las luces del semáforo tienen que prenderse en orden: A, B y C.'
  },
  // Clase 2, Ejercicio 1: parpadear 30 veces.
  4: {
    pasos: repetir([{ pines: { D13: 1 } }, { pines: { D13: 0 } }], 30),
    pista:
      'El LED tiene que parpadear 30 veces, y cada cambio se tiene que ver.'
  }
}

/** Los pines que hay que anotar en este desafío (o ninguno si no tiene verificación). */
export const pinesAVigilar = toolBox => {
  const esperado = ESPERADO[Number(toolBox)]
  if (!esperado) return []
  return [...new Set(esperado.pasos.flatMap(p => Object.keys(p.pines)))]
}

/**
 * Compara lo que pasó con lo esperado.
 * `cambios`: [{ ms, pines: { D13: 1, ... } }] en orden, uno por cada vez que algo cambió.
 * `finMs`: hasta cuándo corrió la simulación.
 * Devuelve null si el desafío no tiene verificación, o { resuelto, pista }.
 */
export function verificar(toolBox, cambios, finMs) {
  const esperado = ESPERADO[Number(toolBox)]
  if (!esperado) return null

  // Los tramos que se llegan a ver: cada estado con cuánto duró.
  const tramos = cambios
    .map((c, i) => ({
      pines: c.pines,
      duracion: (cambios[i + 1]?.ms ?? finMs) - c.ms
    }))
    .filter(t => t.duracion >= VISIBLE_MS)

  // Buscamos los pasos en orden: cada uno en un tramo posterior al del paso anterior.
  let desde = 0
  for (const paso of esperado.pasos) {
    const minimo = paso.minMs ?? VISIBLE_MS
    const encontrado = tramos.findIndex(
      (t, i) =>
        i >= desde &&
        t.duracion >= minimo &&
        Object.entries(paso.pines).every(
          ([pin, valor]) => t.pines[pin] === valor
        )
    )
    if (encontrado < 0) return { resuelto: false, pista: esperado.pista }
    desde = encontrado + 1
  }
  return { resuelto: true, pista: null }
}
