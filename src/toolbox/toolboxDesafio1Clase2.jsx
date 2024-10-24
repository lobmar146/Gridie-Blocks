export const toolboxDesafio1Clase2 = {
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
          type: 'bajar_intensidad_led' // Bloque nuevo para aumentar la intensidad
        },
        {
          kind: 'block',
          type: 'esperar_un_segundo'
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
