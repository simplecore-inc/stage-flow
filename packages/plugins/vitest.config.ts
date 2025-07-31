import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  define: {
    'process.env.NODE_ENV': '"test"'
  }
});