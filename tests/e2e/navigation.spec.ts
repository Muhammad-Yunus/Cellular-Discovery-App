import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('pages load without HTTP error', async ({ page }) => {
    const pages = ['/', '/about', '/health', '/history', '/settings']
    for (const path of pages) {
      const response = await page.goto(path, { waitUntil: 'networkidle' })
      expect(response.status()).toBe(200, `Failed on ${path}`)
    }
  })
})
