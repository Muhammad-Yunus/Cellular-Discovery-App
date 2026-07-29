import { test, expect } from '@playwright/test'

const pages = ['/about', '/history', '/health', '/settings', '/scanning']

test.describe('Sidebar & Bottom Panel visibility', () => {
  test('sidebar and bottom panel ONLY render on home page', async ({ page }) => {
    for (const path of pages) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      // Wait for hydration
      await page.waitForTimeout(1500)

      // Sidebar (aside) should NOT exist on non-home pages
      const asideCount = await page.locator('aside').count()
      expect(asideCount, `aside should not render on ${path}`).toBe(0)

      // Bottom panel uses fixed positioning with translate-x transform
      const bottomPanelCount = await page.locator('[class*="bottom-4"][class*="translate-x"]').count()
      expect(bottomPanelCount, `bottom panel should not render on ${path}`).toBe(0)

      console.log(`✓ ${path} — no sidebar, no bottom panel`)
    }
  })

  test('sidebar and bottom panel DO render on home page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)

    const sidebar = page.locator('aside').first()
    await expect(sidebar, 'sidebar should be visible on home').toBeVisible({ timeout: 10000 })

    const bottomPanel = page.locator('[class*="bottom-4"][class*="translate-x"]').first()
    await expect(bottomPanel, 'bottom panel should be visible on home').toBeVisible({ timeout: 10000 })

    console.log('✓ / — sidebar and bottom panel both visible')
  })
})