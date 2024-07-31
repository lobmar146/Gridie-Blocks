export const toolboxJS = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Logic',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' }
      ]
    },
    {
      kind: 'category',
      name: 'Loops',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' }
      ]
    },
    {
      kind: 'category',
      name: 'Math',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' }
      ]
    },
    {
      kind: 'category',
      name: 'Text',
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_print' }
      ]
    }
  ]
}
