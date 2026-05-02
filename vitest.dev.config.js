/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

/**
 * Dev-test config — käyttää .env.test-tiedoston arvoja.
 * Ajettavissa ennen deployta paikallisesti:
 *   npx vitest --config vitest.dev.config.js run
 */
export default defineConfig({
  test: {
    env: {
      VITE_GOOGLE_CLIENT_ID: process.env.VITE_TEST_CLIENT_ID || '447744705396-r873fiunqg6fskcpvvtnladprsm5nami.apps.googleusercontent.com',
      VITE_GOOGLE_API_KEY: process.env.VITE_TEST_API_KEY || 'AIzaSyBkWIiLMvJO0muQPJFLLYV8wn-fuVLPmFI',
      VITE_DEFAULT_SPREADSHEET_ID: '',
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
    css: true,
    exclude: ['tests/smoke/**', 'node_modules/**'],
  },
});
