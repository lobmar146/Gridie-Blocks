export const toolboxDesafio2 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Comandos',
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
          type: 'esperar_un_segundo' // Añadimos el bloque 'esperar_un_segundo'
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
