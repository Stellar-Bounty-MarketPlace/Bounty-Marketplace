import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/main.ts'],
    },
  },
  resolve: {
    alias: {
      '@bounty/shared': resolve(__dirname, '../../packages/shared/src'),
      '@bounty/database': resolve(__dirname, '../../packages/database/src'),
    },
  },
});
