import * as Blockly from 'blockly';

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
      colour: 240,
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
      colour: 240,
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
      colour: '#cb0019',
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
      colour: '#cb0019',
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
      colour: '#a6a100',
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
      colour: '#a6a100',
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
      colour: 100,
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
      colour: 100,
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
      colour: '#cb0019',
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
      colour: '#cb0019',
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
      colour: '#a6a100',
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
      colour: '#a6a100',
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
      colour: 100,
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
      colour: 100,
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
      colour: 120,
      tooltip: 'Código que se ejecutará una sola vez al inicio (setup)',
      helpUrl: ''
    },
        {
      type: 'esperar_un_segundo',
      message0: 'Esperar 1 segundo',
      previousStatement: null,
      nextStatement: null,
      colour: 50, // Puedes cambiar el color si lo prefieres
      tooltip: 'Esperar 1 segundo antes de continuar',
      helpUrl: ''
    }
  ]);
