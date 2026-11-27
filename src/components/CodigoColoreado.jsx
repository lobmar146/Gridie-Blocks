// Muestra el código de Arduino con colores, al estilo del tema Monokai.
// Un resaltador chiquito hecho a mano: alcanza para el código que generan los bloques.

const PALABRAS_CLAVE = new Set([
  'if',
  'else',
  'for',
  'while',
  'do',
  'return',
  'switch',
  'case',
  'break',
  'continue',
  'default',
  'const',
  'static',
  'volatile',
  'true',
  'false',
  'HIGH',
  'LOW',
  'INPUT',
  'OUTPUT',
  'INPUT_PULLUP',
  'new',
  'delete'
])
const TIPOS = new Set([
  'void',
  'int',
  'long',
  'float',
  'double',
  'char',
  'bool',
  'boolean',
  'byte',
  'unsigned',
  'short',
  'String',
  'Servo',
  'word',
  'size_t'
])

// Cada parte del código, en orden de prioridad.
const PATRON =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(^[ \t]*#[^\n]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)/gm

const COLORES = {
  // Comentarios más claros que en el Monokai original, para pasar WCAG AA.
  comentario: 'text-[#a59f85] italic',
  texto: 'text-[#e6db74]',
  directiva: 'text-[#f92672]',
  numero: 'text-[#ae81ff]',
  funcion: 'text-[#a6e22e]',
  clave: 'text-[#f92672]',
  tipo: 'text-[#66d9ef] italic'
}

function partes(codigo) {
  const salida = []
  let ultimo = 0
  for (const m of codigo.matchAll(PATRON)) {
    if (m.index > ultimo) salida.push([null, codigo.slice(ultimo, m.index)])
    const [todo, comentario, texto, directiva, numero, funcion, palabra] = m
    let clase = null
    if (comentario) clase = 'comentario'
    else if (texto) clase = 'texto'
    else if (directiva) clase = 'directiva'
    else if (numero) clase = 'numero'
    else if (funcion)
      clase = TIPOS.has(funcion)
        ? 'tipo'
        : PALABRAS_CLAVE.has(funcion)
          ? 'clave'
          : 'funcion'
    else if (palabra)
      clase = TIPOS.has(palabra)
        ? 'tipo'
        : PALABRAS_CLAVE.has(palabra)
          ? 'clave'
          : null
    salida.push([clase, todo])
    ultimo = m.index + todo.length
  }
  if (ultimo < codigo.length) salida.push([null, codigo.slice(ultimo)])
  return salida
}

export default function CodigoColoreado({ codigo, className = '' }) {
  return (
    <pre
      aria-label="Código generado"
      className={`overflow-auto whitespace-pre bg-[#272822] p-3 font-mono text-xs leading-relaxed text-[#f8f8f2] ${className}`}
    >
      <code>
        {partes(codigo || '').map(([clase, texto], i) =>
          clase ? (
            <span key={i} className={COLORES[clase]}>
              {texto}
            </span>
          ) : (
            texto
          )
        )}
      </code>
    </pre>
  )
}
