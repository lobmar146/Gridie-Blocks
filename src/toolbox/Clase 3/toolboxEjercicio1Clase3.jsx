export const toolboxEjercicio1Clase3= {
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
          kind:'block',
          type: 'aumentar_grados_servo'
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
        }
      ]
    },
    {
      kind: 'category',
      name: 'Sensores',
      contents: [
        {
          kind: 'block',
          type: 'sensor_fuego' 
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
