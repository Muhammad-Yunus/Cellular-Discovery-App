import { test, expect } from '@playwright/test'

test.describe('Scanning', () => {
  test('scan page loads', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
  })
})
