// Arma la escena (scene.jsonc de ORBE) de cada desafío a partir de la lista de
// componentes que usa. Cada componente ocupa unas columnas de la protoboard y se
// cablea al pin del Arduino Uno que usa el generador de código de GrIDIE:
//
//   LED ................ D13          Semáforo ....... rojo D7, amarillo D6, verde D5
//   Servo .............. D2           Sensor PIR / IR  D4
//   Parlante ........... D12          Ultrasónico .... (simulado en A1, ver codigoSimulador.js)
//   Humedad en tierra .. A0
//
// Las escenas usan piezas reales del catálogo de ORBE. Los sensores que ORBE todavía no
// tiene se representan con una pieza equivalente que da la misma señal al Arduino:
// el PIR y el IR con un pulsador (detecta = HIGH), la humedad y la distancia con un
// potenciómetro. El panel del simulador muestra controles con nombres de sensores.

// Las dos protoboards de ORBE. Se usa la chica si los componentes entran, así el circuito
// se ve más grande. `riel` dice en qué columnas hay agujeros en los rieles + y -.
const PROTOBOARDS = {
  chica: {
    tipo: 'breadboard-400',
    columnas: 30,
    xArduino: -90,
    riel: col => col >= 1 && col <= 29 && col % 6 !== 0
  },
  grande: {
    tipo: 'breadboard-830',
    columnas: 63,
    xArduino: -128,
    riel: col => col >= 3 && col <= 61 && col % 6 !== 2
  }
}

class NoEntra extends Error {}

/** Componentes disponibles. `columnas` es cuántas columnas de la protoboard ocupa. */
const COMPONENTES = {
  led: { columnas: 6 },
  sensorDigital: { columnas: 4 },
  sensorDigitalBajo: { columnas: 7 },
  potenciometro: { columnas: 5 },
  parlante: { columnas: 8 },
  servo: { columnas: 0 }
}

const COLOR_CABLE = {
  rojo: '#d12b2b',
  negro: '#161616',
  amarillo: '#f2c21c',
  naranja: '#f28c1c',
  verde: '#2e9e44',
  azul: '#2b6bd1'
}

function crearConstructor(protoboard, { pin5V = '5V', pinGND = 'GND' } = {}) {
  const existeRiel = protoboard.riel
  const parts = {
    uno: { type: 'uno-board', firmware: 'build/sketch.hex' },
    bb: { type: protoboard.tipo }
  }
  const layout = {
    uno: { at: [protoboard.xArduino, 0, 0] },
    bb: { at: [0, 0, 0] }
  }
  const wires = []
  // Un cable desde un pin del Arduino. Si el alumno todavía no eligió el pin, no se dibuja.
  const alArduino = (pin, hacia, color) => {
    if (pin) wires.push([`uno.${pin}`, hacia, { color }])
  }
  alArduino(pin5V, 'bb.W3', COLOR_CABLE.rojo)
  alArduino(pinGND, 'bb.X3', COLOR_CABLE.negro)
  const usados = new Set(['W3', 'X3'])
  let columna = 5

  // Un agujero libre del riel `riel` cerca de la columna `col`.
  const riel = (nombre, col) => {
    for (let d = 0; d < 6; d++) {
      for (const c of [col + d, col - d]) {
        const id = `${nombre}${c}`
        if (existeRiel(c) && !usados.has(id)) {
          usados.add(id)
          return `bb.${id}`
        }
      }
    }
    throw new Error(
      `No hay lugar en el riel ${nombre} cerca de la columna ${col}`
    )
  }

  const reservar = tipo => {
    const c = columna
    columna += COMPONENTES[tipo].columnas
    if (columna > protoboard.columnas) throw new NoEntra()
    return c
  }

  return {
    /** LED con su resistencia de 220 ohm. */
    led(id, pin, color = 'rojo') {
      const c = reservar('led')
      const tipoLed = {
        rojo: 'led-5mm',
        amarillo: 'led-5mm-yellow',
        verde: 'led-5mm-green',
        azul: 'led-5mm-blue',
        blanco: 'led-5mm-white'
      }[color]
      parts[`r_${id}`] = { type: 'resistor-axial', resistance: '220' }
      parts[id] = { type: tipoLed }
      layout[`r_${id}`] = { on: { a: `bb.d${c}` } } // b en d{c+4}
      layout[id] = { on: { anode: `bb.c${c + 4}` } } // cátodo en c{c+5}
      alArduino(pin, `bb.a${c}`, COLOR_CABLE[color] ?? COLOR_CABLE.amarillo)
      wires.push([
        `bb.a${c + 5}`,
        riel('X', c + 5),
        { color: COLOR_CABLE.negro }
      ])
    },

    /** Sensor de salida digital (PIR, obstáculos IR): un pulsador con resistencia de pull-down.
     * Apretado = el sensor detecta = HIGH. */
    sensorDigital(id, pin, { activoEnBajo = false } = {}) {
      if (activoEnBajo) return this.sensorDigitalBajo(id, pin)
      // La resistencia de pull-down cae en el riel X de la columna c+2: tiene que haber agujero.
      while (!existeRiel(columna + 2)) columna++
      const c = reservar('sensorDigital')
      parts[id] = { type: 'tactile-switch-6mm' }
      parts[`r_${id}`] = { type: 'resistor-axial', resistance: '10k' }
      layout[id] = { on: { a: `bb.f${c + 2}` }, rotate: [0, 0, 90] } // a en la columna c+2, b en c
      layout[`r_${id}`] = { on: { a: `bb.b${c + 2}` }, rotate: [0, 0, -90] } // b al riel X
      wires.push([`bb.a${c}`, riel('W', c), { color: COLOR_CABLE.rojo }])
      alArduino(pin, `bb.j${c + 2}`, COLOR_CABLE.verde)
    },

    /** Sensor que da LOW cuando detecta (el de obstáculos IR): pulsador a GND y
     * resistencia de pull-up a 5V. */
    sensorDigitalBajo(id, pin) {
      const c = reservar('sensorDigitalBajo')
      parts[id] = { type: 'tactile-switch-6mm' }
      parts[`r_${id}`] = { type: 'resistor-axial', resistance: '10k' }
      layout[id] = { on: { a: `bb.f${c + 2}` }, rotate: [0, 0, 90] } // a en la columna c+2, b en c
      layout[`r_${id}`] = { on: { a: `bb.d${c + 2}` } } // b en d{c+6}
      wires.push([`bb.a${c}`, riel('X', c), { color: COLOR_CABLE.negro }])
      wires.push([
        `bb.a${c + 6}`,
        riel('W', c + 6),
        { color: COLOR_CABLE.rojo }
      ])
      alArduino(pin, `bb.j${c + 2}`, COLOR_CABLE.verde)
    },

    /** Potenciómetro entre GND y 5V, con el cursor en una entrada analógica. */
    potenciometro(id, pin, posicion = 0.5) {
      const c = reservar('potenciometro')
      parts[id] = {
        type: 'potentiometer-wh148',
        resistance: '10k',
        position: posicion
      }
      layout[id] = { on: { a: `bb.c${c}` } } // cursor en c+2, b en c+4
      wires.push([`bb.a${c}`, riel('X', c), { color: COLOR_CABLE.negro }])
      wires.push([
        `bb.a${c + 4}`,
        riel('W', c + 4),
        { color: COLOR_CABLE.rojo }
      ])
      alArduino(pin, `bb.a${c + 2}`, COLOR_CABLE.azul)
    },

    /** Parlante (buzzer pasivo) con una resistencia de 100 ohm en serie. */
    parlante(id, pin) {
      const c = reservar('parlante')
      parts[`r_${id}`] = { type: 'resistor-axial', resistance: '100' }
      parts[id] = { type: 'buzzer-12mm' }
      layout[`r_${id}`] = { on: { a: `bb.d${c}` } } // b en d{c+4}
      layout[id] = { on: { '+': `bb.c${c + 4}` } } // - en c{c+7}
      alArduino(pin, `bb.a${c}`, COLOR_CABLE.naranja)
      wires.push([
        `bb.a${c + 7}`,
        riel('X', c + 7),
        { color: COLOR_CABLE.negro }
      ])
    },

    /** Servo SG90 al costado de la protoboard, alimentado desde los rieles. */
    servo(id, pin) {
      parts[id] = { type: 'servo-sg90' }
      layout[id] = { at: [protoboard.xArduino, 70, 0], rotate: [0, 0, 90] }
      alArduino(pin, `${id}.SIGNAL`, COLOR_CABLE.naranja)
      wires.push([riel('W', 4), `${id}.VCC`, { color: COLOR_CABLE.rojo }])
      wires.push([riel('X', 4), `${id}.GND`, { color: COLOR_CABLE.negro }])
    },

    construir(comentario) {
      return (
        `// ${comentario}\n// Escena generada por GrIDIE Blocks (src/simulador/escenas.js).\n` +
        JSON.stringify(
          { format: 1, parts, layout, nets: { GND: 'uno.GND' }, wires },
          null,
          2
        )
      )
    }
  }
}

// ---- Escenas por desafío -----------------------------------------------------------------

/**
 * Controles que el panel muestra para cada sensor de la escena.
 * - pulsador: envía press/release a `ref`.
 * - deslizador: envía `set ref valor` (0..1) y muestra el valor en las unidades del sensor.
 */
const CONTROL = {
  pir: {
    tipo: 'pulsador',
    ref: '@pir',
    etiqueta: 'Sensor PIR',
    accion: 'Simular movimiento'
  },
  obstaculo: {
    tipo: 'pulsador',
    ref: '@obstaculos',
    etiqueta: 'Sensor de obstáculos',
    accion: 'Poner un obstáculo'
  },
  fuego: {
    tipo: 'pulsador',
    ref: '@fuego',
    etiqueta: 'Sensor de fuego',
    accion: 'Acercar una llama'
  },
  distancia: {
    tipo: 'deslizador',
    ref: '@ultrasonico.position',
    etiqueta: 'Distancia al obstáculo',
    unidad: 'cm',
    min: 0,
    max: 100,
    inicial: 0.6
  },
  humedad: {
    tipo: 'deslizador',
    ref: '@humedad.position',
    etiqueta: 'Humedad en la tierra',
    unidad: '%',
    min: 0,
    max: 100,
    inicial: 0.5,
    // El sensor resistivo da un valor alto cuando la tierra está seca.
    invertido: true
  },
  analogicoA0: {
    tipo: 'deslizador',
    ref: '@analogico.position',
    etiqueta: 'Sensor en A0 (humedad o gas)',
    unidad: '',
    min: 0,
    max: 1023,
    inicial: 0.5
  }
}

/**
 * Los componentes del kit. `pin` es el que usa el generador de código de GrIDIE, o sea
 * la conexión correcta. `cable` es cómo se nombra ese cable en la etapa de conexión.
 */
const KIT = {
  led: { tipo: 'led', pin: 'D13', color: 'rojo', cable: 'LED' },
  rojo: {
    tipo: 'led',
    pin: 'D7',
    color: 'rojo',
    cable: 'Luz roja del semáforo'
  },
  amarillo: {
    tipo: 'led',
    pin: 'D6',
    color: 'amarillo',
    cable: 'Luz amarilla del semáforo'
  },
  verde: {
    tipo: 'led',
    pin: 'D5',
    color: 'verde',
    cable: 'Luz verde del semáforo'
  },
  servo: { tipo: 'servo', pin: 'D2', cable: 'Señal del servo (cable naranja)' },
  pir: {
    tipo: 'sensorDigital',
    pin: 'D4',
    cable: 'Salida del sensor PIR',
    control: CONTROL.pir
  },
  obstaculos: {
    tipo: 'sensorDigital',
    pin: 'D4',
    activoEnBajo: true,
    cable: 'Salida del sensor de obstáculos',
    control: CONTROL.obstaculo
  },
  fuego: {
    tipo: 'sensorDigital',
    pin: 'D3',
    cable: 'Salida del sensor de fuego',
    control: CONTROL.fuego
  },
  ultrasonico: {
    tipo: 'potenciometro',
    pin: 'A1',
    cable: 'Sensor ultrasónico (simulado en A1)',
    control: CONTROL.distancia
  },
  humedad: {
    tipo: 'potenciometro',
    pin: 'A0',
    cable: 'Salida del sensor de humedad',
    control: CONTROL.humedad
  },
  analogico: {
    tipo: 'potenciometro',
    pin: 'A0',
    cable: 'Sensor analógico (humedad o gas)',
    control: CONTROL.analogicoA0
  },
  parlante: { tipo: 'parlante', pin: 'D12', cable: 'Parlante' }
}

const SEMAFORO = ['rojo', 'amarillo', 'verde']

/** Para cada número de toolbox (el que usa BocklyComponent), qué componentes van. */
const DESAFIOS = {
  // Clase 1 y 2: LED en el pin 13
  1: { componentes: ['led'], comentario: 'Un LED en el pin 13.' },
  2: { componentes: ['led'], comentario: 'Un LED en el pin 13.' },
  4: { componentes: ['led'], comentario: 'Un LED en el pin 13.' },
  5: { componentes: ['led'], comentario: 'Un LED en el pin 13.' },
  // Semáforo
  3: {
    componentes: SEMAFORO,
    comentario: 'El semáforo: rojo D7, amarillo D6, verde D5.'
  },
  6: {
    componentes: SEMAFORO,
    comentario: 'El semáforo: rojo D7, amarillo D6, verde D5.'
  },
  // Servo y barrera
  7: { componentes: ['servo'], comentario: 'Un servo SG90 en el pin 2.' },
  8: {
    componentes: [...SEMAFORO, 'servo'],
    comentario: 'La barrera: servo en el pin 2 y semáforo.'
  },
  // Clase 3: PIR + LED
  9: {
    componentes: ['pir', 'led'],
    comentario: 'Sensor PIR en el pin 4 y LED en el pin 13.'
  },
  10: {
    componentes: ['pir', 'led'],
    comentario: 'Sensor PIR en el pin 4 y LED en el pin 13.'
  },
  // Ultrasónico + parlante
  11: {
    componentes: ['ultrasonico', 'parlante'],
    comentario: 'Sensor ultrasónico (simulado en A1) y parlante en el pin 12.'
  },
  // Sensor de estacionamiento
  12: {
    componentes: ['ultrasonico', 'parlante', ...SEMAFORO],
    comentario: 'Sensor de estacionamiento: ultrasónico, parlante y semáforo.'
  },
  // Clase 4: Concept Card. En su caja de herramientas están el sensor de obstáculos (D4,
  // LOW al detectar), el de fuego (D3), los de humedad y gas (A0) y el ultrasónico.
  13: {
    componentes: [
      ...SEMAFORO,
      'led',
      'obstaculos',
      'fuego',
      'analogico',
      'ultrasonico',
      'parlante',
      'servo'
    ],
    comentario: 'Concept Card: todos los componentes del kit.'
  },
  // Riego inteligente
  14: {
    componentes: ['humedad', ...SEMAFORO, 'parlante'],
    comentario:
      'Riego inteligente: sensor de humedad en A0, semáforo y parlante.'
  }
}

/** Los pines del Arduino Uno que se pueden elegir en la etapa de conexión. */
export const PINES_ARDUINO = [
  ...Array.from({ length: 12 }, (_, i) => `D${i + 2}`),
  'A0',
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  '5V',
  '3V3',
  'GND'
]

/**
 * Los cables que el alumno tiene que conectar en el desafío: uno por componente, más la
 * alimentación de la protoboard. `esperado` es el pin correcto.
 */
export function cablesDelDesafio(toolBox) {
  const desafio = DESAFIOS[Number(toolBox)]
  if (!desafio) return []
  return [
    {
      id: 'riel5V',
      etiqueta: 'Riel + de la protoboard (cable rojo)',
      esperado: '5V'
    },
    {
      id: 'rielGND',
      etiqueta: 'Riel − de la protoboard (cable negro)',
      esperado: 'GND'
    },
    ...desafio.componentes.map(id => ({
      id,
      etiqueta: KIT[id].cable,
      esperado: KIT[id].pin
    }))
  ]
}

/**
 * La escena y los controles del desafío `toolBox`, o null si no tiene simulación.
 * `conexiones` ({ idDelCable: pin }) es lo que conectó el alumno. Si falta un cable se usa
 * la conexión correcta, salvo con `soloElegidas`, que deja ese cable sin dibujar (para la
 * etapa de conexión, así la escena no muestra la respuesta).
 */
export function escenaDelDesafio(
  toolBox,
  conexiones = {},
  { soloElegidas = false } = {}
) {
  const desafio = DESAFIOS[Number(toolBox)]
  if (!desafio) return null
  const elegido = (id, correcto) =>
    conexiones[id] || (soloElegidas ? null : correcto)
  const pinDe = id => elegido(id, KIT[id]?.pin)
  const armar = protoboard => {
    const e = crearConstructor(protoboard, {
      pin5V: elegido('riel5V', '5V'),
      pinGND: elegido('rielGND', 'GND')
    })
    for (const id of desafio.componentes) {
      const c = KIT[id]
      if (c.tipo === 'led') e.led(id, pinDe(id), c.color)
      else if (c.tipo === 'sensorDigital')
        e.sensorDigital(id, pinDe(id), { activoEnBajo: c.activoEnBajo })
      else if (c.tipo === 'potenciometro')
        e.potenciometro(id, pinDe(id), c.control.inicial)
      else if (c.tipo === 'parlante') e.parlante(id, pinDe(id))
      else if (c.tipo === 'servo') e.servo(id, pinDe(id))
    }
    return e.construir(desafio.comentario)
  }
  let escena
  try {
    escena = armar(PROTOBOARDS.chica)
  } catch (error) {
    if (!(error instanceof NoEntra)) throw error
    escena = armar(PROTOBOARDS.grande)
  }
  return {
    escena,
    controles: desafio.componentes.map(id => KIT[id].control).filter(Boolean),
    pinParlante: desafio.componentes.includes('parlante')
      ? `@uno.${pinDe('parlante')}`
      : null
  }
}

export const TOOLBOXES_CON_SIMULADOR = Object.keys(DESAFIOS).map(Number)
