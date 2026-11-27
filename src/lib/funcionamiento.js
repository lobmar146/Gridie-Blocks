// Revisa si el programa, aunque compile, hace cosas que no se llegan a ver: un LED que se
// prende y se apaga sin un Esperar en el medio, o un servo que se mueve y enseguida hace
// otra cosa. Se usa al terminar la simulación o la subida, para avisar que el desafío
// todavía no está resuelto.

const TIPOS_RAIZ = ['ejecutar_una_vez', 'ejecutar_por_siempre']
const ESPERAR = ['esperar_un_segundo', 'esperar_x_milisegundos']
const SERVO = ['aumentar_grados_servo', 'reducir_grados_servo']
const REPETIR = ['controls_repeat_ext', 'controls_for']
const SI = ['custom_if_condition', 'custom_if_else_condition']

/** Qué LED toca un bloque y si lo prende o lo apaga (o null si no es de LED). */
const accionDeLed = tipo => {
  if (tipo === 'encerled') return { led: 'pin13', prende: true }
  if (tipo === 'apagarled') return { led: 'pin13', prende: false }
  const m = /^(Encender|Apagar)(.+)$/.exec(tipo)
  return m ? { led: m[2], prende: m[1] === 'Encender' } : null
}

/**
 * La lista de cosas que hace el programa, en orden: prender/apagar LED, mover servo o esperar.
 * Los Repetir y "Ejecutar por siempre" se recorren dos veces, para ver qué pasa cuando
 * vuelven a empezar. Los procedimientos se recorren donde se los llama.
 */
function recorrer(primero, defs, pila = []) {
  const pasos = []
  for (let b = primero; b; b = b.getNextBlock()) {
    if (b.isEnabled && !b.isEnabled()) continue
    if (ESPERAR.includes(b.type)) pasos.push({ tipo: 'esperar' })
    else if (SERVO.includes(b.type)) pasos.push({ tipo: 'servo', bloque: b })
    else if (accionDeLed(b.type))
      pasos.push({ tipo: 'led', bloque: b, ...accionDeLed(b.type) })
    else if (REPETIR.includes(b.type)) {
      const cuerpo = recorrer(b.getInputTargetBlock('DO'), defs, pila)
      pasos.push(...cuerpo, ...cuerpo)
    } else if (SI.includes(b.type)) {
      pasos.push(...recorrer(b.getInputTargetBlock('DO'), defs, pila))
    } else if (b.type === 'procedures_callnoreturn') {
      const nombre = b.getFieldValue('NAME')
      if (pila.includes(nombre)) continue
      const def = defs.find(d => d.getFieldValue('NAME') === nombre)
      if (def)
        pasos.push(
          ...recorrer(def.getInputTargetBlock('STACK'), defs, [...pila, nombre])
        )
    }
  }
  return pasos
}

/** Devuelve 'servo', 'led' o null según lo que no se llega a ver. */
export function problemaDeTiempo(workspace) {
  const bloques = workspace.getAllBlocks(false)
  const raiz = bloques.find(b => TIPOS_RAIZ.includes(b.type))
  if (!raiz) return null
  const defs = bloques.filter(b => b.type === 'procedures_defnoreturn')
  const entrada =
    raiz.type === 'ejecutar_por_siempre' ? 'LOOP_CODE' : 'SETUP_CODE'
  let pasos = recorrer(raiz.getInputTargetBlock(entrada), defs)
  if (raiz.type === 'ejecutar_por_siempre') pasos = [...pasos, ...pasos]

  for (let i = 0; i < pasos.length; i++) {
    const paso = pasos[i]
    // Un servo que, sin esperar, enseguida hace otra cosa.
    if (
      paso.tipo === 'servo' &&
      pasos[i + 1] &&
      pasos[i + 1].tipo !== 'esperar'
    )
      return 'servo'
    // Un LED que cambia y vuelve a cambiar antes de un Esperar.
    if (paso.tipo === 'led')
      for (let j = i + 1; j < pasos.length && pasos[j].tipo !== 'esperar'; j++)
        if (pasos[j].tipo === 'led' && pasos[j].led === paso.led) {
          if (pasos[j].prende !== paso.prende) return 'led'
          break
        }
  }
  return null
}

/**
 * ¿Hay un Apagar al que no le sigue ningún Esperar hasta que termina el programa? Igual se
 * ve apagado (queda así), pero lo ideal es decir cuánto tiempo está apagado, como al encender.
 */
export function apagaSinEsperar(workspace) {
  const bloques = workspace.getAllBlocks(false)
  const raiz = bloques.find(b => b.type === 'ejecutar_una_vez')
  if (!raiz) return false
  const defs = bloques.filter(b => b.type === 'procedures_defnoreturn')
  const pasos = recorrer(raiz.getInputTargetBlock('SETUP_CODE'), defs)
  return pasos.some(
    (paso, i) =>
      paso.tipo === 'led' &&
      !paso.prende &&
      !pasos.slice(i + 1).some(p => p.tipo === 'esperar')
  )
}
