import * as Blockly from 'blockly'

export const desafio1Generator = new Blockly.Generator('DESAFIO1')

// Objeto para almacenar el código generado por cada bloque
const codeMap = {}

// Define la función para el bloque 'encerled'
desafio1Generator['encerled'] = function (block) {
  // Genera el código específico para el bloque 'encerled'
  const code = 'Encender Led Conectado en Pin 13'
  codeMap[block.id] = code // Almacena el código en el mapa por ID de bloque
  return code
}

// Define la función para el bloque 'apagarled'
desafio1Generator['apagarled'] = function (block) {
  // Genera el código específico para el bloque 'apagarled'
  const code = 'Apagar Led Conectado en Pin 13'
  codeMap[block.id] = code // Almacena el código en el mapa por ID de bloque
  return code
}

// Define una función para generar el código combinado de todos los bloques
desafio1Generator.workspaceToCode = function (workspace) {
  // Limpia el mapa de código (buena practica de blockly)
  Object.keys(codeMap).forEach(key => delete codeMap[key])

  // Obtiene todos los bloques conectados en el workspace
  const blocks = workspace.getAllBlocks()

  // Genera el código combinado de todos los bloques
  let combinedCode = ''
  blocks.forEach(block => {
    const code = this[block.type](block) // Genera el código para el bloque específico
    if (code) {
      combinedCode += code + '\n'
    }
  })

  return combinedCode.trim() // Elimina espacios en blanco alrededor del código
}
