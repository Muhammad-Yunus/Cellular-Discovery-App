import { test, expect } from '@playwright/test'

test.describe('Home Page Smoke Test', () => {
  test('should load without HTTP error', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
  })
})
