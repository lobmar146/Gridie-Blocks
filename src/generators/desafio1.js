import * as Blockly from 'blockly'

export const desafio1Generator = new Blockly.Generator('DESAFIO1')

// Objeto para almacenar el código generado por cada bloque
let codeMap = {
  setup: '', // Para almacenar el código que irá en setup
  loop: '' // Para almacenar el código que irá en loop
}

// Define la función para el bloque 'encerled'
desafio1Generator['encerled'] = function (block) {
  // Genera el código específico para el bloque 'encerled'
  return 'digitalWrite(13, HIGH);\n' // Devuelve el código directamente
}

// Define la función para el bloque 'apagarled'
desafio1Generator['apagarled'] = function (block) {
  // Genera el código específico para el bloque 'apagarled'
  return 'digitalWrite(13, LOW);\n' // Devuelve el código directamente
}

// Define la función para el bloque 'ejecutar_una_vez'
desafio1Generator['ejecutar_una_vez'] = function (block) {
  // Procesa todos los bloques conectados en serie dentro de 'ejecutar_una_vez'
  let currentBlock = block.getInputTargetBlock('SETUP_CODE')
  while (currentBlock) {
    codeMap.setup += desafio1Generator[currentBlock.type](currentBlock)

    currentBlock = currentBlock.getNextBlock() // Mueve al siguiente bloque en la cadena
  }

  return '' // No retorna código directamente, lo acumula en codeMap
}

// Define una función para generar el código combinado de todos los bloques
desafio1Generator.workspaceToCode = function (workspace) {
  // Limpia el mapa de código
  codeMap = {
    setup: '',
    loop: ''
  }

  // Obtiene todos los bloques conectados en el workspace
  const blocks = workspace.getAllBlocks()

  // Genera el código combinado de todos los bloques
  blocks.forEach(block => {
    if (block.type === 'ejecutar_una_vez') {
      this[block.type](block) // Genera el código para el bloque 'ejecutar_una_vez'
    }
  })

  // Genera la estructura básica con setup y loop, incluso si están vacíos
  let finalCode = `void setup() {\n${codeMap.setup}}\n\nvoid loop() {\n${codeMap.loop}}\n`

  return finalCode.trim() // Elimina espacios en blanco alrededor del código
}
