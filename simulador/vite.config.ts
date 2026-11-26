import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Compila el puente como un módulo ES autocontenido (con su propio React 19),
// para que GrIDIE (React 18) lo cargue con import() dinámico sin conflictos.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: '../public/simulador',
    emptyOutDir: false,
    lib: {
      entry: 'src/simulador.tsx',
      formats: ['es'],
      fileName: () => 'gridie-simulador.js'
    }
  }
})
