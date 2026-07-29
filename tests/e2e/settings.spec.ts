import { test, expect } from '@playwright/test'

test.describe('Settings Page Smoke Test', () => {
  test('should load without HTTP error', async ({ page }) => {
    const response = await page.goto('/settings', { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
  })
})
