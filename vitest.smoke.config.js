import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/smoke/**/*.test.{js,mjs}'],
    envDir: '.',
    envPrefix: ['VITE_', 'DEPLOY_'],
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
