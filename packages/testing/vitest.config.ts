import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true
  },
  resolve: {
    alias: {
      '@stage-flow/core': path.resolve(__dirname, '../core/src'),
      '@stage-flow/react': path.resolve(__dirname, '../react/src')
    }
  }
});