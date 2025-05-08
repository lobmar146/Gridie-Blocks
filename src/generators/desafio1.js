import * as Blockly from 'blockly'

export const desafio1Generator = new Blockly.Generator('DESAFIO1')
desafio1Generator.ORDER_ATOMIC = 0
desafio1Generator.ORDER_UNARY_POSTFIX = 1
desafio1Generator.ORDER_UNARY_PREFIX = 2
desafio1Generator.ORDER_MULTIPLICATIVE = 3
desafio1Generator.ORDER_ADDITIVE = 4
desafio1Generator.ORDER_RELATIONAL = 5
desafio1Generator.ORDER_EQUALITY = 6
desafio1Generator.ORDER_LOGICAL_AND = 7
desafio1Generator.ORDER_LOGICAL_OR = 8
desafio1Generator.ORDER_CONDITIONAL = 9
desafio1Generator.ORDER_ASSIGNMENT = 10
desafio1Generator.ORDER_NONE = 99

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
if (typeof desafio1Generator.ORDER_ATOMIC === 'undefined') {
  desafio1Generator.ORDER_ATOMIC = 0 // Valor por defecto
}

//El corazon del generador de codigo
// Define una función para generar el código combinado de todos los bloques
desafio1Generator.workspaceToCode = function (workspace) {
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
desafio1Generator['sensor_fuego'] = function (block) {
  const pin = 7
  const variableName = 'sensor_fuego'

  console.log('Generando sensor_fuego...')

  addVariableIfNotDefined(variableName, pin, 'Definimos el sensor de fuego')
  addPinModeIfNotDefined(pin, variableName, 'Configuramos el pin del sensor')

  return [
    `(digitalRead(${variableName}) == 1)`,
    desafio1Generator.ORDER_EQUALITY
  ]
}

//Agregado el sensor_ultrasonico al generador de codigo
desafio1Generator['sensor_ultrasonico'] = function (block) {
  const pin = 8
  const variableName = 'sensor_ultrasonico'

  console.log('Generando sensor_ultrasonico...')

  addVariableIfNotDefined(variableName, pin, 'Definimos el sensor ultrasonico')
  addPinModeIfNotDefined(pin, variableName, 'Configuramos el pin del sensor ultrasonico')

  return [
    `(digitalRead(${variableName}) == 1)`,
    desafio1Generator.ORDER_EQUALITY
  ]
}

// Asegurarse de que el generador pueda manejar bloques 'math_number'
desafio1Generator['math_number'] = function (block) {
  // Registro de depuración para verificar si el bloque es llamado correctamente
  console.log('Generando código para math_number')

  // Obtener el valor del número desde el bloque, o devolver '0' si es indefinido
  const code = block.getFieldValue('NUM')

  // Verificar si se obtiene el campo 'NUM'
  if (code === null || code === undefined) {
    console.error('El bloque math_number no tiene un campo NUM definido')
    return ['0', desafio1Generator.ORDER_ATOMIC] // Devuelve '0' si el campo NUM es indefinido
  }

  return [code, desafio1Generator.ORDER_ATOMIC] // Devolver el valor y el orden atómico
}

// Función para agregar pinMode en el setup
function addPinModeIfNotDefined(pin, variableName, comment) {
  if (
    !configuredPins[pin] &&
    variableName != 'Servo' &&
    variableName != 'sensor_fuego' &&
    variableName != 'sensor_ultrasonico' 
  ) {
    codeMap.pinMode += `pinMode(${pin}, OUTPUT);\n\n`
    configuredPins[pin] = true // Marcar pin como configurado
  } else if (!configuredPins[pin] && variableName == 'Servo') {
    codeMap.pinMode += `//${comment}\nservo.attach(${pin});\n\n`
    configuredPins[pin] = true // Marcar pin como configurado
  } else if (!configuredPins[pin] && variableName == 'sensor_fuego') {
    codeMap.pinMode += `pinMode(${variableName}, INPUT);\n\n`
    configuredPins[pin] = true // Marcar pin como configurado
  } else if (!configuredPins[pin] && variableName == 'sensor_pepa') {
    codeMap.pinMode += `pinMode(${pin}, INPUT);\n\n`
    configuredPins[pin] = true // Marcar pin como configurado
  } else if (!configuredPins[pin] && variableName == 'sensor_ultrasonico') {
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
  const code = generateDigitalWrite(pin, 'HIGH', comment)
  return code
}

// Bloque 'apagarled' (Led en Pin 13)
desafio1Generator['apagarled'] = function (block) {
  const pin = 13
  addPinModeIfNotDefined(pin)
  const comment = 'Apagando LED en Pin Digital 13' // Comentario para apagar LED
  const code = generateDigitalWrite(pin, 'LOW', comment)
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

// Procedimiento sin retorno (procedures_defnoreturn)
desafio1Generator['procedures_defnoreturn'] = function (block) {
  if (!desafio1Generator.nameDB_) {
    console.error('Error: nameDB_ no está inicializado en el generador.')
    return ''
  }

  var funcName = desafio1Generator.nameDB_.getName(
    block.getFieldValue('NAME'),
    Blockly.Procedures.NAME_TYPE
  )

  let branch = ''
  let currentBlock = block.getInputTargetBlock('STACK')

  while (currentBlock) {
    if (desafio1Generator[currentBlock.type]) {
      branch += desafio1Generator[currentBlock.type](currentBlock) || ''
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
desafio1Generator['procedures_defreturn'] = function (block) {
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
desafio1Generator['procedures_callnoreturn'] = function (block) {
  var funcName = this.nameDB_.getName(
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

desafio1Generator['poner_intensidad_led'] = function (block) {
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

desafio1Generator['controls_for'] = function (block) {
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
    : desafio1Generator.valueToCode(
        block,
        'FROM',
        desafio1Generator.ORDER_ASSIGNMENT
      ) || '0'

  const argument1 = block.getField('TO')
    ? String(Number(block.getFieldValue('TO')))
    : desafio1Generator.valueToCode(
        block,
        'TO',
        desafio1Generator.ORDER_ASSIGNMENT
      ) || '10'

  const increment = block.getField('BY')
    ? String(Number(block.getFieldValue('BY')))
    : desafio1Generator.valueToCode(
        block,
        'BY',
        desafio1Generator.ORDER_ASSIGNMENT
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

desafio1Generator['poner_intensidad_led_variante'] = function (block) {
  const pin = 11

  // Asegurarse de que el generador esté correctamente inicializado
  if (!desafio1Generator.ORDER_ATOMIC) {
    desafio1Generator.ORDER_ATOMIC = 0
  }

  // Asegurarse de que el campo 'INTENSITY' puede ser un número o una variable
  let intensityValue = desafio1Generator.valueToCode(
    block,
    'INTENSITY',
    desafio1Generator.ORDER_ATOMIC
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

desafio1Generator['esperar_x_milisegundos'] = function (block) {
  // Obtener el valor del input MILLISECONDS
  const milliseconds = block.getFieldValue('MILLISECONDS') || '1000'

  // Generar el código con el comentario
  const code = `// Esperando ${milliseconds} milisegundos\ndelay(${milliseconds});\n`

  return code
}
// Bloque 'reducir' (Controla el acumulador de grados para el Servo)
desafio1Generator['reducir_grados_servo'] = function (block) {
  const gradosChange = Number(block.getFieldValue('GRADOS')) // Obtener el valor del bloque

  addLibraryIfNotDefined('Servo', 'Importamos la libreria para usar el Servo')
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
  const code = `// Aumentamos los grados para poder mover el Servo\ngrados -= ${gradosChange};\nservo.write(grados);\n\n`

  return code
}

// Bloque 'aumentar_grados_servo' (Controla el acumulador de grados para el Servo)
desafio1Generator['aumentar_grados_servo'] = function (block) {
  const gradosChange = Number(block.getFieldValue('GRADOS')) // Obtener el valor del bloque

  addLibraryIfNotDefined('Servo', 'Importamos la libreria para usar el Servo')
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
  const code = `// Aumentamos los grados para poder mover el Servo\ngrados += ${gradosChange};\nservo.write(grados);\n\n`

  return code
}

desafio1Generator['controls_if'] = function (block) {
  // Número de cláusulas IF/ELSE IF
  const n = block.elseifCount_ || 0
  const hasElse = block.elseCount_ || false
  let code = ''

  // Primera condición (IF)
  const condition =
    desafio1Generator.valueToCode(block, 'IF0', desafio1Generator.ORDER_NONE) ||
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
      desafio1Generator.valueToCode(
        block,
        `IF${i}`,
        desafio1Generator.ORDER_NONE
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

desafio1Generator['custom_if_condition'] = function (block) {
  // Este generador maneja la condición manualmente, SIN usar valueToCode

  const conditionInputName = 'CONDITION'
  const doStatementName = 'DO'

  // 1. Obtener el bloque conectado a la entrada de condición
  const conditionBlock = block.getInputTargetBlock(conditionInputName)

  let conditionCode = 'false' // Valor por defecto si no hay bloque o falla la generación

  if (conditionBlock) {
    const blockType = conditionBlock.type
    console.log(
      `Custom IF: Block type connected to ${conditionInputName}:`,
      blockType
    )

    // 2. Buscar manualmente la función generadora para el tipo de bloque conectado
    const blockGeneratorFunc = this[blockType]
    console.log(
      `Custom IF: Generator function found for ${blockType}:`,
      typeof blockGeneratorFunc === 'function'
        ? blockGeneratorFunc
        : 'Not found'
    )

    // 3. Si la función generadora existe, llamarla manualmente
    if (typeof blockGeneratorFunc === 'function') {
      try {
        // Llamar la función generadora. Usamos .call(this, ...) para asegurar que 'this' dentro
        // de la función generadora sea la instancia correcta del generador.
        // Esperamos un array [código, orden] como lo devuelve tu generador sensor_fuego
        const result = blockGeneratorFunc.call(this, conditionBlock)

        // Verificar si el resultado es el formato esperado [código, orden]
        if (Array.isArray(result) && result.length >= 1) {
          conditionCode = result[0] // Obtenemos solo el código
          // Aquí NO estamos manejando el 'orden' ni envolviendo en paréntesis.
          // Para el bloque sensor_fuego, que probablemente ya devuelve '(codigo == 1)', esto debería estar bien.
        } else {
          console.warn(
            `Custom IF: Generator for ${blockType} returned unexpected format:`,
            result
          )
          conditionCode = 'false' // Usar por defecto si el generador no devuelve el formato esperado
        }

        console.log(
          `Custom IF: Generated code for condition (${blockType}):`,
          conditionCode
        )
      } catch (error) {
        console.error(
          `Custom IF: Error calling generator for ${blockType}:`,
          error
        )
        conditionCode = 'false' // Usar por defecto si la llamada falla
      }
    } else {
      console.warn(
        `Custom IF: No generator function found for block type ${blockType}.`
      )
      conditionCode = 'false' // Usar por defecto si no hay generador
    }
  } else {
    console.log(`Custom IF: No block connected to ${conditionInputName} input.`)
    conditionCode = 'false' // Usar por defecto si no hay bloque
  }

  // 4. Generar el código para los bloques dentro del 'DO' (esto sí usa statementToCode normal)
  const doCode = this.statementToCode(block, doStatementName)

  // 5. Combinar todo en la estructura del if
  const code = `if (${conditionCode}) {\n${this.addLoopTrap(doCode)}}\n` // Puedes añadir this.addLoopTrap si lo usas

  return code
}

//generador sensor pepa
desafio1Generator['sensor_pepa'] = function (block) {
  const pin = 7
  const variableName = 'sensor_pepa'

  console.log('Generando sensor_pepa...')

  addVariableIfNotDefined(variableName, pin, 'Definimos el sensor de pepa')
  addPinModeIfNotDefined(pin, variableName, 'Configuramos el pin del pepa')

  return [
    `(digitalRead(${variableName}) == 1)`,
    desafio1Generator.ORDER_EQUALITY
  ]
}
