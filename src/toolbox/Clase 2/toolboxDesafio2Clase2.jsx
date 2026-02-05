export const toolboxDesafio2Clase2 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas',
      contents: [
        {
          kind: 'block',
          type: 'encerled'
        },
        {
          kind: 'block',
          type: 'apagarled'
        },
        {
          kind: 'block',
          type: 'esperar_x_milisegundos' // Bloque 'esperar_x_milisegundos'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Repetitivas',
      contents: [
        {
          kind: 'block',
          type: 'controls_repeat_ext'
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
