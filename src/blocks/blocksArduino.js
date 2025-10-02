import * as Blockly from 'blockly'

const SENSORES = '#806000' // AAA con blanco (13.27:1)

export const blocksArduino = Blockly.common.createBlockDefinitionsFromJsonArray(
  [
    {
      type: 'encerled',
      message0: 'Encender Led Conectado en Pin 13 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/ejercicio1/led_encendido.png',
          width: 59,
          height: 59,
          alt: '*',
          flipRtl: false
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#0D47A1', // Azul muy oscuro (contraste adecuado para texto blanco)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'apagarled',
      message0: 'Apagar Led Conectado en Pin 13 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/ejercicio1/led_apagado.png',
          width: 59,
          height: 59,
          alt: '*',
          flipRtl: false
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#0D47A1', // Azul muy oscuro (contraste adecuado para texto blanco)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'EncenderRojoA',
      message0: 'Encender Luz Roja - Semáforo 1 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/rojo_encendido_a.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#B71C1C', // Rojo oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'ApagarRojoA',
      message0: 'Apagar Luz Roja - Semáforo 1 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/rojo_apagado_a.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#B71C1C', // Rojo oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'EncenderAmarilloC',
      message0: 'Encender Luz Amarilla - Semáforo 1 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/amarillo_encender_c.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#E65100', // Naranja oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'ApagarAmarilloC',
      message0: 'Apagar Luz Amarilla - Semáforo 1 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/amarillo_apagado_c.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#E65100', // Naranja oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'EncenderVerdeE',
      message0: 'Encender Luz Verde - Semáforo 1 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/verde_encender_e.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#1B5E20', // Verde oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'ApagarVerdeE',
      message0: 'Apagar Luz Verde - Semáforo 1 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/verde_apagar_e.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#1B5E20', // Verde oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'EncenderRojoB',
      message0: 'Encender Luz Roja - Semáforo 2 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/rojo_encender_b.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#B71C1C', // Rojo oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'ApagarRojoB',
      message0: 'Apagar Luz Roja - Semáforo 2 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/rojo_apagado_b.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#B71C1C', // Rojo oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'EncenderAmarilloD',
      message0: 'Encender Luz Amarilla - Semáforo 2 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/amarillo_encender_d.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#E65100', // Naranja oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'ApagarAmarilloD',
      message0: 'Apagar Luz Amarilla - Semáforo 2 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/amarillo_apagado_d.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#E65100', // Naranja oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'EncenderVerdeF',
      message0: 'Encender Luz Verde - Semáforo 2 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/verde_encender_e.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#1B5E20', // Verde oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'ApagarVerdeF',
      message0: 'Apagar Luz Verde - Semáforo 2 %1',
      args0: [
        {
          type: 'field_image',
          src: './img/desafio2/verde_apagar_e.png',
          width: 45,
          height: 45,
          alt: '*'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#1B5E20', // Verde oscuro (contraste adecuado)
      tooltip: '',
      helpUrl: ''
    },
    {
      type: 'ejecutar_una_vez',
      message0: 'Ejecutar 1 vez (setup) %1',
      args0: [
        {
          type: 'input_statement',
          name: 'SETUP_CODE'
        }
      ],
      colour: '#00796B', // Verde azulado muy oscuro, similar a las placas Arduino (contraste adecuado)
      tooltip: 'Código que se ejecutará una sola vez al inicio (setup)',
      helpUrl: ''
    },
    {
      type: 'esperar_un_segundo',
      message0: 'Esperar 1 segundo',
      previousStatement: null,
      nextStatement: null,
      colour: '#84651d', // Verde azulado muy oscuro (contraste adecuado)
      tooltip: 'Esperar 1 segundo antes de continuar',
      helpUrl: ''
    },
    {
      type: 'controls_repeat_ext', // Bloque para repetir X cantidad de veces
      message0: 'Repetir %1 veces',
      args0: [
        {
          type: 'field_number', // Usar un campo numérico directamente
          name: 'TIMES',
          value: 5, // Valor predeterminado para las repeticiones
          min: 1 // Limitar el valor mínimo a 1 (opcional)
        }
      ],
      message1: 'Hacer %1',
      args1: [
        {
          type: 'input_statement',
          name: 'DO' // Bloques que se ejecutan en cada repetición
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#ad5f23', // Naranja muy oscuro (contraste adecuado)
      tooltip:
        'Repetir un conjunto de instrucciones un número determinado de veces.',
      helpUrl: ''
    },
    {
      type: 'aumentar_intensidad_led',
      message0: 'Aumentar intensidad del LED en %1',
      args0: [
        {
          type: 'field_number', // Campo numérico para el valor de la intensidad
          name: 'INTENSITY',
          value: 0, // Valor predeterminado de intensidad (rango de 0 a 255)
          min: 0, // Valor mínimo
          max: 255 // Valor máximo
        }
      ],
      message1: '%1', // Mensaje que contendrá la imagen
      args1: [
        {
          type: 'field_image',
          src: './img/ejercicio1Clase2/Intensidad_Led_ascendente.png',
          width: 300,
          height: 100,
          alt: '*',
          flipRtl: false
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#0D47A1', // Azul muy oscuro (contraste adecuado para texto blanco)
      tooltip: 'Aumentar la intensidad del LED utilizando PWM (analogWrite)',
      helpUrl: ''
    },
    {
      type: 'bajar_intensidad_led',
      message0: 'Bajar intensidad del LED en %1',
      args0: [
        {
          type: 'field_number', // Campo numérico para el valor de la intensidad
          name: 'INTENSITY',
          value: 0, // Valor predeterminado de intensidad (rango de 0 a 255)
          min: 0, // Valor mínimo
          max: 255 // Valor máximo
        }
      ],
      message1: '%1',
      args1: [
        {
          type: 'field_image',
          src: './img/ejercicio1Clase2/Intensidad_Led_descendente.png',
          width: 300,
          height: 100,
          alt: '*',
          flipRtl: false
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#0D47A1', // Azul muy oscuro
      tooltip: 'Disminuir la intensidad del LED utilizando PWM (analogWrite)',
      helpUrl: ''
    },
    {
      type: 'poner_intensidad_led',
      message0: 'Poner intensidad del LED en %1',
      args0: [
        {
          type: 'field_variable', // Cambiar a campo de variable en lugar de número
          name: 'INTENSITY',
          variable: 'Intensidad' // Nombre predeterminado de la variable
        }
      ],
      message1: '%1', // Imagen del bloque
      args1: [
        {
          type: 'field_image',
          src: './img/ejercicio1Clase2/Intensidad_Led_ascendente.png', // Imagen igual a la de aumentar
          width: 300,
          height: 100,
          alt: '*',
          flipRtl: false
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#0D47A1', // Azul muy oscuro (mismo color que aumentar intensidad)
      tooltip:
        'Poner la intensidad del LED en el valor especificado utilizando PWM (analogWrite)',
      helpUrl: ''
    },
    {
      type: 'controls_for',
      message0: 'LLevar %1 desde %2 hasta %3 de %4',
      args0: [
        {
          type: 'field_variable', // Campo de variable para controlar el bucle
          name: 'VAR',
          variable: 'Intensidad' // Nombre predeterminado de la variable
        },
        {
          type: 'field_number', // Valor de inicio (desde)
          name: 'FROM',
          value: 0, // Valor predeterminado para las repeticiones
          min: 1 // Limitar el valor mínimo a 1 (opcional)
        },
        {
          type: 'field_number', // Valor de fin (hasta)
          name: 'TO',
          value: 5, // Valor predeterminado para las repeticiones
          min: 1 // Limitar el valor mínimo a 1 (opcional)
        },
        {
          type: 'field_number', // Incremento (de)
          name: 'BY',
          value: 1, // Valor predeterminado para las repeticiones
          min: 1 // Limitar el valor mínimo a 1 (opcional)
        }
      ],
      message1: 'hacer %1',
      args1: [
        {
          type: 'input_statement', // Aquí se colocan los bloques dentro del bucle
          name: 'DO'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 120, // Color típico para los bloques de control
      tooltip:
        'Cuenta desde un número hasta otro y ejecuta los bloques dentro del bucle',
      helpUrl: ''
    },
    {
      type: 'poner_intensidad_led_variante',
      message0: 'Poner intensidad del LED en %1',
      args0: [
        {
          type: 'input_value', // Permite valores numéricos o variables
          name: 'INTENSITY', // Nombre del campo
          check: ['Number', 'Variable'] // Acepta tanto números como variables
        }
      ],
      message1: '%1', // Imagen del bloque
      args1: [
        {
          type: 'field_image',
          src: './img/ejercicio1Clase2/Intensidad_Led_ascendente.png', // Imagen igual a la de aumentar intensidad
          width: 300,
          height: 100,
          alt: '*',
          flipRtl: false
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#0D47A1', // Azul muy oscuro
      tooltip:
        'Poner la intensidad del LED en el valor especificado utilizando PWM (analogWrite)',
      helpUrl: ''
    },
    {
      type: 'math_number',
      message0: '%1',
      args0: [
        {
          type: 'field_number',
          name: 'NUM',
          value: 0
        }
      ],
      output: 'Number',
      colour: 230,
      tooltip: 'Número',
      helpUrl: ''
    },
    {
      type: 'esperar_x_milisegundos',
      message0: 'Esperar %1 milisegundos ',
      args0: [
        {
          type: 'field_number', // Campo numérico para ingresar los milisegundos
          name: 'MILLISECONDS',
          value: 1000, // Valor predeterminado
          min: 1 // Valor mínimo
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#84651d', // Color del bloque
      tooltip:
        'Espera la cantidad de milisegundos especificada antes de continuar',
      helpUrl: ''
    },
    {
      type: 'aumentar_grados_servo',
      message0: 'Aumentar los grados del Servo en 10° %1',
      args0: [
        {
          type: 'field_image', // Imagen del servo
          src: './img/ejercicio3Clase2/servo.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],

      inputsInline: true, // Asegura que los elementos estén en línea
      previousStatement: null,
      nextStatement: null,
      colour: '#006400', // Verde oscuro con buen contraste
      tooltip: 'Aumentar los grados para utilizarlos luego en el servo',
      helpUrl: ''
    },
    {
      type: 'reducir_grados_servo',
      message0: 'Reducir los grados del Servo en 10° %1',
      args0: [
        {
          type: 'field_image', // Imagen del servo
          src: './img/ejercicio3Clase2/servo.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],

      inputsInline: true, // Asegura que los elementos estén en línea
      previousStatement: null,
      nextStatement: null,
      colour: '#006400', // Verde oscuro con buen contraste
      tooltip: 'Aumentar los grados para utilizarlos luego en el servo',
      helpUrl: ''
    },
    //Bloque if
    {
      type: 'controls_if',
      message0: 'Si %1',
      args0: [
        {
          type: 'input_value',
          name: 'IF0',
          check: 'Boolean'
        }
      ],
      message1: 'entonces %1',
      args1: [
        {
          type: 'input_statement',
          name: 'DO0'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#264653', // Color personalizado (azul petróleo)
      tooltip: 'Ejecuta los bloques dentro si la condición es verdadera.',
      helpUrl: ''
    },
    {
      type: 'custom_if_condition',
      message0: 'Si %1',
      args0: [
        {
          type: 'input_value',
          name: 'CONDITION',
          check: 'Boolean' // Mantenemos el check para la conexión visual correcta
        }
      ],
      message1: 'entonces %1',
      args1: [
        {
          type: 'input_statement',
          name: 'DO'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#264653', // Mismo color que tu if original
      tooltip:
        'Ejecuta los bloques dentro si la condición es verdadera ( workaround sin valueToCode ).',
      helpUrl: ''
    },
    {
      type: 'custom_if_else_condition',
      message0: 'Si %1',
      args0: [
        {
          type: 'input_value',
          name: 'CONDITION',
          check: 'Boolean'
        }
      ],
      message1: 'entonces %1',
      args1: [
        {
          type: 'input_statement',
          name: 'DO'
        }
      ],
      message2: 'sino %1',
      args2: [
        {
          type: 'input_statement',
          name: 'ELSE'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#264653',
      tooltip:
        'Si la condición es verdadera ejecuta "entonces", de lo contrario ejecuta "sino". (compatible con el workaround).',
      helpUrl: ''
    },
    {
      type: 'ejecutar_por_siempre',
      message0: 'Ejecutar por siempre %1',
      args0: [
        {
          type: 'input_statement',
          name: 'LOOP_CODE'
        }
      ],
      colour: '#00796B',
      tooltip: 'Código que se ejecutará por siempre',
      helpUrl: ''
    },
    {
      type: 'sensor_obstaculos',
      message0:
        '¿Está detectando un obstáculo el sensor conectado al pin 2? %1  ',
      args0: [
        {
          type: 'field_image',
          src: './img/clase3/sensorObstaculos.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],
      output: 'Boolean',
      colour: SENSORES,
      tooltip:
        'Devuelve verdadero si el sensor IR de obstáculos detecta algo en el pin 2.',
      helpUrl: ''
    },
    {
      type: 'sensor_ultrasonico_mayor15',
      message0: '¿Detecta un obstaculo a una distancia mayor a 15 cm? %1',
      args0: [
        {
          type: 'field_image',
          src: './img/clase3/sensorUltrasonico.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],
      output: 'Boolean',
      colour: SENSORES,
      tooltip: 'Devuelve en CM la distancia detectada.',
      helpUrl: ''
    },
    {
      type: 'sensor_ultrasonico_rango',
      message0: '¿Detecta un obstáculo entre %1 cm y %2 cm? %3',
      args0: [
        {
          type: 'field_number',
          name: 'MIN',
          value: 5, // valor por defecto
          min: 1, // límite inferior
          max: 400 // alcance típico de HC-SR04
        },
        {
          type: 'field_number',
          name: 'MAX',
          value: 10, // valor por defecto
          min: 1,
          max: 400
        },
        {
          type: 'field_image',
          src: './img/clase3/sensorUltrasonico.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],
      output: 'Boolean', // devuelve true/false
      colour: SENSORES,
      tooltip:
        'Devuelve verdadero si el sensor ultrasónico detecta un obstáculo dentro del rango especificado.',
      helpUrl: ''
    },
    {
      type: 'parlante',
      message0: 'Tocar la nota %1 durante %2 segundos %3',
      args0: [
        {
          type: 'field_dropdown',
          name: 'NOTA',
          options: [
            ['do', 'DO'],
            ['re', 'RE'],
            ['mi', 'MI'],
            ['fa', 'FA'],
            ['sol', 'SOL'],
            ['la', 'LA'],
            ['si', 'SI']
          ]
        },
        {
          type: 'field_number',
          name: 'SEGUNDOS',
          value: 1,
          min: 0,
          precision: 0.1
        },
        {
          type: 'field_image',
          src: './img/clase3/parlante.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#0D47A1',
      tooltip:
        'Reproduce una nota en el buzzer del pin 2 sin bloquear el loop.',
      helpUrl: ''
    },
    {
      type: 'parlante_intervalo',
      message0: 'Sonar parlante cada %1 milisegundos con tono %2 Hz %3',
      args0: [
        {
          type: 'field_number',
          name: 'INTERVALO',
          value: 500,
          min: 0
        },
        {
          type: 'field_number',
          name: 'FREQ',
          value: 440,
          min: 50,
          max: 5000
        },
        {
          type: 'field_image',
          src: './img/clase3/parlante.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#0D47A1',
      tooltip: 'Hace beeps periódicos según el intervalo (ms).',
      helpUrl: ''
    },
    {
      type: 'parlante_apagar',
      message0: 'Apagar parlante %1',
      args0: [
        {
          type: 'field_image',
          src: './img/clase3/parlante.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#0D47A1',
      tooltip: 'Detiene el parlante inmediatamente (noTone).',
      helpUrl: ''
    },
    {
      type: 'sensor_humedad_tierra_baja',
      message0: '¿La humedad detectada es baja? %1',
      args0: [
        {
          type: 'field_image', // Imagen del servo
          src: './img/clase4/Sensor_humedad_tierra.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],
      output: 'Boolean', // devuelve true/false
      colour: SENSORES,
      tooltip: 'Detecta si la humedad en la tierra es baja.',
      helpUrl: ''
    },
    {
      type: 'sensor_humedad_tierra_media',
      message0: '¿La humedad detectada es media? %1',
      args0: [
        {
          type: 'field_image', // Imagen del servo
          src: './img/clase4/Sensor_humedad_tierra_medio.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],
      output: 'Boolean', // devuelve true/false
      colour: SENSORES,
      tooltip: 'Detecta la humedad de la tierra si es media.',
      helpUrl: ''
    },
    {
      type: 'sensor_humedad_tierra_alta',
      message0: '¿La humedad detectada es alta? %1',
      args0: [
        {
          type: 'field_image', // Imagen del servo
          src: './img/clase4/Sensor_humedad_tierra_alto.svg',
          width: 70,
          height: 80,
          alt: '*',
          flipRtl: false
        }
      ],
      output: 'Boolean', // devuelve true/false
      colour: SENSORES,
      tooltip: 'Detecta la humedad de la tierra si es alta.',
      helpUrl: ''
    },
    {
      type: 'sensor_fuego',
      message0: '¿Se ha detectado fuego? %1',
      args0: [
        {
          type: 'field_image', // Imagen del servo
          src: './img/clase4/Sensor_fuego.svg',
          width: 90,
          height: 90,
          alt: '*',
          flipRtl: false
        }
      ],
      output: 'Boolean', // ✅ es un bloque de tipo valor
      colour: SENSORES,
      tooltip: 'Devuelve verdadero si se detecta una llama',
      helpUrl: ''
    },
    {
      type: 'sensor_gas_bajo',
      message0: '¿Hay bajo nivel de gas? %1',
      args0: [
        {
          type: 'field_image', // Imagen del servo
          src: './img/clase4/Sensor_gas.svg',
          width: 100,
          height: 100,
          alt: '*',
          flipRtl: false
        }
      ],
      output: 'Boolean', // ✅ es un bloque de tipo valor
      colour: SENSORES,
      tooltip: 'Devuelve verdadero si se detecta una llama',
      helpUrl: ''
    },
    {
      type: 'sensor_gas_medio',
      message0: '¿Hay nivel de gas medio? %1',
      args0: [
        {
          type: 'field_image', // Imagen del servo
          src: './img/clase4/Sensor_gas_medio.svg',
          width: 100,
          height: 100,
          alt: '*',
          flipRtl: false
        }
      ],
      output: 'Boolean', // ✅ es un bloque de tipo valor
      colour: SENSORES,
      tooltip: 'Devuelve verdadero si se detecta una llama',
      helpUrl: ''
    },
    {
      type: 'sensor_gas_alto',
      message0: '¿Hay nivel de gas alto? %1',
      args0: [
        {
          type: 'field_image', // Imagen del servo
          src: './img/clase4/Sensor_gas_alto.svg',
          width: 100,
          height: 100,
          alt: '*',
          flipRtl: false
        }
      ],
      output: 'Boolean', // ✅ es un bloque de tipo valor
      colour: SENSORES,
      tooltip: 'Devuelve verdadero si se detecta una llama',
      helpUrl: ''
    }
  ]
)
