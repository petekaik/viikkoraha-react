import { defineConfig } from 'vitest/config';

/**
 * UAT smoke — testaa tuotantoon deployattua sovellusta.
 * DEPLOY_URL ympäristömuuttujasta (default: gitpages.morgeweb.com).
 *
 * Ajo: npm run test:smoke
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/smoke/**/*.test.{js,mjs}'],
    env: {
      DEPLOY_URL: process.env.DEPLOY_URL || 'https://gitpages.morgeweb.com/viikkoraha',
      VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || '',
      VITE_GOOGLE_API_KEY: process.env.VITE_GOOGLE_API_KEY || '',
      VITE_SPREADSHEET_ID: process.env.VITE_SPREADSHEET_ID || '',
    },
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
