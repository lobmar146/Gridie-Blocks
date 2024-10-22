import * as Blockly from 'blockly'

export const blocksDesafio1 =
  Blockly.common.createBlockDefinitionsFromJsonArray([
    {
      type: 'encerled',
      message0: 'Encender Led Conectado en Pin 13 %1',
      args0: [
        {
          type: 'field_image',
          src: '/img/ejercicio1/led_encendido.png',
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
          src: '/img/ejercicio1/led_apagado.png',
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
          src: '/img/desafio2/rojo_encendido_a.png',
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
          src: '/img/desafio2/rojo_apagado_a.png',
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
          src: '/img/desafio2/amarillo_encender_c.png',
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
          src: '/img/desafio2/amarillo_apagado_c.png',
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
          src: '/img/desafio2/verde_encender_e.png',
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
          src: '/img/desafio2/verde_apagar_e.png',
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
          src: '/img/desafio2/rojo_encender_b.png',
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
          src: '/img/desafio2/rojo_apagado_b.png',
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
          src: '/img/desafio2/amarillo_encender_d.png',
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
          src: '/img/desafio2/amarillo_apagado_d.png',
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
          src: '/img/desafio2/verde_encender_e.png',
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
          src: '/img/desafio2/verde_apagar_e.png',
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
    }
  ])
