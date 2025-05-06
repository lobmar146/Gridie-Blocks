export const toolboxDesafio1Clase2 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas', // Nueva categoría que agrupa todos los bloques de comandos y semáforo
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
          type: 'esperar_un_segundo' // Bloque 'esperar_un_segundo'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Repetitivas',
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
      custom: 'PROCEDURE' // Añadir los bloques de procedimientos aquí
    }
  ]
}
