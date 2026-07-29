import { test, expect } from '@playwright/test'

test.describe('Health Page - /health', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/health')
    expect(await page.url()).toContain('/health')
    expect(await page.locator('div').count()).toBeGreaterThan(0)
  })
})
