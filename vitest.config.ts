import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '~': path.resolve(rootDir, './app'),
      '@': path.resolve(rootDir, './app'),
      '~~': path.resolve(rootDir, './'),
      '@@': path.resolve(rootDir, './'),
      '#server': path.resolve(rootDir, './server'),
    },
  },
})
