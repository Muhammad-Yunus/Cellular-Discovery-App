import { test, expect } from '@playwright/test'

test.describe('Bottom Panel', () => {
  test('bottom panel page loads', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
  })
})
