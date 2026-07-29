import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  root: true,
  testDir: 'tests/e2e',
  timeout: 60000,
  singleWorker: true,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium-arm64',
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
  reporter: [['list']]
})
