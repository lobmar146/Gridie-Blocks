// Arma la escena (scene.jsonc de ORBE) de cada desafío siguiendo su esquema de conexión
// (public/img/conexiones/): qué componentes van, dónde y a qué pin del Arduino Uno se
// conecta cada cable. Los pines son los que usa el generador de código de GrIDIE:
//
//   LED ................ pata larga D13, pata corta GND (enchufado directo en la placa)
//   Semáforo ........... R D7, A D6, V D5, GND          Servo ........ señal D2, 5V, GND
//   Sensor PIR / obst. . OUT D4, VCC 5V, GND            Fuego ........ OUT D3
//   Ultrasónico ........ Trig D8, Echo D9, VCC 5V, GND  Parlante ..... + D12, − GND
//   Humedad en tierra .. A0, VCC 5V, GND
//
// Los módulos (semáforo, HC-SR04, PIR, FC-51, fuego y FC-28) son piezas propias de GrIDIE,
// en simulador/piezas/ (las genera simulador/scripts/generar-piezas.py). Los que van en la
// protoboard (PIR, obstáculos, fuego y ultrasónico) se enchufan en ella y los cables van a la
// misma columna, como en los esquemas. El resto se cablea directo al Arduino.

const COLOR = {
  rojo: '#d12b2b',
  negro: '#161616',
  marron: '#6b3a1a',
  amarillo: '#f2c21c',
  naranja: '#f28c1c',
  verde: '#2e9e44',
  azul: '#2b6bd1',
  violeta: '#8e44ad'
}

// Las dos protoboards de ORBE. La fila "a" queda del lado del Arduino.
const PROTOBOARDS = [
  { tipo: 'breadboard-400', columnas: 30 },
  { tipo: 'breadboard-830', columnas: 63 }
]
const POSICION_PROTOBOARD = [8, 82, 0]

// Los tres agujeros GND del Arduino: dos en el conector de alimentación y uno al lado del 13.
const ENCHUFES_GND = ['power.6', 'power.7', 'ioh.7']

/** Un pin del Arduino como lo nombra el docente: "pin 13", "A0", "5V", "GND". */
export const nombreDelPin = pin =>
  /^D\d+$/.test(pin) ? `pin ${pin.slice(1)}` : pin

const cable = (pin, esperado, etiqueta, color) => ({
  pin,
  esperado,
  etiqueta,
  color
})

/**
 * Los componentes de los esquemas. Cada uno tiene sus cables en el orden en que se
 * conectan: `pin` es el pin del componente y `esperado` el del Arduino según el esquema.
 * `protoboard` dice cuántas columnas ocupa y en qué orden quedan sus pines si va enchufado.
 */
const COMPONENTES = {
  led: {
    nombre: 'LED',
    cables: [
      cable('anode', 'D13', 'Pata larga del LED (+)', COLOR.rojo),
      cable('cathode', 'GND', 'Pata corta del LED (−)', COLOR.negro)
    ]
  },
  semaforo: {
    nombre: 'Semáforo',
    tipo: 'gridie-semaforo',
    cables: [
      cable('R', 'D7', 'Luz roja del semáforo (R)', COLOR.rojo),
      cable('A', 'D6', 'Luz amarilla del semáforo (A)', COLOR.amarillo),
      cable('V', 'D5', 'Luz verde del semáforo (V)', COLOR.verde),
      cable('GND', 'GND', 'GND del semáforo', COLOR.marron)
    ]
  },
  servo: {
    nombre: 'Servo',
    tipo: 'servo-sg90',
    cables: [
      cable('SIGNAL', 'D2', 'Cable naranja del servo (señal)', COLOR.naranja),
      cable('VCC', '5V', 'Cable rojo del servo (+)', COLOR.rojo),
      cable('GND', 'GND', 'Cable marrón del servo (−)', COLOR.marron)
    ]
  },
  pir: {
    nombre: 'Sensor PIR',
    tipo: 'gridie-pir',
    protoboard: { columnas: 13, pines: ['VCC', 'OUT', 'GND'] },
    cables: [
      cable('VCC', '5V', 'VCC del sensor PIR', COLOR.rojo),
      cable('OUT', 'D4', 'OUT del sensor PIR (señal)', COLOR.verde),
      cable('GND', 'GND', 'GND del sensor PIR', COLOR.azul)
    ],
    control: {
      tipo: 'pulsador',
      ref: '@pir.sw',
      etiqueta: 'Sensor PIR',
      accion: 'Simular movimiento'
    }
  },
  obstaculos: {
    nombre: 'Sensor de obstáculos',
    tipo: 'gridie-fc51',
    // Girado 180°: el sensor mira hacia atrás y los pines quedan VCC, GND, OUT.
    protoboard: { columnas: 6, pines: ['VCC', 'GND', 'OUT'], girar: true },
    cables: [
      cable('VCC', '5V', 'VCC del sensor de obstáculos', COLOR.rojo),
      cable('GND', 'GND', 'GND del sensor de obstáculos', COLOR.azul),
      cable('OUT', 'D4', 'OUT del sensor de obstáculos (señal)', COLOR.verde)
    ],
    control: {
      tipo: 'pulsador',
      ref: '@obstaculos.sw',
      etiqueta: 'Sensor de obstáculos',
      accion: 'Poner un obstáculo'
    }
  },
  fuego: {
    nombre: 'Sensor de fuego',
    tipo: 'gridie-fuego',
    protoboard: { columnas: 6, pines: ['VCC', 'GND', 'OUT'], girar: true },
    cables: [
      cable('VCC', '5V', 'VCC del sensor de fuego', COLOR.rojo),
      cable('GND', 'GND', 'GND del sensor de fuego', COLOR.azul),
      cable('OUT', 'D3', 'OUT del sensor de fuego (señal)', COLOR.amarillo)
    ],
    control: {
      tipo: 'pulsador',
      ref: '@fuego.sw',
      etiqueta: 'Sensor de fuego',
      accion: 'Acercar una llama'
    }
  },
  ultrasonico: {
    nombre: 'Sensor ultrasónico',
    tipo: 'gridie-hc-sr04',
    protoboard: { columnas: 18, pines: ['VCC', 'Trig', 'Echo', 'GND'] },
    cables: [
      cable('VCC', '5V', 'VCC del sensor ultrasónico', COLOR.rojo),
      cable('Trig', 'D8', 'Trig del sensor ultrasónico', COLOR.verde),
      cable('Echo', 'D9', 'Echo del sensor ultrasónico', COLOR.violeta),
      cable('GND', 'GND', 'GND del sensor ultrasónico', COLOR.azul)
    ],
    // ORBE no simula el eco: la distancia sale del pin DIST de la pieza, que va a A1 sin
    // cable visible (ver codigoSimulador.js).
    oculto: [['DIST', 'A1']],
    control: {
      tipo: 'deslizador',
      ref: '@ultrasonico.eco.position',
      etiqueta: 'Distancia al obstáculo',
      unidad: 'cm',
      min: 0,
      max: 100,
      inicial: 0.6
    }
  },
  parlante: {
    nombre: 'Parlante',
    tipo: 'buzzer-12mm',
    cables: [
      cable('+', 'D12', 'Cable rojo del parlante (+)', COLOR.rojo),
      cable('-', 'GND', 'Cable negro del parlante (−)', COLOR.negro)
    ]
  },
  humedad: {
    nombre: 'Sensor de humedad',
    tipo: 'gridie-humedad',
    cables: [
      cable('A0', 'A0', 'A0 del sensor de humedad (señal)', COLOR.violeta),
      cable('VCC', '5V', 'VCC del sensor de humedad', COLOR.rojo),
      cable('GND', 'GND', 'GND del sensor de humedad', COLOR.negro)
    ],
    control: {
      tipo: 'deslizador',
      ref: '@humedad.tierra.position',
      etiqueta: 'Humedad en la tierra',
      unidad: '%',
      min: 0,
      max: 100,
      inicial: 0.5,
      // El sensor resistivo da un valor alto cuando la tierra está seca.
      invertido: true
    }
  }
}

// En la Concept Card el sensor de A0 puede ser el de humedad o el de gas.
COMPONENTES.analogico = {
  ...COMPONENTES.humedad,
  nombre: 'Sensor de humedad o gas',
  cables: COMPONENTES.humedad.cables.map(c => ({
    ...c,
    etiqueta: c.etiqueta.replace('de humedad', 'de humedad o gas')
  })),
  control: {
    tipo: 'deslizador',
    ref: '@analogico.tierra.position',
    etiqueta: 'Sensor en A0 (humedad o gas)',
    unidad: '',
    min: 0,
    max: 1023,
    inicial: 0.5
  }
}

// Dónde va cada componente que no va en la protoboard (mm, con el Arduino en el origen:
// +X a la derecha, +Y hacia el lado de los pines digitales).
const LUGAR = {
  semaforo: { at: [62, -8, 0] },
  servo: { at: [-28, -66, 0] },
  parlante: { at: [40, -52, 8] },
  humedad: { at: [-84, -14, 0] },
  analogico: { at: [-84, -14, 0] }
}

// El LED enchufado en el conector de la placa: la pata larga en el 13 y la corta en el GND de
// al lado. Si el alumno elige otros pines, el LED queda al costado con dos cables.
const LED_EN_LA_PLACA = { at: [-6.64, 24.13, 31.5], rotate: [0, 0, 180] }
const LED_AL_COSTADO = { at: [-14, 46, 27.4] }

/** Para cada número de toolbox (el que usa BocklyComponent), qué componentes van. */
const DESAFIOS = {
  // Clase 1 y 2: un LED en el pin 13 (esquema Eje1Cl1)
  1: {
    componentes: ['led'],
    comentario: 'Un LED enchufado en el pin 13 y GND.'
  },
  2: {
    componentes: ['led'],
    comentario: 'Un LED enchufado en el pin 13 y GND.'
  },
  4: {
    componentes: ['led'],
    comentario: 'Un LED enchufado en el pin 13 y GND.'
  },
  5: {
    componentes: ['led'],
    comentario: 'Un LED enchufado en el pin 13 y GND.'
  },
  // Semáforo (Eje2Cl1)
  3: {
    componentes: ['semaforo'],
    comentario: 'El semáforo: R D7, A D6, V D5.'
  },
  6: {
    componentes: ['semaforo'],
    comentario: 'El semáforo: R D7, A D6, V D5.'
  },
  // Servo (Eje2Cl2) y barrera (Pro3Cl2)
  7: { componentes: ['servo'], comentario: 'Un servo SG90 en el pin 2.' },
  8: {
    componentes: ['servo', 'semaforo'],
    comentario: 'La barrera: servo en el pin 2 y semáforo.'
  },
  // Clase 3: sensor de movimiento y LED (Ej1Cl3)
  9: {
    componentes: ['pir', 'led'],
    comentario: 'Sensor PIR en el pin 4 y LED en el pin 13.'
  },
  10: {
    componentes: ['pir', 'led'],
    comentario: 'Sensor PIR en el pin 4 y LED en el pin 13.'
  },
  // Ultrasónico y parlante (Ej2Cl3)
  11: {
    componentes: ['ultrasonico', 'parlante'],
    comentario: 'Sensor ultrasónico (Trig 8, Echo 9) y parlante en el pin 12.'
  },
  // Sensor de estacionamiento (Pro3Cl3)
  12: {
    componentes: ['ultrasonico', 'parlante', 'semaforo'],
    comentario: 'Sensor de estacionamiento: ultrasónico, parlante y semáforo.'
  },
  // Clase 4: Concept Card. En su caja de herramientas están todos los componentes del kit.
  13: {
    componentes: [
      'semaforo',
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
  // Riego inteligente (sensor_humedad_tierra). El esquema tiene LED y semáforo; los bloques
  // del desafío usan el parlante, así que también va.
  14: {
    componentes: ['humedad', 'led', 'semaforo', 'parlante'],
    comentario:
      'Riego inteligente: sensor de humedad en A0, LED, semáforo y parlante.'
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

const idDelCable = (componente, c) => `${componente}.${c.pin}`

/**
 * Los cables que el alumno tiene que conectar en el desafío, en orden: uno por cada pin de
 * cada componente. `esperado` es el pin del Arduino según el esquema.
 */
export function cablesDelDesafio(toolBox) {
  const desafio = DESAFIOS[Number(toolBox)]
  if (!desafio) return []
  return desafio.componentes.flatMap(id =>
    COMPONENTES[id].cables.map(c => ({
      id: idDelCable(id, c),
      componente: id,
      nombreComponente: COMPONENTES[id].nombre,
      etiqueta: c.etiqueta,
      esperado: c.esperado,
      color: c.color
    }))
  )
}

/**
 * La escena y los controles del desafío `toolBox`, o null si no tiene simulación.
 * `conexiones` ({ idDelCable: pin }) es lo que conectó el alumno. Si falta un cable se usa
 * la conexión del esquema, salvo con `soloElegidas`, que deja ese cable sin dibujar (para la
 * etapa de conexión, así la escena no muestra la respuesta).
 */
export function escenaDelDesafio(
  toolBox,
  conexiones = {},
  { soloElegidas = false } = {}
) {
  const desafio = DESAFIOS[Number(toolBox)]
  if (!desafio) return null
  const pinElegido = (id, c) =>
    conexiones[idDelCable(id, c)] || (soloElegidas ? null : c.esperado)

  const parts = { uno: { type: 'uno-board', firmware: 'build/sketch.hex' } }
  const layout = { uno: { at: [0, 0, 0] } }
  const wires = []

  // El LED va en la placa si sus patas están en el 13 y el GND de al lado, y entonces ese
  // GND queda ocupado. Los otros cables a GND se reparten entre los agujeros libres.
  const conLed = desafio.componentes.includes('led')
  const anodo = conLed ? pinElegido('led', COMPONENTES.led.cables[0]) : null
  const catodo = conLed ? pinElegido('led', COMPONENTES.led.cables[1]) : null
  const ledEnLaPlaca = anodo === 'D13' && catodo === 'GND'
  const gndsLibres = ENCHUFES_GND.filter(e => !(ledEnLaPlaca && e === 'ioh.7'))
  let siguienteGnd = 0
  const enchufeDe = pin =>
    pin === 'GND'
      ? `uno.${gndsLibres[siguienteGnd++ % gndsLibres.length]}`
      : `uno.${pin}`

  // Protoboard, solo si algún componente va enchufado en ella.
  const enProtoboard = desafio.componentes.filter(
    id => COMPONENTES[id].protoboard
  )
  if (enProtoboard.length > 0) {
    const ancho = enProtoboard.reduce(
      (total, id) => total + COMPONENTES[id].protoboard.columnas + 1,
      3
    )
    const protoboard =
      PROTOBOARDS.find(p => p.columnas >= ancho) ?? PROTOBOARDS.at(-1)
    parts.bb = { type: protoboard.tipo }
    layout.bb = { at: POSICION_PROTOBOARD }
  }
  let columna = 2

  for (const id of desafio.componentes) {
    const c = COMPONENTES[id]
    if (id === 'led') {
      // En la placa, una resistencia de 220 ohm escondida en la cúpula cuida al LED, que en
      // clase se enchufa sin resistencia. Queda en serie con la pata larga.
      parts.led = { type: 'led-5mm' }
      if (ledEnLaPlaca) {
        parts.r_led = { type: 'resistor-0603', resistance: '220' }
        wires.push(['r_led.b', 'led.anode', { kind: 'contact' }])
        layout.led = LED_EN_LA_PLACA
        layout.r_led = { at: [-6.64, 24.13, 36] }
        wires.push(['uno.D13', 'r_led.a', { kind: 'contact' }])
        wires.push(['uno.ioh.7', 'led.cathode', { kind: 'contact' }])
      } else {
        layout.led = LED_AL_COSTADO
        if (anodo)
          wires.push([enchufeDe(anodo), 'led.anode', { color: COLOR.rojo }])
        if (catodo)
          wires.push([enchufeDe(catodo), 'led.cathode', { color: COLOR.negro }])
      }
      continue
    }

    parts[id] = { type: c.tipo }
    if (c.protoboard) {
      const { columnas, pines, girar } = c.protoboard
      const primera = columna + Math.floor((columnas - pines.length) / 2)
      layout[id] = {
        on: { [pines[0]]: `bb.e${primera}` },
        ...(girar ? { rotate: [0, 0, 180] } : {})
      }
      columna += columnas + 1
      for (const cc of c.cables) {
        const pin = pinElegido(id, cc)
        const agujero = `bb.a${primera + pines.indexOf(cc.pin)}`
        if (pin) wires.push([enchufeDe(pin), agujero, { color: cc.color }])
      }
    } else {
      layout[id] = LUGAR[id]
      for (const cc of c.cables) {
        const pin = pinElegido(id, cc)
        if (pin)
          wires.push([enchufeDe(pin), `${id}.${cc.pin}`, { color: cc.color }])
      }
    }
    for (const [desde, hacia] of c.oculto ?? [])
      wires.push([`${id}.${desde}`, `uno.${hacia}`, { kind: 'contact' }])
  }

  const escena =
    `// ${desafio.comentario}\n// Escena generada por GrIDIE Blocks (src/simulador/escenas.js).\n` +
    JSON.stringify(
      { format: 1, parts, layout, nets: { GND: 'uno.GND' }, wires },
      null,
      2
    )
  const pinParlante = desafio.componentes.includes('parlante')
    ? pinElegido('parlante', COMPONENTES.parlante.cables[0])
    : null
  return {
    escena,
    controles: desafio.componentes
      .map(id => COMPONENTES[id].control)
      .filter(Boolean),
    pinParlante: pinParlante ? `@uno.${pinParlante}` : null
  }
}

export const TOOLBOXES_CON_SIMULADOR = Object.keys(DESAFIOS).map(Number)
