export const toolboxDesafio2 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Comandos', // Categoría para 'Comandos'
      contents: [
        {
          kind: 'block',
          type: 'encerled' // Bloque 'encerled' dentro de la categoría 'Comandos'
        },
        {
          kind: 'block',
          type: 'apagarled' // Bloque 'encerled' dentro de la categoría 'Comandos'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Procedimientos', // Categoría para 'Procedimientos'
      custom: 'PROCEDURE' // Esto le dice a Blockly que agregue los bloques de procedimientos
    }
  ]
}
