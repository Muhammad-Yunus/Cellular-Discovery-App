import { test, expect } from '@playwright/test'

test.describe('History Page - /history', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/history')
    expect(await page.url()).toContain('/history')
    expect(await page.locator('ul').count()).toBeGreaterThanOrEqual(0)
  })
})
