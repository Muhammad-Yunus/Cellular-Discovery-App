import { test, expect } from '@playwright/test'

test.describe('Sidebar', () => {
  test('sidebar page loads', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
  })
})
