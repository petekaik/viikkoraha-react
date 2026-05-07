/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import generateBuildId from './vite-build-id-plugin.js'

export default defineConfig({
  base: '/viikkoraha/',
  plugins: [react(), tailwindcss(), generateBuildId()],
  server: {
    host: true,
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
    css: true,
    exclude: ['tests/smoke/**', 'node_modules/**'],
  },
})
