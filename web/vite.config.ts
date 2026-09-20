import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react()],
    resolve: { dedupe: ['react', 'react-dom'] },
    server: {
      host: '127.0.0.1',
      fs: { allow: [projectRoot] },
      proxy: {
        '/api': { target: env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000', changeOrigin: true },
      },
    },
    test: { environment: 'jsdom', globals: true, include: ['tests/**/*.test.tsx'] },
  }
})
