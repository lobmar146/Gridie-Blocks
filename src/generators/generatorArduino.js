import * as Blockly from 'blockly'

export const generatorArduino = new Blockly.Generator('generatorArduino')
generatorArduino.ORDER_ATOMIC = 0
generatorArduino.ORDER_UNARY_POSTFIX = 1
generatorArduino.ORDER_UNARY_PREFIX = 2
generatorArduino.ORDER_MULTIPLICATIVE = 3
generatorArduino.ORDER_ADDITIVE = 4
generatorArduino.ORDER_RELATIONAL = 5
generatorArduino.ORDER_EQUALITY = 6
generatorArduino.ORDER_LOGICAL_AND = 7
generatorArduino.ORDER_LOGICAL_OR = 8
generatorArduino.ORDER_CONDITIONAL = 9
generatorArduino.ORDER_ASSIGNMENT = 10
generatorArduino.ORDER_NONE = 99

// Objeto para almacenar el código generado por cada bloque y los pines ya configurados
let codeMap = {
  libraries: '', //
  pinMode: '', // Código que irá en pinMode
  variables: '', // Variables definidas
  setup: '', // Código que irá en setup
  loop: '' // Código que irá en loop
}

// Objeto para almacenar los pines configurados para no repetir pinMode
let configuredPins = {}

// Objeto para almacenar las variables para no repetir en el espacio de definicion
let definedVariables = {}

// Objeto para almacenar las librerias utilizada
let definedLibraries = {}

// Inicializamos el valor de ORDER_ATOMIC al principio para evitar problemas de precedencia
if (typeof generatorArduino.ORDER_ATOMIC === 'undefined') {
  generatorArduino.ORDER_ATOMIC = 0 // Valor por defecto
}

//El corazon del generador de codigo
// Define una función para generar el código combinado de todos los bloques
generatorArduino.workspaceToCode = function (workspace) {
  // Inicializa el generador
  this.init(workspace)

  // Asegurarse de que nameDB_ esté inicializada correctamente
  if (!this.nameDB_) {
    this.nameDB_ = new Blockly.Names(Blockly.Procedures.NAME_TYPE)
  }

  // Limpia el mapa de código y pines configurados
  codeMap = {
    libraries: '', //Código de las librerias que carga el programa
    pinMode: '', // Código para pinMode que debe estar al principio de setup
    variables: '', // Variables que deben estar al principio
    setup: '', // Código que irá en setup
    loop: '' // Código que irá en loop
  }
  configuredPins = {} // Resetear pines configurados
  definedVariables = {} // Resetear variables definidas
  definedLibraries = {} //Resetear librerias definidas

  // Almacena las definiciones de los procedimientos
  let procedureDefinitions = ''

  // Obtiene todos los bloques conectados en el workspace
  const blocks = workspace.getAllBlocks()

  // Genera el código combinado de todos los bloques
  blocks.forEach(block => {
    if (block.type === 'ejecutar_una_vez') {
      this[block.type](block) // Genera el código para el bloque 'ejecutar_una_vez'
    } else if (block.type === 'ejecutar_por_siempre') {
      this[block.type](block)
    } else if (
      block.type === 'procedures_defnoreturn' ||
      block.type === 'procedures_defreturn'
    ) {
      procedureDefinitions += this[block.type](block) || '' // Agrega la definición del procedimiento
    }
  })

  // Añadir comentarios sobre pines, variables y librerias si están definidos
  const pinModeComment = codeMap.pinMode
    ? '/** Definimos los pines como entrada y salida **/\n'
    : ''
  const variablesComment = codeMap.variables
    ? '/** Definimos las variables que usará nuestro programa**/\n'
    : ''
  const librareisComment = codeMap.libraries
    ? '/** Definimos las librerias que utiliza el programa **/\n'
    : ''

  // Genera la estructura básica con setup y loop, colocando pinMode al inicio del setup
  let finalCode = `\n${indentCode(
    librareisComment + codeMap.libraries,
    1
  )}\n\n${indentCode(
    variablesComment + codeMap.variables,
    1
  )}\n${procedureDefinitions}\nvoid setup() {\n${indentCode(
    pinModeComment + codeMap.pinMode,
    1
  )}\n${indentCode(codeMap.setup, 1)}}\n\nvoid loop() {\n${indentCode(
    codeMap.loop,
    1
  )}}\n`

  return finalCode.trim() // Elimina espacios en blanco alrededor del código
}
generatorArduino['sensor_fuego'] = function (block) {
  const pin = 7
  const variableName = 'sensor_fuego'

  console.log('Generando sensor_fuego...')

  addVariableIfNotDefined(variableName, pin, 'Definimos el sensor de fuego')
  addPinModeIfNotDefined(pin, variableName, 'Configuramos el pin del sensor')

  return [
    `(digitalRead(${variableName}) == 1)`,
    generatorArduino.ORDER_EQUALITY
  ]
}

// Asegurarse de que el generador pueda manejar bloques 'math_number'
generatorArduino['math_number'] = function (block) {
  // Registro de depuración para verificar si el bloque es llamado correctamente
  console.log('Generando código para math_number')

  // Obtener el valor del número desde el bloque, o devolver '0' si es indefinido
  const code = block.getFieldValue('NUM')

  // Verificar si se obtiene el campo 'NUM'
  if (code === null || code === undefined) {
    console.error('El bloque math_number no tiene un campo NUM definido')
    return ['0', generatorArduino.ORDER_ATOMIC] // Devuelve '0' si el campo NUM es indefinido
  }

  return [code, generatorArduino.ORDER_ATOMIC] // Devolver el valor y el orden atómico
}

// Función para agregar pinMode en el setup
function addPinModeIfNotDefined(pin, variableName, comment) {
  if (
    !configuredPins[pin] &&
    variableName != 'Servo' &&
    variableName != 'sensor_fuego'
  ) {
    codeMap.pinMode += `pinMode(${pin}, OUTPUT);\n\n`
    configuredPins[pin] = true // Marcar pin como configurado
  } else if (!configuredPins[pin] && variableName == 'Servo') {
    codeMap.pinMode += `//${comment}\nservo.attach(${pin});\n\n`
    configuredPins[pin] = true // Marcar pin como configurado
  } else if (!configuredPins[pin] && variableName == 'sensor_fuego') {
    codeMap.pinMode += `pinMode(${variableName}, INPUT);\n\n`
    configuredPins[pin] = true // Marcar pin como configurado
  }
}

// Función para agregar la variable si no está definida
function addVariableIfNotDefined(variableName, initialValue, comment) {
  //Definimos una variable normal
  if (!definedVariables[variableName] && variableName != 'Servo') {
    codeMap.variables += `//${comment}\nint ${variableName} = ${initialValue};\n\n`
    definedVariables[variableName] = true // Marcar la variable como definida
  }
  //Estamos definiendo un servo
  else if (!definedVariables[variableName] && variableName == 'Servo') {
    codeMap.variables += `//${comment}\n${variableName} ${initialValue};\n\n`
    definedVariables[variableName] = true // Marcar la variable como definida
  }
}

// Función para generar digitalWrite con comentario
function generateDigitalWrite(pin, value, comment) {
  return `// ${comment}\ndigitalWrite(${pin}, ${value});\n`
}

// Función para generar analogWrite con comentario
function generateAnalogWrite(pin, value, comment) {
  return `// ${comment}\nanalogWrite(${pin}, ${value});\n`
}
//Función para agregar libreria si no esta definida
function addLibraryIfNotDefined(libraryName, comment) {
  if (!definedLibraries[libraryName] && libraryName == 'Servo') {
    codeMap.libraries += `${comment}\n#include <Servo.h>\n\n`
    definedLibraries[libraryName] = true // Marcar Libreria como agregada
  }
}

// Función para agregar helpers (funciones C++) una sola vez en la sección "libraries"
function addHelperFunctionIfNotDefined(key, code, comment = '') {
  if (!definedLibraries[key]) {
    if (comment) codeMap.libraries += `// ${comment}\n`
    codeMap.libraries += `${code}\n\n`
    definedLibraries[key] = true
  }
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
generatorArduino['encerled'] = function (block) {
  const pin = 13
  addPinModeIfNotDefined(pin) // Asegura que pinMode se coloca en el setup
  const comment = 'Encendiendo LED en Pin Digital 13' // Comentario para encender LED
  const code = generateDigitalWrite(pin, 'HIGH', comment)
  return code
}

// Bloque 'apagarled' (Led en Pin 13)
generatorArduino['apagarled'] = function (block) {
  const pin = 13
  addPinModeIfNotDefined(pin)
  const comment = 'Apagando LED en Pin Digital 13' // Comentario para apagar LED
  const code = generateDigitalWrite(pin, 'LOW', comment)
  return code
}

// Bloque 'aumentar_intensidad_led' (Controla la intensidad del LED en Pin 11)
generatorArduino['aumentar_intensidad_led'] = function (block) {
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
generatorArduino['bajar_intensidad_led'] = function (block) {
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
generatorArduino['esperar_un_segundo'] = function (block) {
  const code = '// Esperar 1 segundo\n' + 'delay(1000);\n'
  return code
}

// Bloque 'EncenderRojoA'
generatorArduino['EncenderRojoA'] = function (block) {
  const pin = 5
  addPinModeIfNotDefined(pin)
  const comment = 'Encendiendo Luz Roja conectada al Pin 5'
  const code = generateDigitalWrite(pin, 'HIGH', comment) + '\n'
  return code
}

// Bloque 'ApagarRojoA'
generatorArduino['ApagarRojoA'] = function (block) {
  const pin = 5
  addPinModeIfNotDefined(pin)
  const comment = 'Apagando Luz Roja conectada al Pin 5'
  const code = generateDigitalWrite(pin, 'LOW', comment) + '\n'
  return code
}

// Bloque 'EncenderAmarilloC'
generatorArduino['EncenderAmarilloC'] = function (block) {
  const pin = 6
  addPinModeIfNotDefined(pin)
  const comment = 'Encendiendo Luz Amarilla conectada al Pin 6'
  const code = generateDigitalWrite(pin, 'HIGH', comment) + '\n'
  return code
}

// Bloque 'ApagarAmarilloC'
generatorArduino['ApagarAmarilloC'] = function (block) {
  const pin = 6
  addPinModeIfNotDefined(pin)
  const comment = 'Apagando Luz Amarilla conectada al Pin 6'
  const code = generateDigitalWrite(pin, 'LOW', comment) + '\n'
  return code
}

// Bloque 'EncenderVerdeE'
generatorArduino['EncenderVerdeE'] = function (block) {
  const pin = 7
  addPinModeIfNotDefined(pin)
  const comment = 'Encendiendo Luz Verde conectada al Pin 7'
  const code = generateDigitalWrite(pin, 'HIGH', comment) + '\n'
  return code
}

// Bloque 'ApagarVerdeE'
generatorArduino['ApagarVerdeE'] = function (block) {
  const pin = 7
  addPinModeIfNotDefined(pin)
  const comment = 'Apagando Luz Verde conectada al Pin 7'
  const code = generateDigitalWrite(pin, 'LOW', comment) + '\n'
  return code
}

// Define la función para el bloque 'ejecutar_una_vez'
generatorArduino['ejecutar_una_vez'] = function (block) {
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

// Procedimiento sin retorno (procedures_defnoreturn)
generatorArduino['procedures_defnoreturn'] = function (block) {
  if (!generatorArduino.nameDB_) {
    console.error('Error: nameDB_ no está inicializado en el generador.')
    return ''
  }

  var funcName = generatorArduino.nameDB_.getName(
    block.getFieldValue('NAME'),
    Blockly.Procedures.NAME_TYPE
  )

  let branch = ''
  let currentBlock = block.getInputTargetBlock('STACK')

  while (currentBlock) {
    if (generatorArduino[currentBlock.type]) {
      branch += generatorArduino[currentBlock.type](currentBlock) || ''
    } else {
      console.warn(
        `Advertencia: No hay generador definido para el bloque '${currentBlock.type}'`
      )
    }
    currentBlock = currentBlock.getNextBlock()
  }

  var code = `void ${funcName}() {\n${indentCode(branch, 1)}}\n`
  return code
}

// Procedimiento con retorno (procedures_defreturn)
generatorArduino['procedures_defreturn'] = function (block) {
  var funcName = this.nameDB_.getName(
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
generatorArduino['procedures_callnoreturn'] = function (block) {
  var funcName = this.nameDB_.getName(
    block.getFieldValue('NAME'),
    Blockly.Procedures.NAME_TYPE
  )
  return funcName + '();\n'
}

// Bloque para 'repetir x cantidad de veces'
generatorArduino['controls_repeat_ext'] = function (block) {
  // Obtener el número de repeticiones
  var repeats = block.getField('TIMES')
    ? String(Number(block.getFieldValue('TIMES')))
    : generatorArduino.valueToCode(
        block,
        'TIMES',
        generatorArduino.ORDER_ASSIGNMENT
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

generatorArduino['controls_count_with_intensity'] = function (block) {
  var from =
    generatorArduino.valueToCode(
      block,
      'FROM',
      generatorArduino.ORDER_ATOMIC
    ) || '0'
  var to =
    generatorArduino.valueToCode(block, 'TO', generatorArduino.ORDER_ATOMIC) ||
    '0'

  // Asegurar que la variable intensidad se declara una sola vez
  addVariableIfNotDefined(
    'intensidad',
    from,
    'Definimos la variable que controla la intensidad'
  )

  // Código del for loop
  var branch = generatorArduino.statementToCode(block, 'DO')
  branch = indentCode(branch, 2) // Indentar el código interno

  var code = `for (int intensidad = ${from}; intensidad <= ${to}; intensidad++) {\n${branch}}\n`
  return code
}

generatorArduino['poner_intensidad_led'] = function (block) {
  const pin = 11

  // Obtener el ID de la variable
  const variableId = block.getFieldValue('INTENSITY')

  // Obtener el nombre de la variable usando el ID
  const variable = block.workspace.getVariableById(variableId)
  let intensityVar = variable ? variable.name : 'intensidad' // Usar 'intensidad' como valor por defecto si no se encuentra la variable

  // Limpiar el nombre de la variable
  intensityVar = cleanVariableName(intensityVar)

  // Asegurarse de que la variable intensidad esté declarada
  addVariableIfNotDefined(
    intensityVar,
    0,
    'Definimos la variable que controla la intensidad'
  )

  // Asegurarse de que el pinMode del LED ya esté configurado
  addPinModeIfNotDefined(pin)

  // Generar el código que asigna la intensidad al LED
  const code = `// Ponemos la intensidad del LED en el Pin 11\nanalogWrite(${pin}, ${intensityVar});\n`
  return code
}

generatorArduino['controls_for'] = function (block) {
  // Obtener el ID de la variable del bucle
  const variableId = block.getFieldValue('VAR')

  // Obtener el nombre de la variable usando el ID
  const variable = block.workspace.getVariableById(variableId)
  let variable0 = variable ? variable.name : 'i' // Usar 'i' como valor por defecto

  // Limpiar el nombre de la variable
  variable0 = cleanVariableName(variable0)

  // Asegurarse de que la variable del bucle esté declarada
  addVariableIfNotDefined(variable0, '0', 'Definimos la variable del bucle')

  // Obtener los valores "desde", "hasta" y "de"
  const argument0 = block.getField('FROM')
    ? String(Number(block.getFieldValue('FROM')))
    : generatorArduino.valueToCode(
        block,
        'FROM',
        generatorArduino.ORDER_ASSIGNMENT
      ) || '0'

  const argument1 = block.getField('TO')
    ? String(Number(block.getFieldValue('TO')))
    : generatorArduino.valueToCode(
        block,
        'TO',
        generatorArduino.ORDER_ASSIGNMENT
      ) || '10'

  const increment = block.getField('BY')
    ? String(Number(block.getFieldValue('BY')))
    : generatorArduino.valueToCode(
        block,
        'BY',
        generatorArduino.ORDER_ASSIGNMENT
      ) || '1'

  // Procesar los bloques dentro del bucle con recursividad
  let branch = ''
  let currentBlock = block.getInputTargetBlock('DO')
  while (currentBlock) {
    branch += this[currentBlock.type](currentBlock) || '' // Generar código para cada bloque dentro del bucle
    currentBlock = currentBlock.getNextBlock() // Mover al siguiente bloque dentro del bucle
  }

  // Aplicar indentación al código dentro del bucle
  branch = indentCode(branch, 2) // Indentar el contenido del bucle

  // Generar el código final del bucle for
  const code = `for (int ${variable0} = ${argument0}; ${variable0} <= ${argument1}; ${variable0} += ${increment}) {\n${branch}}\n`

  return code
}

// Función para limpiar los nombres de las variables
function cleanVariableName(name) {
  return name.replace(/\s+/g, '_').replace(/[^\w]/g, '') // Reemplazar espacios por guiones bajos y eliminar caracteres no válidos
}

generatorArduino['poner_intensidad_led_variante'] = function (block) {
  const pin = 11

  // Asegurarse de que el generador esté correctamente inicializado
  if (!generatorArduino.ORDER_ATOMIC) {
    generatorArduino.ORDER_ATOMIC = 0
  }

  // Asegurarse de que el campo 'INTENSITY' puede ser un número o una variable
  let intensityValue = generatorArduino.valueToCode(
    block,
    'INTENSITY',
    generatorArduino.ORDER_ATOMIC
  )

  // Si intensityValue es nulo o indefinido, ponemos un valor por defecto de '0'
  if (!intensityValue || intensityValue === '') {
    intensityValue = '0'
  }

  // Aseguramos que el pinMode del LED ya esté configurado para el pin 11
  addPinModeIfNotDefined(pin)

  // Generamos el código que pone la intensidad en el valor de la variable o número
  const code = `// Ponemos la intensidad del LED en el Pin 11\nanalogWrite(${pin}, ${intensityValue});\n`

  return code
}

generatorArduino['esperar_x_milisegundos'] = function (block) {
  // Obtener el valor del input MILLISECONDS
  const milliseconds = block.getFieldValue('MILLISECONDS') || '1000'

  // Generar el código con el comentario
  const code = `// Esperando ${milliseconds} milisegundos\ndelay(${milliseconds});\n`

  return code
}
// Bloque 'reducir' (Controla el acumulador de grados para el Servo)
generatorArduino['reducir_grados_servo'] = function (block) {
  addLibraryIfNotDefined('Servo', '//Importamos la libreria para usar el Servo')
  // Asegurar que la variable "grados" solo se define una vez
  addVariableIfNotDefined(
    'grados',
    0, // Valor inicial
    'Definimos la variable que controla los grados'
  )
  // Asegurar que se crea una sola instancia del servo
  addVariableIfNotDefined(
    'Servo',
    'servo', // Valor inicial
    'Creamos una Instancia de Servo'
  )

  //Definimos el attach en pinmode
  addPinModeIfNotDefined(
    2,
    'Servo',
    'Definimos el Pin al cual el servo se va utilizar'
  )

  //Retorno el codigo armado con los parametros enviados
  // Incrementar la variable "grados" en función del valor del bloque
  const code = `// Aumentamos los grados para poder mover el Servo\ngrados -= 10;\nservo.write(grados);\n\n`

  return code
}

// Bloque 'aumentar_grados_servo' (Controla el acumulador de grados para el Servo)
generatorArduino['aumentar_grados_servo'] = function (block) {
  addLibraryIfNotDefined('Servo', '//Importamos la libreria para usar el Servo')
  // Asegurar que la variable "grados" solo se define una vez
  addVariableIfNotDefined(
    'grados',
    0, // Valor inicial
    'Definimos la variable que controla los grados'
  )
  // Asegurar que se crea una sola instancia del servo
  addVariableIfNotDefined(
    'Servo',
    'servo', // Valor inicial
    'Creamos una Instancia de Servo'
  )

  //Definimos el attach en pinmode
  addPinModeIfNotDefined(
    2,
    'Servo',
    'Definimos el Pin al cual el servo se va utilizar'
  )

  //Retorno el codigo armado con los parametros enviados
  // Incrementar la variable "grados" en función del valor del bloque
  const code = `// Aumentamos los grados para poder mover el Servo\ngrados += 10;\nservo.write(grados);\n\n`

  return code
}

generatorArduino['controls_if'] = function (block) {
  // Número de cláusulas IF/ELSE IF
  const n = block.elseifCount_ || 0
  const hasElse = block.elseCount_ || false
  let code = ''

  // Primera condición (IF)
  const condition =
    generatorArduino.valueToCode(block, 'IF0', generatorArduino.ORDER_NONE) ||
    'false'

  console.log('CONDICIÓN DEL IF:', condition)

  let branch = ''
  let currentBlock = block.getInputTargetBlock('DO0')
  while (currentBlock) {
    branch += this[currentBlock.type](currentBlock) || ''
    currentBlock = currentBlock.getNextBlock()
  }
  branch = indentCode(branch, 2)
  code += `if (${condition}) {\n${branch}}`

  // ELSE IFs
  for (let i = 1; i <= n; i++) {
    const elseifCondition =
      generatorArduino.valueToCode(
        block,
        `IF${i}`,
        generatorArduino.ORDER_NONE
      ) || 'false'

    let elseifBranch = ''
    let elseifBlock = block.getInputTargetBlock(`DO${i}`)
    while (elseifBlock) {
      elseifBranch += this[elseifBlock.type](elseifBlock) || ''
      elseifBlock = elseifBlock.getNextBlock()
    }
    elseifBranch = indentCode(elseifBranch, 2)
    code += ` else if (${elseifCondition}) {\n${elseifBranch}}`
  }

  // ELSE
  if (hasElse) {
    let elseBranch = ''
    let elseBlock = block.getInputTargetBlock('ELSE')
    while (elseBlock) {
      elseBranch += this[elseBlock.type](elseBlock) || ''
      elseBlock = elseBlock.getNextBlock()
    }
    elseBranch = indentCode(elseBranch, 2)
    code += ` else {\n${elseBranch}}`
  }

  code += '\n'
  return code
}

generatorArduino['custom_if_condition'] = function (block) {
  const CONDITION = 'CONDITION'
  const DO = 'DO'

  // 1) Condición manual
  let conditionCode = 'false'
  const conditionBlock = block.getInputTargetBlock(CONDITION)
  if (conditionBlock) {
    const genFn = this[conditionBlock.type]
    if (typeof genFn === 'function') {
      const res = genFn.call(this, conditionBlock)
      conditionCode = Array.isArray(res) ? (res[0] ?? 'false') : res || 'false'
    } else {
      console.warn(`No generator for ${conditionBlock.type}`)
    }
  }

  // 2) Cuerpo manual
  let branch = ''
  let current = block.getInputTargetBlock(DO)
  while (current) {
    const fn = this[current.type]
    if (typeof fn === 'function') {
      branch += fn.call(this, current) || ''
    } else {
      console.warn(`No generator for ${current.type}`)
    }
    current = current.getNextBlock()
  }

  // 3) Trampa de bucle y **indentación interna**
  const trapped = this.addLoopTrap ? this.addLoopTrap(branch, block.id) : branch
  branch = typeof trapped === 'string' ? trapped : branch
  branch = indentCode(branch, 2) // 👈️ indentamos el contenido del if

  return `if (${conditionCode}) {\n${branch}}\n`
}

generatorArduino['ejecutar_por_siempre'] = function (block) {
  let currentBlock = block.getInputTargetBlock('LOOP_CODE')

  // Procesa todos los bloques conectados dentro de 'ejecutar_una_vez'
  while (currentBlock) {
    const code = this[currentBlock.type](currentBlock)
    if (code) {
      codeMap.loop += code // No aplicar indentación extra a `setup`
    }
    currentBlock = currentBlock.getNextBlock() // Mueve al siguiente bloque en la cadena
  }
  return ''
}
generatorArduino['custom_if_else_condition'] = function (block) {
  const CONDITION = 'CONDITION'
  const DO = 'DO'
  const ELSE = 'ELSE'

  // 1) Condición
  let conditionCode = 'false'
  const conditionBlock = block.getInputTargetBlock(CONDITION)
  if (conditionBlock) {
    const genFn = this[conditionBlock.type]
    if (typeof genFn === 'function') {
      const res = genFn.call(this, conditionBlock)
      conditionCode = Array.isArray(res) ? (res[0] ?? 'false') : res || 'false'
    } else {
      console.warn(`No generator for ${conditionBlock.type}`)
    }
  }

  // Helper para recolectar, atrapar e **indentar** una rama
  const collectBranchCode = inputName => {
    let out = ''
    let current = block.getInputTargetBlock(inputName)
    while (current) {
      const fn = this[current.type]
      if (typeof fn === 'function') {
        out += fn.call(this, current) || ''
      } else {
        console.warn(`No generator for ${current.type}`)
      }
      current = current.getNextBlock()
    }
    const trapped = this.addLoopTrap ? this.addLoopTrap(out, block.id) : out
    out = typeof trapped === 'string' ? trapped : out
    return indentCode(out, 2) // 👈️ indentamos el contenido de la rama
  }

  // 2) Ramas
  const branchIf = collectBranchCode(DO)
  const branchElse = collectBranchCode(ELSE)

  // 3) Emitir if...else
  return `if (${conditionCode}) {\n${branchIf}} \nelse {\n${branchElse}}\n`
}

generatorArduino['sensor_obstaculos'] = function (block) {
  const pin = 2
  const variableName = 'sensor_obstaculos'

  console.log('Generando sensor_obstaculos...')

  addVariableIfNotDefined(variableName, pin, 'Definimos el sensor de fuego')
  addPinModeIfNotDefined(pin, variableName, 'Configuramos el pin del sensor')

  return [
    `(digitalRead(${variableName}) == 1)`,
    generatorArduino.ORDER_EQUALITY
  ]
}
generatorArduino['sensor_ultrasonico_rango'] = function (block) {
  const min = Number(block.getFieldValue('MIN')) || 0
  const max = Number(block.getFieldValue('MAX')) || 400

  // Pines fijos
  const trigPin = 8
  const echoPin = 9

  // Configuración de pines
  if (!configuredPins[`trig_${trigPin}`]) {
    codeMap.pinMode += `pinMode(${trigPin}, OUTPUT);\n`
    configuredPins[`trig_${trigPin}`] = true
  }
  if (!configuredPins[`echo_${echoPin}`]) {
    codeMap.pinMode += `pinMode(${echoPin}, INPUT);\n`
    configuredPins[`echo_${echoPin}`] = true
  }

  // Inyectar helper en "libraries"
  addHelperFunctionIfNotDefined(
    'fn_lecturaUltrasonica',
    `
long lecturaUltrasonica(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 30000UL); // timeout 30ms
  if (duration == 0) return 9999;
  long distance = duration * 0.034 / 2;
  return distance;
}
`,
    'Función auxiliar para leer el sensor ultrasónico (cm)'
  )

  // Devuelve la condición booleana
  const code = `(lecturaUltrasonica(${trigPin}, ${echoPin}) >= ${min} && lecturaUltrasonica(${trigPin}, ${echoPin}) <= ${max})`
  return [code, generatorArduino.ORDER_LOGICAL_AND]
}

// ====== PARLANTE (BUZZER) ======

// Frecuencias de la octava 4
const _PARLANTE_NOTAS_OCT4 = {
  DO: 262, // C4
  RE: 294, // D4
  MI: 330, // E4
  FA: 349, // F4
  SOL: 392, // G4
  LA: 440, // A4
  SI: 494 // B4
}

generatorArduino['parlante'] = function (block) {
  const pin = 3

  // 1) Asegurar pinMode sin duplicar (usa tu helper)
  addPinModeIfNotDefined(pin, 'parlante', 'Configuramos el pin del parlante')

  // 2) Inyectar helpers C++ una sola vez en "libraries"
  addHelperFunctionIfNotDefined(
    'fn_parlanteHelpers',
    `
// Parlante (pin 2) ---
unsigned long _parlanteFinMillis = 0;
bool _parlanteActivo = false;

void sonarParlanteMillis(uint16_t frecuencia, unsigned long duracion_ms) {
  tone(2, frecuencia);
  _parlanteFinMillis = millis() + duracion_ms;
  _parlanteActivo = true;
}

void actualizarParlante() {
  if (_parlanteActivo && (long)(millis() - _parlanteFinMillis) >= 0) {
    noTone(2);
    _parlanteActivo = false;
  }
}

void silenciarParlante() {
  noTone(2);
  _parlanteActivo = false;
}
`,
    'Funciones auxiliares para manejar el parlante sin bloquear'
  )

  // 3) Hook en el loop (una sola vez)
  if (!definedLibraries['_parlante_loop_hook']) {
    codeMap.loop += `  actualizarParlante();\n`
    definedLibraries['_parlante_loop_hook'] = true
  }

  // 4) Obtener nota y calcular frecuencia
  const nota = (block.getFieldValue('NOTA') || 'LA').toUpperCase()
  const frecuencia = _PARLANTE_NOTAS_OCT4[nota] || 440

  // 5) Segundos -> milisegundos
  const segundos = Number(block.getFieldValue('SEGUNDOS') || 1)
  const durMs = Math.max(0, Math.round(segundos * 1000))

  // 6) Emitir llamada no bloqueante
  return `// Parlante: ${nota} por ${segundos}s\nsonarParlanteMillis(${frecuencia}, ${durMs});\n`
}

generatorArduino['parlante_intervalo'] = function (block) {
  const buzzerPin = 2
  addPinModeIfNotDefined(
    buzzerPin,
    'parlante',
    'Configuramos el pin del parlante'
  )

  // Inyectar helpers una sola vez
  addHelperFunctionIfNotDefined(
    'fn_parlanteIntervalo',
    `// --- Parlante con intervalo ---
unsigned long _parlantePrevToggle = 0;
bool _parlanteStateOn = false;

void actualizarParlanteIntervalo(int buzzerPin, int freq, unsigned long intervalo) {
  unsigned long now = millis();
  if (intervalo == 0) {
    // Sonido continuo
    if (!_parlanteStateOn) {
      tone(buzzerPin, freq);
      _parlanteStateOn = true;
    }
    return;
  }
  if (now - _parlantePrevToggle >= intervalo) {
    _parlantePrevToggle = now;
    if (_parlanteStateOn) {
      noTone(buzzerPin);
      _parlanteStateOn = false;
    } else {
      tone(buzzerPin, freq);
      _parlanteStateOn = true;
    }
  }
}
`,
    'Helper no bloqueante para parlante con intervalo'
  )

  // Hook en el loop
  if (!definedLibraries['_parlante_intervalo_hook']) {
    codeMap.loop += `  // Mantener beeps del parlante\n`
    definedLibraries['_parlante_intervalo_hook'] = true
  }

  // Parámetros desde el bloque
  const intervalo = Number(block.getFieldValue('INTERVALO'))
  const freq = Number(block.getFieldValue('FREQ') || 440)

  // Llamada en el loop
  return `actualizarParlanteIntervalo(${buzzerPin}, ${freq}, ${intervalo});\n`
}

generatorArduino['parlante_apagar'] = function (block) {
  const buzzerPin = 2
  // (Opcional) aseguramos pinMode por prolijidad; no hace falta para noTone, pero mantiene tu patrón:
  addPinModeIfNotDefined(
    buzzerPin,
    'parlante',
    'Configuramos el pin del parlante'
  )

  // No necesitamos helpers ni hook en loop: es una acción inmediata.
  return `// Apagar parlante\nnoTone(${buzzerPin});\n`
}
