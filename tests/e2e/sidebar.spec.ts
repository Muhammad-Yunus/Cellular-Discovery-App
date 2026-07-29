import { test, expect } from '@playwright/test'

test.describe('Sidebar Components', () => {
  test('sidebar navigation accessible', async ({ page }) => {
    await page.goto('/')
    expect(await page.locator('nav').count()).toBeGreaterThan(0)
  })
})
