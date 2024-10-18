export const toolboxDesafio3 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas', // Nueva categoría que agrupa todos los bloques de comandos y semáforo
      contents: [

        {
          kind: 'block',
          type: 'esperar_un_segundo' // Bloque 'esperar_un_segundo'
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
        },
        {
          kind: 'block',
          type: 'EncenderRojoB' // Semáforo: Encender Rojo Semáforo 2
        },
        {
          kind: 'block',
          type: 'ApagarRojoB' // Semáforo: Apagar Rojo Semáforo 2
        },
        {
          kind: 'block',
          type: 'EncenderAmarilloD' // Semáforo: Encender Amarillo Semáforo 2
        },
        {
          kind: 'block',
          type: 'ApagarAmarilloD' // Semáforo: Apagar Amarillo Semáforo 2
        },
        {
          kind: 'block',
          type: 'EncenderVerdeF' // Semáforo: Encender Verde Semáforo 2
        },
        {
          kind: 'block',
          type: 'ApagarVerdeF' // Semáforo: Apagar Verde Semáforo 2
        }
      ]
    },
    {
      kind: 'category',
      name: 'Procedimientos',
      custom: 'PROCEDURE' // Añadir los bloques de procedimientos aquí
    }
  ]
};
