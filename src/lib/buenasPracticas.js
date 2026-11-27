// Buenas prácticas de programación que se chequean mientras el alumno arma su programa.
// Cada regla dice si se cumple y, si no, en qué bloques mostrar el aviso de Blockly.
// Para agregar una regla nueva alcanza con sumarla a la lista REGLAS de abajo.

const TIPOS_RAIZ = ['ejecutar_una_vez', 'ejecutar_por_siempre']
const DEFINIR = 'procedures_defnoreturn'
const LLAMAR = 'procedures_callnoreturn'

// Un procedimiento con más comandos que esto es "largo".
export const MAXIMO_COMANDOS_POR_PROCEDIMIENTO = 8

// ---------- Nombres significativos ----------

// Palabras que solas no dicen qué hace el procedimiento.
const NOMBRES_GENERICOS = new Set([
  'hacer algo',
  'hacer',
  'algo',
  'cosa',
  'cosas',
  'hacer cosa',
  'hacer cosas',
  'proc',
  'procedimiento',
  'procedimientos',
  'comando',
  'funcion',
  'bloque',
  'nombre',
  'nuevo',
  'nueva',
  'prueba',
  'probar',
  'test',
  'hola',
  'chau',
  'ejemplo',
  'tarea',
  'accion',
  'paso',
  'pasos',
  'parte',
  'programa'
])
// Tecleos al azar comunes.
const TECLEOS = ['asd', 'qwe', 'zxc', 'jkl', 'fgh', 'sdf', 'dfg', 'hjk']

/** Decide si el nombre de un procedimiento no dice nada de lo que hace. */
export const nombreNoSignificativo = nombre => {
  const limpio = (nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // sin tildes
    .replace(/[^a-zñ ]/g, ' ') // sin números ni signos
    .replace(/\s+/g, ' ')
    .trim()
  const letras = limpio.replace(/ /g, '')
  if (letras.length < 4) return true // "a", "p1", "abc"
  if (NOMBRES_GENERICOS.has(limpio)) return true // "Hacer algo 2", "prueba"
  if (/^(.)\1+$/.test(letras)) return true // "xxxx", "aaaa"
  if (!/[aeiou]/.test(letras)) return true // "sdfg", "prcd"
  if (TECLEOS.some(t => letras.includes(t))) return true // "asdasd", "qwerty"
  return false
}

// ---------- Ayudas para recorrer los bloques ----------

const esComando = b =>
  !!b.previousConnection && b.type !== DEFINIR && !TIPOS_RAIZ.includes(b.type)

const nombreDe = b => b.getFieldValue('NAME')

/** Los comandos encadenados a partir de un bloque (sin entrar en los de adentro). */
const cadena = primero => {
  const lista = []
  for (let b = primero; b; b = b.getNextBlock()) lista.push(b)
  return lista
}

/** Todas las cadenas de comandos del programa: cuerpos, adentro de Repetir, Si, etc. */
const todasLasCadenas = bloques => {
  const cadenas = []
  bloques.forEach(b => {
    b.inputList.forEach(input => {
      if (input.type !== 3 /* statement */) return
      const primero = input.connection?.targetBlock()
      if (primero) cadenas.push(cadena(primero))
    })
  })
  return cadenas
}

/** Una "huella" del bloque con todo lo que tiene adentro, para comparar si dos son iguales. */
const huella = (Blockly, b) =>
  JSON.stringify(
    Blockly.serialization.blocks.save(b, {
      addCoordinates: false,
      addNextBlocks: false,
      addInputBlocks: true,
      saveIds: false
    })
  )

/** ¿Está el bloque adentro de un procedimiento o del programa principal? */
const lugarDe = b => {
  for (let p = b.getParent(); p; p = p.getParent()) {
    if (p.type === DEFINIR) return 'procedimiento'
    if (TIPOS_RAIZ.includes(p.type)) return 'principal'
  }
  return null
}

const cuerpo = def => cadena(def.getInputTargetBlock('STACK'))

// ---------- Reglas ----------

const REGLAS = [
  {
    id: 'usa-procedimientos',
    titulo: 'Usás procedimientos',
    detalle: 'Definís al menos un procedimiento y lo llamás desde el programa.',
    evaluar: ({ defs, llamadas, raiz }) => {
      const nombresDefinidos = new Set(
        defs.filter(d => cuerpo(d).length).map(nombreDe)
      )
      const llamadoDesdeRaiz = llamadas.some(
        c => lugarDe(c) === 'principal' && nombresDefinidos.has(nombreDe(c))
      )
      return { cumple: !!raiz && llamadoDesdeRaiz, avisos: [] }
    }
  },
  {
    id: 'sin-sueltos',
    titulo: 'No hay comandos sueltos',
    detalle: 'Todos los comandos están adentro de un procedimiento.',
    evaluar: ({ bloques, ctx }) => {
      const cabezas = bloques.filter(b => esComando(b) && !b.getParent())
      return {
        cumple: cabezas.length === 0,
        avisos: cabezas.map(b => [b, ctx.avisoSuelto])
      }
    }
  },
  {
    id: 'principal-solo-procedimientos',
    titulo: 'El programa principal solo llama procedimientos',
    detalle: ctx => `En "${ctx.nombreRaiz}" solo hay procedimientos.`,
    evaluar: ({ raiz, ctx }) => {
      if (!raiz) return { cumple: true, avisos: [] }
      const intrusos = raiz
        .getDescendants(false)
        .filter(b => b !== raiz && esComando(b) && b.type !== LLAMAR)
        // Solo marcamos el de más afuera (no cada uno de los de adentro de un Repetir).
        .filter(b => b.getSurroundParent() === raiz)
      return {
        cumple: intrusos.length === 0,
        avisos: intrusos.map(b => [
          b,
          `En "${ctx.nombreRaiz}" solo puede haber procedimientos. Poné este comando adentro de un procedimiento.`
        ])
      }
    }
  },
  {
    id: 'nombres-significativos',
    titulo: 'Nombres significativos',
    detalle: 'Cada procedimiento tiene un nombre que dice lo que hace.',
    evaluar: ({ defs }) => {
      const malos = defs.filter(d => nombreNoSignificativo(nombreDe(d)))
      return {
        cumple: defs.length > 0 && malos.length === 0,
        avisos: malos.map(d => [
          d,
          'Este procedimiento no tiene un nombre significativo. Recordá cambiarle el nombre por uno significativo'
        ])
      }
    }
  },
  {
    id: 'sin-vacios',
    titulo: 'No hay procedimientos vacíos',
    detalle: 'Todos los procedimientos tienen comandos adentro.',
    evaluar: ({ defs }) => {
      const vacios = defs.filter(d => cuerpo(d).length === 0)
      return {
        cumple: defs.length > 0 && vacios.length === 0,
        avisos: vacios.map(d => [
          d,
          'Este procedimiento está vacío. Poné adentro los comandos que tiene que hacer.'
        ])
      }
    }
  },
  {
    id: 'todos-se-usan',
    titulo: 'Usás todos tus procedimientos',
    detalle: 'Cada procedimiento que definiste se llama en algún lado.',
    evaluar: ({ defs, llamadas, ctx }) => {
      const llamados = new Set(llamadas.filter(c => lugarDe(c)).map(nombreDe))
      // Uno vacío ya tiene su aviso; este aparece cuando ya tiene comandos.
      const sinUsar = defs.filter(
        d => cuerpo(d).length && !llamados.has(nombreDe(d))
      )
      return {
        cumple: defs.length > 0 && sinUsar.length === 0,
        avisos: sinUsar.map(d => [
          d,
          `Este procedimiento no se usa. Llamalo desde "${ctx.nombreRaiz}" o desde otro procedimiento.`
        ])
      }
    }
  },
  {
    id: 'sin-repetidos',
    titulo: 'No hay código repetido',
    detalle: ctx =>
      ctx.hayRepetir
        ? 'Lo que se repite está en un procedimiento o en un Repetir.'
        : 'Lo que se repite está en un procedimiento.',
    evaluar: ({ Blockly, defs, bloques, ctx }) => {
      const avisos = []
      const sugerencia = ctx.hayRepetir
        ? 'Podés hacer un procedimiento con ellos o usar un Repetir.'
        : 'Podés hacer un procedimiento con ellos y llamarlo dos veces.'

      // 1) Dos procedimientos que hacen exactamente lo mismo.
      const vistos = new Map()
      const repetidos = new Set()
      defs.forEach(d => {
        const pasos = cuerpo(d)
        if (!pasos.length) return
        const clave = pasos.map(b => huella(Blockly, b)).join('|')
        if (vistos.has(clave)) {
          repetidos.add(pasos[0])
          avisos.push([
            d,
            `Este procedimiento hace lo mismo que "${nombreDe(vistos.get(clave))}". Usá uno solo.`
          ])
        } else vistos.set(clave, d)
      })

      // 2) Comandos que se repiten uno atrás del otro (A B A B) en una misma cadena.
      const cadenas = todasLasCadenas(bloques)
      cadenas.forEach(lista => {
        const h = lista.map(b => huella(Blockly, b))
        for (let largo = Math.floor(h.length / 2); largo >= 2; largo--) {
          for (let i = 0; i + 2 * largo <= h.length; i++) {
            const iguales = h
              .slice(i, i + largo)
              .every((x, k) => x === h[i + largo + k])
            if (iguales) {
              avisos.push([
                lista[i + largo],
                `Estos comandos repiten los ${largo} de arriba. ${sugerencia}`
              ])
              return
            }
          }
        }
      })

      // 3) Una misma secuencia de 3 o más comandos en dos lugares distintos.
      const TRAMO = 3
      const tramos = new Map()
      cadenas.forEach((lista, n) => {
        if (repetidos.has(lista[0])) return
        const h = lista.map(b => huella(Blockly, b))
        for (let i = 0; i + TRAMO <= h.length; i++) {
          const clave = h.slice(i, i + TRAMO).join('|')
          const antes = tramos.get(clave)
          if (antes && antes.cadena !== n) {
            const bloque = lista[i]
            if (!avisos.some(([b]) => b === bloque))
              avisos.push([
                bloque,
                `Estos comandos ya están en otra parte del programa. ${sugerencia}`
              ])
            return
          }
          if (!antes) tramos.set(clave, { cadena: n })
        }
      })

      return { cumple: defs.length > 0 && avisos.length === 0, avisos }
    }
  },
  {
    id: 'procedimientos-cortos',
    titulo: 'Procedimientos cortos',
    detalle: `Ningún procedimiento tiene más de ${MAXIMO_COMANDOS_POR_PROCEDIMIENTO} comandos.`,
    evaluar: ({ defs }) => {
      const largos = defs
        .map(d => [
          d,
          d.getDescendants(false).filter(b => b !== d && esComando(b)).length
        ])
        .filter(([, n]) => n > MAXIMO_COMANDOS_POR_PROCEDIMIENTO)
      return {
        cumple: defs.length > 0 && largos.length === 0,
        avisos: largos.map(([d, n]) => [
          d,
          `Este procedimiento es muy largo (${n} comandos). Dividilo en procedimientos más chicos.`
        ])
      }
    }
  }
]

/**
 * Revisa el programa. Devuelve la lista de reglas (para el panel) y, por cada bloque que
 * tiene algo para mejorar, los avisos que le corresponden.
 */
export function revisarBuenasPracticas(Blockly, workspace, toolBoxDesafio) {
  // En el primer desafío todavía no hay procedimientos: los comandos van directo en
  // "Ejecutar 1 vez" y solo se avisa de los que quedan sueltos.
  const sinProcedimientos = String(toolBoxDesafio) === '1'
  const bloques = workspace.getAllBlocks(false).filter(b => !b.isInFlyout)
  const raiz = bloques.find(b => TIPOS_RAIZ.includes(b.type)) || null
  const ctx = {
    nombreRaiz:
      raiz?.type === 'ejecutar_por_siempre'
        ? 'Ejecutar por siempre'
        : 'Ejecutar 1 vez',
    // Desde la Clase 2 (desafío 4 en adelante) los alumnos tienen el bloque Repetir.
    hayRepetir: Number(toolBoxDesafio) >= 4,
    avisoSuelto: sinProcedimientos
      ? 'Estos bloques deberían estar adentro de "Ejecutar 1 vez".'
      : 'Estos bloques deberían estar en un procedimiento. ¡No puede haber comandos sin procedimientos!'
  }
  const datos = {
    Blockly,
    bloques,
    raiz,
    defs: bloques.filter(b => b.type === DEFINIR),
    llamadas: bloques.filter(b => b.type === LLAMAR),
    ctx
  }

  const avisos = new Map()
  const aRevisar = sinProcedimientos
    ? REGLAS.filter(r => r.id === 'sin-sueltos')
    : REGLAS
  const reglas = aRevisar.map(regla => {
    const { cumple, avisos: deLaRegla } = regla.evaluar(datos)
    deLaRegla.forEach(([bloque, texto]) => {
      if (!avisos.has(bloque)) avisos.set(bloque, [])
      avisos.get(bloque).push(texto)
    })
    return {
      id: regla.id,
      titulo: regla.titulo,
      detalle:
        typeof regla.detalle === 'function'
          ? regla.detalle(ctx)
          : regla.detalle,
      cumple
    }
  })
  return { reglas: sinProcedimientos ? [] : reglas, avisos }
}
