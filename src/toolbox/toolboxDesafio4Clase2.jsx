export const toolboxDesafio4Clase2 = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Primitivas', // Nueva categoría que agrupa todos los bloques de comandos y semáforo
      contents: [
        { kind: 'block', type: 'aumentar_grados_servo' },
        { kind: 'block', type: 'reducir_grados_servo' },

        { kind: 'block', type: 'esperar_x_milisegundos' }
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
