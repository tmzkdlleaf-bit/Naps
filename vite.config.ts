import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' }
  },
  server: {
    proxy: {
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: () => '/v1/messages',
        headers: {
          'x-api-key': process.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
      }
    }
  }
})
