/// <reference types="node" />
import { defineConfig } from '@playwright/test'

// Pruebas E2E en navegador real (npm run test:e2e).
// Si ya tienes `npm run dev` corriendo, se reutiliza; si no, Playwright lo levanta.
const URL_BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: URL_BASE,
    // Usa el Google Chrome instalado en la máquina (no descarga navegadores).
    channel: 'chrome',
    locale: 'es-CR',
    timezoneId: 'America/Costa_Rica',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: `${URL_BASE}/login`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
