import * as Blockly from 'blockly'

export const blocksDesafio1 =
  Blockly.common.createBlockDefinitionsFromJsonArray([
    {
      type: 'encerled',
      message0: 'Encender Led Conectado en Pin 13 %1',
      args0: [
        {
          type: 'field_image',
          src: 'https://cdn-icons-png.flaticon.com/512/2534/2534928.png',
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
      message0: 'Encender Led Conectado en Pin 13 %1',
      args0: [
        {
          type: 'field_image',
          src: 'https://cdn-icons-png.flaticon.com/512/2338/2338838.png',
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
    }
  ])
