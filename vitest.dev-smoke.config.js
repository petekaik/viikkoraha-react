import { defineConfig } from 'vitest/config';

/**
 * Dev smoke test — buildaa ja testaa preview-serverillä.
 * Identtinen tuotantoympäristön kanssa.
 *
 * Käyttö:
 *   1. npm run build
 *   2. npm run test:dev-smoke  (käynnistää preview'n automaattisesti)
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/smoke/deployment.test.{js,mjs}'],
    env: {
      DEPLOY_URL: 'http://localhost:4173/viikkoraha',
    },
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});
