import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'rates-cities-program-athletes.trycloudflare.com',
      '.trycloudflare.com',
    ],
  },
})
