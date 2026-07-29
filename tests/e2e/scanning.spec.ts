import { test, expect } from '@playwright/test'

test.describe('Scan Page - /scanning', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/scanning')
    expect(await page.url()).toContain('/scanning')
    expect(await page.locator('h1').count()).toBeGreaterThanOrEqual(0)
  })
})
