import { test, expect } from '@playwright/test'

test.describe('Settings Page - /settings', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/settings')
    expect(await page.url()).toContain('/settings')
    expect(await page.locator('form').count()).toBeGreaterThanOrEqual(1)
  })
})
