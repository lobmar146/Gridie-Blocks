export const toolboxDesafio2Clase2Variante = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas',
      contents: [
        {
          kind: 'block',
          type: 'aumentar_intensidad_led' // Bloque nuevo para aumentar la intensidad
        },
        {
          kind: 'block',
          type: 'bajar_intensidad_led' // Bloque nuevo para bajar la intensidad
        },
        {
          kind: 'block',
          type: 'esperar_un_segundo'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Bucles',
      contents: [
        {
          kind: 'block',
          type: 'controls_repeat_ext' // Bloque de repetición
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
