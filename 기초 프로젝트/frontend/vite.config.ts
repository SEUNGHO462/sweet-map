import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Avoid EPERM scan errors coming from an unreadable src/hooks directory
    watch: {
      ignored: ['**/src/hooks/**'],
    },
    // Prevent blocking overlay if some plugin still throws during watch
    hmr: {
      overlay: false,
    },
  },
  preview: {
    port: 5173,
  },
})
