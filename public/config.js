// Configuración de la versión web de GrIDIE Blocks. Se puede editar en el sitio ya
// publicado sin volver a compilar la web.
//
// compiladorUrl: dirección del servidor de compilación (servidor-compilacion/).
//   Dejalo vacío si el mismo servidor sirve la web (por ejemplo, en Render o en tu PC
//   con "npm run servidor-compilacion" después de "npm run build:web").
//   Si la web está en otro lado (por ejemplo, Vercel), poné la dirección completa:
//   compiladorUrl: 'https://mi-compilador.onrender.com/api/compilar'
window.GRIDIE_CONFIG = {
  compiladorUrl: ''
}
