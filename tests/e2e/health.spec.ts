import { test, expect } from '@playwright/test'

test.describe('Health Page Smoke Test', () => {
  test('should load without HTTP error', async ({ page }) => {
    const response = await page.goto('/health', { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
  })
})
