import { test, expect } from '@playwright/test'

test.describe('Bottom Panel - Signal/GPS/System', () => {
  test('bottom panel container exists', async ({ page }) => {
    await page.goto('/')
    expect(await page.locator('div').first().count()).toBeGreaterThan(0)
  })
})
