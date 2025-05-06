export const toolboxDesafio6Clase2 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas', // Nueva categoría que agrupa todos los bloques de comandos y semáforo
      contents: [
        { kind: 'block', type: 'aumentar_grados_servo' },
        { kind: 'block', type: 'reducir_grados_servo' },
        { kind: 'block', type: 'esperar_x_milisegundos' },
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
