import { test, expect } from '@playwright/test'

test.describe('About Page Smoke Test', () => {
  test('should load without HTTP error', async ({ page }) => {
    const response = await page.goto('/about', { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
  })
})
