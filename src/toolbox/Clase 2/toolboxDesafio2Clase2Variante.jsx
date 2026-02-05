export const toolboxDesafio2Clase2Variante = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas',
      contents: [
        {
          kind: 'block',
          type: 'poner_intensidad_led' // Bloque para poner la intensidad del LED
        },
        {
          kind: 'block',
          type: 'poner_intensidad_led_variante',
          inputs: {
            INTENSITY: {
              shadow: {
                type: 'math_number', // Valor numérico por defecto
                fields: { NUM: 255 } // Valor predeterminado
              }
            }
          }
        },

        {
          kind: 'block',
          type: 'esperar_un_segundo' // Bloque para esperar un segundo
        },
        {
          kind: 'block',
          type: 'math_number'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Repetitivas',
      contents: [
        {
          kind: 'block',
          type: 'controls_repeat_ext' // Bloque de repetición
        },
        {
          kind: 'block',
          type: 'controls_for' // Bloque del bucle 'for'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Procedimientos',
      custom: 'PROCEDURE'
    }
  ]
}
