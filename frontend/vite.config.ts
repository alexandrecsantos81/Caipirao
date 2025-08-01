import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react( )],
  resolve: {
    alias: [
      // Usando um formato de array que é mais explícito
      { find: '@', replacement: path.join(__dirname, 'src') }
    ]
  },
})
