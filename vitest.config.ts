import { defineConfig } from 'vitest/config'

// Pruebas unitarias (npm test). Las de integración usan vitest.integration.config.ts.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.ts'],
  },
  resolve: {
    alias: {
      '~': import.meta.dirname,
      '@': import.meta.dirname,
    },
  },
})
