export const toolboxProlema1Clase3 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas', // Nueva categoría que agrupa todos los bloques de comandos y semáforo
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
      name: 'Alternativa condicional',
      contents: [
        {
          kind: 'block',
          type: 'custom_if_condition'
        },
        {
          kind: 'block',
          type: 'custom_if_else_condition'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Sensores',
      contents: [
        {
          kind: 'block',
          type: 'sensor_obstaculos'
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
