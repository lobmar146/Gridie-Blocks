export const toolboxEjercicio2Clase3 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas', // Nueva categoría que agrupa todos los bloques de comandos y semáforo
      contents: [
        {
          kind: 'block',
          type: 'parlante_intervalo'
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
          type: 'sensor_ultrasonico_rango'
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
