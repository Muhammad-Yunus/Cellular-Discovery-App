import { test, expect } from '@playwright/test'

test.describe('About Page - /about', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/about')
    expect(await page.url()).toContain('/about')
    expect(await page.locator('main').count()).toBeGreaterThan(0)
  })
})
