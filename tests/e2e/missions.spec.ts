import { test, expect } from '@playwright/test'

test.describe('Missions List Page', () => {
  test('should load the missions page without HTTP error', async ({ page }) => {
    const response = await page.goto('/missions', { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
  })

  test('should render the missions page with title', async ({ page }) => {
    await page.goto('/missions')
    await page.waitForLoadState('networkidle')

    // Should have a Mission Planner heading
    const heading = page.locator('h1', { hasText: /mission planner/i })
    await expect(heading).toBeVisible()
  })

  test('should render the missions page with content area', async ({ page }) => {
    await page.goto('/missions')
    await page.waitForLoadState('networkidle')

    // Should have some content in the main area
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })

  test('should have search functionality', async ({ page }) => {
    await page.goto('/missions')
    await page.waitForLoadState('networkidle')

    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
  })

  test('should have status filter', async ({ page }) => {
    await page.goto('/missions')
    await page.waitForLoadState('networkidle')

    const statusFilter = page.locator('button[role="combobox"]')
    await expect(statusFilter).toBeVisible()
  })

  test('should have New Mission button', async ({ page }) => {
    await page.goto('/missions')
    await page.waitForLoadState('networkidle')

    const newMissionBtn = page.locator('button', { hasText: /New Mission/i })
    await expect(newMissionBtn).toBeVisible()
  })
})
