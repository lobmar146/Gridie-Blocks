// Configuración de la versión web de GrIDIE Blocks. Se puede editar en el sitio ya
// publicado sin volver a compilar la web.
//
// compiladorUrl: dirección del servidor de compilación (servidor-compilacion/).
//   Vacío = el mismo sitio que sirve la web (Render, o tu PC con iniciar-windows.bat).
//   Vercel no puede compilar Arduino, así que ahí se usa el servidor de Render.
var RENDER = 'https://gridie-blocks.onrender.com/api/compilar'

window.GRIDIE_CONFIG = {
  compiladorUrl: /\.vercel\.app$/.test(window.location.hostname) ? RENDER : ''
}
