import * as Blockly from 'blockly'

export const desafio1Generator = new Blockly.Generator('DESAFIO1')

// Objeto para almacenar el código generado por cada bloque
let codeMap = {
  setup: '', // Código que irá en setup
  loop: '' // Código que irá en loop
}

// Función para agregar pinMode y digitalWrite
function addPinModeAndDigitalWrite(pin, state) {
  const pinModeCode = `pinMode(${pin}, OUTPUT);\n`;
  const digitalWriteCode = `digitalWrite(${pin}, ${state});\n`;
  return pinModeCode + digitalWriteCode;
}

// Bloque 'encerled' (Led en Pin 13)
desafio1Generator['encerled'] = function(block) {
  const code = addPinModeAndDigitalWrite(13, 'HIGH');
  return code; // Solo agrega código en setup
};

// Bloque 'apagarled' (Led en Pin 13)
desafio1Generator['apagarled'] = function(block) {
  const code = addPinModeAndDigitalWrite(13, 'LOW');
  return code;
};

// Define la función para el bloque 'esperar_un_segundo'
desafio1Generator['esperar_un_segundo'] = function(block) {
  const code = 'delay(1000);\n'; // Genera el código delay(1000) en Arduino
  return code;
};

// Bloque 'EncenderRojoA'
desafio1Generator['EncenderRojoA'] = function(block) {
  const code = addPinModeAndDigitalWrite(5, 'HIGH') + 'delay(1000);\n';
  return code;
};

// Bloque 'ApagarRojoA'
desafio1Generator['ApagarRojoA'] = function(block) {
  const code = addPinModeAndDigitalWrite(5, 'LOW') + 'delay(1000);\n';
  return code;
};

// Bloque 'EncenderAmarilloC'
desafio1Generator['EncenderAmarilloC'] = function(block) {
  const code = addPinModeAndDigitalWrite(6, 'HIGH') + 'delay(1000);\n';
  return code;
};

// Bloque 'ApagarAmarilloC'
desafio1Generator['ApagarAmarilloC'] = function(block) {
  const code = addPinModeAndDigitalWrite(6, 'LOW') + 'delay(1000);\n';
  return code;
};

// Bloque 'EncenderVerdeE'
desafio1Generator['EncenderVerdeE'] = function(block) {
  const code = addPinModeAndDigitalWrite(7, 'HIGH') + 'delay(1000);\n';
  return code;
};

// Bloque 'ApagarVerdeE'
desafio1Generator['ApagarVerdeE'] = function(block) {
  const code = addPinModeAndDigitalWrite(7, 'LOW') + 'delay(1000);\n';
  return code;
};

// Bloque 'EncenderRojoB'
desafio1Generator['EncenderRojoB'] = function(block) {
  const code = addPinModeAndDigitalWrite(8, 'HIGH') + 'delay(1000);\n';
  return code;
};

// Bloque 'ApagarRojoB'
desafio1Generator['ApagarRojoB'] = function(block) {
  const code = addPinModeAndDigitalWrite(8, 'LOW') + 'delay(1000);\n';
  return code;
};

// Bloque 'EncenderAmarilloD'
desafio1Generator['EncenderAmarilloD'] = function(block) {
  const code = addPinModeAndDigitalWrite(9, 'HIGH') + 'delay(1000);\n';
  return code;
};

// Bloque 'ApagarAmarilloD'
desafio1Generator['ApagarAmarilloD'] = function(block) {
  const code = addPinModeAndDigitalWrite(9, 'LOW') + 'delay(1000);\n';
  return code;
};

// Bloque 'EncenderVerdeF'
desafio1Generator['EncenderVerdeF'] = function(block) {
  const code = addPinModeAndDigitalWrite(10, 'HIGH') + 'delay(1000);\n';
  return code;
};

// Bloque 'ApagarVerdeF'
desafio1Generator['ApagarVerdeF'] = function(block) {
  const code = addPinModeAndDigitalWrite(10, 'LOW') + 'delay(1000);\n';
  return code;
};


// Define la función para el bloque 'esperar 1 segundo'
desafio1Generator['esperar_un_segundo'] = function (block) {
  var code = 'delay(1000);\n' // Genera el código delay(1000) en Arduino
  return code
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
