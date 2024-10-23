import * as Blockly from 'blockly'

export const desafio1Generator = new Blockly.Generator('DESAFIO1')

// Objeto para almacenar el código generado por cada bloque y los pines ya configurados
let codeMap = {
  pinMode: '', // Código que irá en pinMode
  variables: '', // Variables definidas
  setup: '', // Código que irá en setup
  loop: '' // Código que irá en loop
}

// Objeto para almacenar los pines configurados para no repetir pinMode
let configuredPins = {}

// Objeto para almacenar si la variable "intensidad" ya ha sido declarada
let definedVariables = {}

// Función para agregar pinMode en el setup
function addPinModeIfNotDefined(pin) {
  if (!configuredPins[pin]) {
    codeMap.pinMode += `pinMode(${pin}, OUTPUT);\n`
    configuredPins[pin] = true // Marcar pin como configurado
  }
}

// Función para agregar la variable "intensidad" si no está definida
function addVariableIfNotDefined(variableName, initialValue, comment) {
  if (!definedVariables[variableName]) {
    codeMap.variables += `// ${comment}\nint ${variableName} = ${initialValue};\n`
    definedVariables[variableName] = true // Marcar la variable como definida
  }
}

// Función para generar analogWrite con comentario
function generateAnalogWrite(pin, value, comment) {
  return `// ${comment}\nanalogWrite(${pin}, ${value});\n`
}

// Función para aplicar indentación
function indentCode(code, level = 1) {
  const indent = '  '.repeat(level) // Cada nivel de indentación añade dos espacios
  return code
    .split('\n')
    .map(line => (line.trim() ? indent + line : line)) // Solo indenta líneas que no están vacías
    .join('\n')
}

// Bloque 'encerled' (Led en Pin 13)
desafio1Generator['encerled'] = function (block) {
  const pin = 13
  addPinModeIfNotDefined(pin) // Asegura que pinMode se coloca en el setup
  const comment = 'Encendiendo LED en Pin Digital 13' // Comentario para encender LED
  const code = generateAnalogWrite(pin, 'HIGH', comment)
  return code
}

// Bloque 'apagarled' (Led en Pin 13)
desafio1Generator['apagarled'] = function (block) {
  const pin = 13
  addPinModeIfNotDefined(pin)
  const comment = 'Apagando LED en Pin Digital 13' // Comentario para apagar LED
  const code = generateAnalogWrite(pin, 'LOW', comment)
  return code
}

// Bloque 'aumentar_intensidad_led' (Controla la intensidad del LED en Pin 11)
desafio1Generator['aumentar_intensidad_led'] = function (block) {
  const pin = 11
  const intensityChange = Number(block.getFieldValue('INTENSITY')) // Obtener el valor del bloque

  // Asegurar que el pinMode se coloque en el setup
  addPinModeIfNotDefined(pin)

  // Asegurar que la variable "intensidad" solo se define una vez
  addVariableIfNotDefined(
    'intensidad',
    1, // Valor inicial
    'Definimos la variable que controla la intensidad'
  )

  // Incrementar la variable "intensidad" en función del valor del bloque
  const code =
    `// Aumento la intensidad del LED en ${intensityChange}\nintensidad += ${intensityChange};\n` +
    generateAnalogWrite(
      pin,
      'intensidad',
      'Aumentamos la intensidad del LED en el Pin 11'
    )

  return code
}

// Bloque 'bajar_intensidad_led' (Disminuye la intensidad del LED en Pin 11)
desafio1Generator['bajar_intensidad_led'] = function (block) {
  const pin = 11
  const intensityChange = Number(block.getFieldValue('INTENSITY')) // Obtener el valor del bloque

  // Asegurar que el pinMode se coloque en el setup
  addPinModeIfNotDefined(pin)

  // Asegurar que la variable "intensidad" solo se define una vez
  addVariableIfNotDefined(
    'intensidad',
    1, // Valor inicial
    'Definimos la variable que controla la intensidad'
  )

  // Decrementar la variable "intensidad" en función del valor del bloque
  const code =
    `// Disminuimos la intensidad del LED en ${intensityChange}\nintensidad -= ${intensityChange};\n` +
    generateAnalogWrite(
      pin,
      'intensidad',
      'Disminuimos la intensidad del LED en el Pin 11'
    )

  return code
}

// Bloque 'esperar_un_segundo' (Delay de 1 segundo)
desafio1Generator['esperar_un_segundo'] = function (block) {
  const code = '// Esperar 1 segundo\n' + 'delay(1000);\n'
  return code
}

// Bloque 'EncenderRojoA'
desafio1Generator['EncenderRojoA'] = function (block) {
  const pin = 5
  addPinModeIfNotDefined(pin)
  const comment = 'Encendiendo Luz Roja conectada al Pin 5'
  const code = generateAnalogWrite(pin, 'HIGH', comment) + '\n'
  return code
}

// Bloque 'ApagarRojoA'
desafio1Generator['ApagarRojoA'] = function (block) {
  const pin = 5
  addPinModeIfNotDefined(pin)
  const comment = 'Apagando Luz Roja conectada al Pin 5'
  const code = generateAnalogWrite(pin, 'LOW', comment) + '\n'
  return code
}

// Bloque 'EncenderAmarilloC'
desafio1Generator['EncenderAmarilloC'] = function (block) {
  const pin = 6
  addPinModeIfNotDefined(pin)
  const comment = 'Encendiendo Luz Amarilla conectada al Pin 6'
  const code = generateAnalogWrite(pin, 'HIGH', comment) + '\n'
  return code
}

// Bloque 'ApagarAmarilloC'
desafio1Generator['ApagarAmarilloC'] = function (block) {
  const pin = 6
  addPinModeIfNotDefined(pin)
  const comment = 'Apagando Luz Amarilla conectada al Pin 6'
  const code = generateAnalogWrite(pin, 'LOW', comment) + '\n'
  return code
}

// Bloque 'EncenderVerdeE'
desafio1Generator['EncenderVerdeE'] = function (block) {
  const pin = 7
  addPinModeIfNotDefined(pin)
  const comment = 'Encendiendo Luz Verde conectada al Pin 7'
  const code = generateAnalogWrite(pin, 'HIGH', comment) + '\n'
  return code
}

// Bloque 'ApagarVerdeE'
desafio1Generator['ApagarVerdeE'] = function (block) {
  const pin = 7
  addPinModeIfNotDefined(pin)
  const comment = 'Apagando Luz Verde conectada al Pin 7'
  const code = generateAnalogWrite(pin, 'LOW', comment) + '\n'
  return code
}

// Define la función para el bloque 'ejecutar_una_vez'
desafio1Generator['ejecutar_una_vez'] = function (block) {
  let currentBlock = block.getInputTargetBlock('SETUP_CODE')

  // Procesa todos los bloques conectados dentro de 'ejecutar_una_vez'
  while (currentBlock) {
    const code = this[currentBlock.type](currentBlock)
    if (code) {
      codeMap.setup += code // No aplicar indentación extra a `setup`
    }
    currentBlock = currentBlock.getNextBlock() // Mueve al siguiente bloque en la cadena
  }
  return ''
}

// Define una función para generar el código combinado de todos los bloques
desafio1Generator.workspaceToCode = function (workspace) {
  // Inicializa el generador, esto configura variableDB_ y otros elementos
  this.init(workspace)

  // Asegurarse de que variableDB_ esté inicializada correctamente
  if (!this.variableDB_) {
    this.variableDB_ = new Blockly.Names(Blockly.Procedures.NAME_TYPE)
  }

  // Limpia el mapa de código y pines configurados
  codeMap = {
    pinMode: '', // Código para pinMode que debe estar al principio de setup
    variables: '', // Variables que deben estar al principio
    setup: '', // Código que irá en setup
    loop: '' // Código que irá en loop
  }
  configuredPins = {} // Resetear pines configurados
  definedVariables = {} // Resetear variables definidas

  // Almacena las definiciones de los procedimientos
  let procedureDefinitions = ''

  // Obtiene todos los bloques conectados en el workspace
  const blocks = workspace.getAllBlocks()

  // Genera el código combinado de todos los bloques
  blocks.forEach(block => {
    if (block.type === 'ejecutar_una_vez') {
      this[block.type](block) // Genera el código para el bloque 'ejecutar_una_vez'
    } else if (
      block.type === 'procedures_defnoreturn' ||
      block.type === 'procedures_defreturn'
    ) {
      procedureDefinitions += this[block.type](block) || '' // Agrega la definición del procedimiento
    }
  })

  // Añadir comentarios sobre pines y variables si están definidos
  const pinModeComment = codeMap.pinMode
    ? '// Definimos los pines como entrada y salida\n'
    : ''
  const variablesComment = codeMap.variables
    ? '// Definimos las variables que usará nuestro programa\n'
    : ''

  // Genera la estructura básica con setup y loop, colocando pinMode al inicio del setup
  let finalCode = `${procedureDefinitions}\n${variablesComment}${indentCode(
    codeMap.variables,
    1
  )}\nvoid setup() {\n${indentCode(
    pinModeComment + codeMap.pinMode,
    1
  )}\n${indentCode(codeMap.setup, 1)}}\n\nvoid loop() {\n${indentCode(
    codeMap.loop,
    1
  )}}\n`

  return finalCode.trim() // Elimina espacios en blanco alrededor del código
}

// Procedimiento sin retorno (procedures_defnoreturn)
desafio1Generator['procedures_defnoreturn'] = function (block) {
  var funcName = this.variableDB_.getName(
    block.getFieldValue('NAME'),
    Blockly.Procedures.NAME_TYPE
  )

  // Procesa los bloques dentro del procedimiento (con recursividad)
  let branch = ''
  let currentBlock = block.getInputTargetBlock('STACK')
  while (currentBlock) {
    branch += this[currentBlock.type](currentBlock) || '' // Llamada recursiva
    currentBlock = currentBlock.getNextBlock()
  }

  // Genera el código del procedimiento
  var code = 'void ' + funcName + '() {\n' + indentCode(branch, 1) + '}\n'
  return code // Devuelve el código del procedimiento
}

// Procedimiento con retorno (procedures_defreturn)
desafio1Generator['procedures_defreturn'] = function (block) {
  var funcName = this.variableDB_.getName(
    block.getFieldValue('NAME'),
    Blockly.Procedures.NAME_TYPE
  )

  // Procesa los bloques dentro del procedimiento (con recursividad)
  let branch = ''
  let currentBlock = block.getInputTargetBlock('STACK')
  while (currentBlock) {
    branch += this[currentBlock.type](currentBlock) || '' // Llamada recursiva
    currentBlock = currentBlock.getNextBlock()
  }
  var returnValue = this.valueToCode(block, 'RETURN', this.ORDER_NONE) || ''

  // Genera el código del procedimiento con retorno
  var code =
    'int ' +
    funcName +
    '() {\n' +
    indentCode(branch, 1) +
    '  return ' +
    returnValue +
    ';\n}\n'
  return code // Devuelve el código del procedimiento
}

// Llamada a procedimientos sin retorno (procedures_callnoreturn)
desafio1Generator['procedures_callnoreturn'] = function (block) {
  var funcName = this.variableDB_.getName(
    block.getFieldValue('NAME'),
    Blockly.Procedures.NAME_TYPE
  )
  return funcName + '();\n'
}

// Bloque para 'repetir x cantidad de veces'
desafio1Generator['controls_repeat_ext'] = function (block) {
  // Obtener el número de repeticiones
  var repeats = block.getField('TIMES')
    ? String(Number(block.getFieldValue('TIMES')))
    : desafio1Generator.valueToCode(
        block,
        'TIMES',
        desafio1Generator.ORDER_ASSIGNMENT
      ) || '0'

  // Procesar los bloques dentro del bucle con recursividad
  let branch = ''
  let currentBlock = block.getInputTargetBlock('DO')
  while (currentBlock) {
    branch += this[currentBlock.type](currentBlock) || '' // Generar código para cada bloque dentro del bucle
    currentBlock = currentBlock.getNextBlock() // Mover al siguiente bloque dentro del bucle
  }

  // Aplicar indentación al código dentro del bucle
  branch = indentCode(branch, 2) // Indentar el contenido del bucle

  // Generar el código del bucle 'for'
  const code = `for (int repetir = 0; repetir < ${repeats}; repetir++) {\n${branch}}\n`
  return code
}

desafio1Generator['controls_count_with_intensity'] = function (block) {
  var from =
    desafio1Generator.valueToCode(
      block,
      'FROM',
      desafio1Generator.ORDER_ATOMIC
    ) || '0'
  var to =
    desafio1Generator.valueToCode(
      block,
      'TO',
      desafio1Generator.ORDER_ATOMIC
    ) || '0'

  // Asegurar que la variable intensidad se declara una sola vez
  addVariableIfNotDefined(
    'intensidad',
    from,
    'Definimos la variable que controla la intensidad'
  )

  // Código del for loop
  var branch = desafio1Generator.statementToCode(block, 'DO')
  branch = indentCode(branch, 2) // Indentar el código interno

  var code = `for (int intensidad = ${from}; intensidad <= ${to}; intensidad++) {\n${branch}}\n`
  return code
}
