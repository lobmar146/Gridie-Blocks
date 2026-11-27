// Buenas prácticas de programación que se chequean mientras el alumno arma su programa.
// Cada regla dice si se cumple y, si no, en qué bloques mostrar el aviso de Blockly.
// Para agregar una regla nueva alcanza con sumarla a la lista REGLAS de abajo.
// Cada regla es de un tema: las de "repetitivas" y "alternativas" solo aparecen en los
// desafíos que traen esos bloques.

const TIPOS_RAIZ = ['ejecutar_una_vez', 'ejecutar_por_siempre']
const DEFINIR = 'procedures_defnoreturn'
const LLAMAR = 'procedures_callnoreturn'
const REPETIR = ['controls_repeat_ext', 'controls_for']
const SI = ['custom_if_condition', 'custom_if_else_condition']

export const TEMAS = [
  { id: 'procedimientos', titulo: 'Procedimientos' },
  { id: 'repetitivas', titulo: 'Repetitivas' },
  { id: 'alternativas', titulo: 'Alternativas' },
  { id: 'extra', titulo: 'Extra' }
]

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
    .replace(/[\u0300-\u036f]/g, '') // sin tildes
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
  b
    ? JSON.stringify(
        Blockly.serialization.blocks.save(b, {
          addCoordinates: false,
          addNextBlocks: true,
          addInputBlocks: true,
          saveIds: false
        })
      )
    : ''

/** Igual que huella, pero solo del bloque (sin los que le siguen abajo). */
const huellaSola = (Blockly, b) =>
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

/** Comandos que se repiten uno atrás del otro en una cadena: A A A, o A B A B. */
const repeticionesSeguidas = (Blockly, cadenas) => {
  const halladas = []
  cadenas.forEach(lista => {
    const h = lista.map(b => huellaSola(Blockly, b))
    // Un mismo comando 3 veces seguidas.
    for (let i = 0; i + 3 <= h.length; i++)
      if (h[i] === h[i + 1] && h[i] === h[i + 2]) {
        halladas.push({ bloque: lista[i + 1], largo: 1 })
        return
      }
    // Un grupo de 2 o más comandos dos veces seguidas.
    for (let largo = Math.floor(h.length / 2); largo >= 2; largo--)
      for (let i = 0; i + 2 * largo <= h.length; i++)
        if (h.slice(i, i + largo).every((x, k) => x === h[i + largo + k])) {
          halladas.push({ bloque: lista[i + largo], largo })
          return
        }
  })
  return halladas
}

/** ¿Se superponen los rectángulos de dos bloques en pantalla? */
const encimados = (a, b) => {
  const r1 = a.getBoundingRectangle()
  const r2 = b.getBoundingRectangle()
  return (
    r1.left < r2.right &&
    r2.left < r1.right &&
    r1.top < r2.bottom &&
    r2.top < r1.bottom
  )
}

const numeroDeVeces = rep => {
  if (rep.getField('TIMES')) return Number(rep.getFieldValue('TIMES'))
  const valor = rep.getInputTargetBlock('TIMES')
  if (!valor) return null
  if (valor.type === 'math_number') return Number(valor.getFieldValue('NUM'))
  return NaN // una cuenta u otra cosa: no la juzgamos
}

// ---------- Reglas ----------

const REGLAS = [
  // ===== Procedimientos =====
  {
    id: 'usa-procedimientos',
    tema: 'procedimientos',
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
    tema: 'procedimientos',
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
    tema: 'procedimientos',
    titulo: 'El programa principal solo llama procedimientos',
    detalle: ctx => `En "${ctx.nombreRaiz}" solo hay procedimientos.`,
    evaluar: ({ raiz, ctx }) => {
      if (!raiz) return { cumple: true, avisos: [] }
      const intrusos = raiz.getDescendants(false).filter(
        b =>
          b !== raiz &&
          esComando(b) &&
          b.type !== LLAMAR &&
          // Solo marcamos el de más afuera (no cada uno de los de adentro de un Repetir).
          b.getSurroundParent() === raiz
      )
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
    tema: 'procedimientos',
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
    tema: 'procedimientos',
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
    tema: 'procedimientos',
    titulo: 'Todo procedimiento se usa',
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
    tema: 'procedimientos',
    titulo: 'No hay código repetido',
    detalle: 'Lo que se repite está en un procedimiento.',
    evaluar: ({ Blockly, defs, cadenas, ctx }) => {
      const avisos = []
      const sugerencia =
        'Podés hacer un procedimiento con ellos y llamarlo dos veces.'

      // 1) Dos procedimientos que hacen exactamente lo mismo.
      const vistos = new Map()
      const repetidos = new Set()
      defs.forEach(d => {
        const primero = d.getInputTargetBlock('STACK')
        if (!primero) return
        const clave = huella(Blockly, primero)
        if (vistos.has(clave)) {
          repetidos.add(primero)
          avisos.push([
            d,
            `Este procedimiento hace lo mismo que "${nombreDe(vistos.get(clave))}". Usá uno solo.`
          ])
        } else vistos.set(clave, d)
      })

      // 2) Sin repetitivas todavía: comandos que se repiten uno atrás del otro (A B A B).
      if (!ctx.hayRepetir)
        repeticionesSeguidas(Blockly, cadenas)
          .filter(r => r.largo > 1)
          .forEach(({ bloque, largo }) =>
            avisos.push([
              bloque,
              `Estos comandos repiten los ${largo} de arriba. ${sugerencia}`
            ])
          )

      // 3) Una misma secuencia de 3 o más comandos en dos lugares distintos.
      const TRAMO = 3
      const tramos = new Map()
      cadenas.forEach((lista, n) => {
        if (repetidos.has(lista[0])) return
        const h = lista.map(b => huellaSola(Blockly, b))
        for (let i = 0; i + TRAMO <= h.length; i++) {
          const clave = h.slice(i, i + TRAMO).join('|')
          const antes = tramos.get(clave)
          if (antes !== undefined && antes !== n) {
            if (!avisos.some(([b]) => b === lista[i]))
              avisos.push([
                lista[i],
                `Estos comandos ya están en otra parte del programa. ${sugerencia}`
              ])
            return
          }
          if (antes === undefined) tramos.set(clave, n)
        }
      })

      return { cumple: defs.length > 0 && avisos.length === 0, avisos }
    }
  },
  {
    id: 'procedimientos-cortos',
    tema: 'procedimientos',
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
  },
  {
    id: 'programa-prolijo',
    tema: 'procedimientos',
    titulo: 'Programa prolijo',
    detalle: 'No hay bloques encimados: cada parte del programa se ve bien.',
    evaluar: ({ arriba, defs }) => {
      const avisos = []
      arriba.forEach((a, i) =>
        arriba.slice(i + 1).forEach(b => {
          if (encimados(a, b) && !avisos.some(([x]) => x === b))
            avisos.push([
              b,
              'Este bloque está encimado con otro. Separalos, o hacé clic derecho en el fondo y elegí "Limpiar los bloques".'
            ])
        })
      )
      return { cumple: defs.length > 0 && avisos.length === 0, avisos }
    }
  },

  // ===== Repetitivas =====
  {
    id: 'usa-repetir',
    tema: 'repetitivas',
    titulo: 'Usás repetitivas',
    detalle: 'Usás un Repetir para lo que se hace varias veces.',
    evaluar: ({ bloques }) => ({
      cumple: bloques.some(
        b =>
          REPETIR.includes(b.type) && b.getInputTargetBlock('DO') && lugarDe(b)
      ),
      avisos: []
    })
  },
  {
    id: 'repetir-en-vez-de-copiar',
    tema: 'repetitivas',
    titulo: 'Lo que se repite va en un Repetir',
    detalle: 'No copiás los mismos comandos uno atrás del otro.',
    evaluar: ({ Blockly, cadenas, defs }) => {
      const avisos = repeticionesSeguidas(Blockly, cadenas).map(
        ({ bloque, largo }) => [
          bloque,
          largo === 1
            ? 'Este comando se repite varias veces seguidas. Esto podría expresarse con un Repetir.'
            : `Estos comandos repiten los ${largo} de arriba. Esto podría expresarse con un Repetir.`
        ]
      )
      return { cumple: defs.length > 0 && avisos.length === 0, avisos }
    }
  },
  {
    id: 'repetir-bien-armado',
    tema: 'repetitivas',
    titulo: 'Repetir bien armado',
    detalle: 'Cada Repetir tiene comandos adentro y repite más de una vez.',
    evaluar: ({ bloques }) => {
      const avisos = []
      const repetires = bloques.filter(b => REPETIR.includes(b.type))
      repetires.forEach(r => {
        if (!r.getInputTargetBlock('DO'))
          avisos.push([
            r,
            'Este Repetir está vacío. Poné adentro lo que hay que repetir.'
          ])
        if (r.type !== 'controls_repeat_ext') return
        const veces = numeroDeVeces(r)
        if (veces === null)
          avisos.push([r, 'A este Repetir le falta cuántas veces repetir.'])
        else if (veces <= 1)
          avisos.push([
            r,
            `Repetir ${veces} ${veces === 1 ? 'vez' : 'veces'} es lo mismo que no repetir. ¿Cuántas veces hace falta?`
          ])
      })
      return { cumple: repetires.length > 0 && avisos.length === 0, avisos }
    }
  },

  // ===== Alternativas =====
  {
    id: 'usa-si',
    tema: 'alternativas',
    titulo: 'Usás alternativas',
    detalle: 'Usás un Si para que el programa decida según un sensor.',
    evaluar: ({ bloques }) => ({
      cumple: bloques.some(
        b =>
          SI.includes(b.type) &&
          b.getInputTargetBlock('CONDITION') &&
          b.getInputTargetBlock('DO') &&
          lugarDe(b)
      ),
      avisos: []
    })
  },
  {
    id: 'si-completo',
    tema: 'alternativas',
    titulo: 'Alternativas completas',
    detalle: 'Cada Si tiene su condición y hace algo en cada caso.',
    evaluar: ({ bloques }) => {
      const avisos = []
      const sis = bloques.filter(b => SI.includes(b.type))
      sis.forEach(si => {
        if (!si.getInputTargetBlock('CONDITION'))
          avisos.push([
            si,
            'A este Si le falta la condición: poné un sensor en el hueco.'
          ])
        if (!si.getInputTargetBlock('DO'))
          avisos.push([
            si,
            'Este Si no hace nada cuando se cumple la condición.'
          ])
        if (
          si.type === 'custom_if_else_condition' &&
          !si.getInputTargetBlock('ELSE')
        )
          avisos.push([
            si,
            'El "sino" está vacío. Si no hace falta, usá un Si sin "sino".'
          ])
      })
      return { cumple: sis.length > 0 && avisos.length === 0, avisos }
    }
  },
  {
    id: 'si-sin-preguntas-de-mas',
    tema: 'alternativas',
    titulo: 'Sin preguntas de más',
    detalle:
      'No preguntás dos veces lo mismo ni hacés lo mismo en los dos casos.',
    evaluar: ({ Blockly, bloques, cadenas }) => {
      const avisos = []
      const condicion = si =>
        huella(Blockly, si.getInputTargetBlock('CONDITION'))
      const sis = bloques.filter(b => SI.includes(b.type))

      // Un Si/sino que hace lo mismo en los dos casos.
      sis
        .filter(si => si.type === 'custom_if_else_condition')
        .forEach(si => {
          const enSi = huella(Blockly, si.getInputTargetBlock('DO'))
          if (enSi && enSi === huella(Blockly, si.getInputTargetBlock('ELSE')))
            avisos.push([
              si,
              'Este Si hace lo mismo en los dos casos: no hace falta preguntar.'
            ])
        })

      // Un Si adentro de otro Si que pregunta lo mismo.
      sis.forEach(si => {
        const c = condicion(si)
        if (!c) return
        for (let p = si.getSurroundParent(); p; p = p.getSurroundParent())
          if (SI.includes(p.type) && condicion(p) === c) {
            avisos.push([
              si,
              'Ya estás adentro de un Si que pregunta lo mismo. Esta pregunta sobra.'
            ])
            return
          }
      })

      // Dos Si seguidos con la misma condición.
      cadenas.forEach(lista =>
        lista.forEach((b, i) => {
          const sig = lista[i + 1]
          if (
            sig &&
            SI.includes(b.type) &&
            SI.includes(sig.type) &&
            condicion(b) &&
            condicion(b) === condicion(sig)
          )
            avisos.push([
              sig,
              'Esta condición ya se pregunta en el Si de arriba. Juntalos en uno solo.'
            ])
        })
      )

      return { cumple: sis.length > 0 && avisos.length === 0, avisos }
    }
  },

  // ===== Extra =====
  {
    id: 'programa-extra-prolijo',
    tema: 'extra',
    puntos: 20,
    titulo: 'Programa extra prolijo',
    detalle: ctx =>
      `"${ctx.nombreRaiz}" llama a un solo procedimiento que describe toda la solución.`,
    evaluar: ({ raiz, defs }) => {
      const adentro = raiz
        ? cadena(
            raiz.getInputTargetBlock(
              raiz.inputList.find(i => i.type === 3)?.name
            )
          )
        : []
      const unico = adentro.length === 1 && adentro[0].type === LLAMAR
      const def = unico && defs.find(d => nombreDe(d) === nombreDe(adentro[0]))
      return {
        cumple: !!def && !nombreNoSignificativo(nombreDe(def)),
        avisos: []
      }
    }
  }
]

const PUNTOS_POR_REGLA = 10

/** Los tipos de bloque que trae la caja de bloques de un desafío. */
const tiposDeLaCaja = caja => {
  const tipos = new Set()
  const recorrer = x => {
    if (!x || typeof x !== 'object') return
    if (typeof x.type === 'string') tipos.add(x.type)
    Object.values(x).forEach(recorrer)
  }
  recorrer(caja)
  return tipos
}

/**
 * Revisa el programa. Devuelve la lista de reglas (para el panel) y, por cada bloque que
 * tiene algo para mejorar, los avisos que le corresponden.
 */
export function revisarBuenasPracticas(
  Blockly,
  workspace,
  toolBoxDesafio,
  caja
) {
  // En el primer desafío todavía no hay procedimientos: los comandos van directo en
  // "Ejecutar 1 vez" y solo se avisa de los que quedan sueltos.
  const sinProcedimientos = String(toolBoxDesafio) === '1'
  const tipos = tiposDeLaCaja(caja)
  const bloques = workspace.getAllBlocks(false).filter(b => !b.isInFlyout)
  const raiz = bloques.find(b => TIPOS_RAIZ.includes(b.type)) || null
  const ctx = {
    nombreRaiz:
      raiz?.type === 'ejecutar_por_siempre'
        ? 'Ejecutar por siempre'
        : 'Ejecutar 1 vez',
    hayRepetir: REPETIR.some(t => tipos.has(t)),
    haySi: SI.some(t => tipos.has(t)),
    avisoSuelto: sinProcedimientos
      ? 'Estos bloques deberían estar adentro de "Ejecutar 1 vez".'
      : 'Estos bloques deberían estar en un procedimiento. ¡No puede haber comandos sin procedimientos!'
  }
  const datos = {
    Blockly,
    bloques,
    raiz,
    arriba: workspace.getTopBlocks(false),
    cadenas: todasLasCadenas(bloques),
    defs: bloques.filter(b => b.type === DEFINIR),
    llamadas: bloques.filter(b => b.type === LLAMAR),
    ctx
  }

  const aRevisar = sinProcedimientos
    ? REGLAS.filter(r => r.id === 'sin-sueltos')
    : REGLAS.filter(
        r =>
          (r.tema !== 'repetitivas' || ctx.hayRepetir) &&
          (r.tema !== 'alternativas' || ctx.haySi)
      )

  const avisos = new Map()
  const reglas = aRevisar.map(regla => {
    const { cumple, avisos: deLaRegla } = regla.evaluar(datos)
    deLaRegla.forEach(([bloque, texto]) => {
      if (!avisos.has(bloque)) avisos.set(bloque, [])
      if (!avisos.get(bloque).includes(texto)) avisos.get(bloque).push(texto)
    })
    return {
      id: regla.id,
      tema: regla.tema,
      titulo: regla.titulo,
      detalle:
        typeof regla.detalle === 'function'
          ? regla.detalle(ctx)
          : regla.detalle,
      puntos: regla.puntos ?? PUNTOS_POR_REGLA,
      cumple
    }
  })
  return { reglas: sinProcedimientos ? [] : reglas, avisos }
}

/** Puntaje que lleva el alumno y el máximo posible. */
export const puntaje = reglas => ({
  hechos: reglas.filter(r => r.cumple).reduce((t, r) => t + r.puntos, 0),
  total: reglas.reduce((t, r) => t + r.puntos, 0)
})
