import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // permite acceso externo (por IP o túneles)
    port: 5173,
    allowedHosts: ['.ngrok-free.app'], // acepta subdominios Ngrok
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // tu backend en Django
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
