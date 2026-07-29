import { test, expect } from '@playwright/test'

test.describe('Home Page - /', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/')
    // Just verify navigation works without crashing
    expect(await page.url()).toContain('localhost:3000')
    expect(await page.locator('main').count()).toBeGreaterThan(0)
  })
})
