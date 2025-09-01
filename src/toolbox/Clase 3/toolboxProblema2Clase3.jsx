export const toolboxProblema2Clase3 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas', // Nueva categoría que agrupa todos los bloques de comandos y semáforo
      contents: [
        {
          kind: 'block',
          type: 'parlante_intervalo'
        },
        {
          kind: 'block',
          type: 'parlante_apagar'
        },
        {
          kind: 'block',
          type: 'EncenderRojoA' // Semáforo: Encender Rojo Semáforo 1
        },
        {
          kind: 'block',
          type: 'ApagarRojoA' // Semáforo: Apagar Rojo Semáforo 1
        },
        {
          kind: 'block',
          type: 'EncenderAmarilloC' // Semáforo: Encender Amarillo Semáforo 1
        },
        {
          kind: 'block',
          type: 'ApagarAmarilloC' // Semáforo: Apagar Amarillo Semáforo 1
        },
        {
          kind: 'block',
          type: 'EncenderVerdeE' // Semáforo: Encender Verde Semáforo 1
        },
        {
          kind: 'block',
          type: 'ApagarVerdeE' // Semáforo: Apagar Verde Semáforo 1
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
