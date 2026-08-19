import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-native': path.resolve(__dirname, './src/__tests__/__mocks__/react-native.ts'),
    },
  },
});
