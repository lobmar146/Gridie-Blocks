import path from 'path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

// En desarrollo, /api/compilar compila con el arduino-cli local (ver servidor-compilacion/),
// así se puede probar el simulador en el navegador sin levantar otro servidor.
const compiladorEnDesarrollo = (): Plugin => ({
  name: 'gridie-compilador',
  apply: 'serve',
  async configureServer(server) {
    const { manejarPedido } = await import(
      './servidor-compilacion/compilar.mjs'
    )
    server.middlewares.use('/api/compilar', (req, res) =>
      manejarPedido(req, res)
    )
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Relative path for assets
  plugins: [react(), compiladorEnDesarrollo()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
