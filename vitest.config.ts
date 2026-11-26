import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
      'tests/quality/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx', 'api/**/*.ts'],
      exclude: ['src/main.tsx', 'src/offline/sw.ts', 'src/**/*.d.ts', 'src/store/types.ts'],
      thresholds: {
        statements: 90,
        branches: 82,
        functions: 88,
        lines: 90,
      },
    },
  },
});
