import * as Blockly from 'blockly'

export const desafio1Generator = new Blockly.Generator('DESAFIO1')

// Objeto para almacenar el código generado por cada bloque
let codeMap = {
  setup: '', // Código que irá en setup
  loop: '' // Código que irá en loop
}

// Define la función para el bloque 'encerled'
desafio1Generator['encerled'] = function (block) {
  return 'digitalWrite(13, HIGH);\n' // Devuelve el código directamente
}

// Define la función para el bloque 'apagarled'
desafio1Generator['apagarled'] = function (block) {
  return 'digitalWrite(13, LOW);\n' // Devuelve el código directamente
}

// Define la función para el bloque 'ejecutar_una_vez'
desafio1Generator['ejecutar_una_vez'] = function (block) {
  let currentBlock = block.getInputTargetBlock('SETUP_CODE')

  // Procesa todos los bloques conectados dentro de 'ejecutar_una_vez'
  while (currentBlock) {
    const code = this[currentBlock.type](currentBlock)
    if (code) {
      codeMap.setup += code
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

  // Limpia el mapa de código
  codeMap = {
    setup: '', // Código que irá en setup
    loop: '' // Código que irá en loop
  }

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

  // Genera la estructura básica con setup y loop, incluso si están vacíos
  let finalCode = `${procedureDefinitions}\nvoid setup() {\n${codeMap.setup}}\n\nvoid loop() {\n${codeMap.loop}}\n`

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
  var code = 'void ' + funcName + '() {\n' + branch + '}\n'
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
    'int ' + funcName + '() {\n' + branch + '  return ' + returnValue + ';\n}\n'
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
