export const toolboxDesafio1 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas', // Categoría para 'Comandos'
      contents: [
        {
          kind: 'block',
          type: 'encerled' // Bloque 'encerled' dentro de la categoría 'Comandos'
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
