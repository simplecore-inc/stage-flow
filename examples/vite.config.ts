import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@stage-flow/core': path.resolve(__dirname, '../packages/core/src'),
      '@stage-flow/react': path.resolve(__dirname, '../packages/react/src'),
      '@stage-flow/plugins': path.resolve(__dirname, '../packages/plugins/src'),
      '@stage-flow/testing': path.resolve(__dirname, '../packages/testing/src'),
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});