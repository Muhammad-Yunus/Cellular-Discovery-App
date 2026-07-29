import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  root: import.meta.cwd,
  testDir: 'tests/e2e',
  timeout: 60000,
  failFast: true,
  reuseContext: true,
  singleWorker: true, // Single worker for ARM64 stability
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium-headless-arm64',
      use: {
        ...devices['Desktop 1920x1080'],
        headless: true,
        launch: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ],
          timeout: 30000
        }
      }
    }
  ],
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    stdout: 'pipe',
    stderr: 'pipe',
    spawn: true,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    readyWithin: 30000
  },
  reporter: [['list'], ['html', { open: 'never' }]]
})
