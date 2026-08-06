import { test, expect } from '@playwright/test'

test('sidebar has bottom margin matching bottom panel', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const sidebar = page.locator('aside').first()
  if (!(await sidebar.isVisible())) {
    await page.waitForTimeout(500)
  }

  const dims = await sidebar.evaluate(el => {
    const rect = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      viewportHeight: window.innerHeight,
      cssTop: cs.top,
      cssBottom: cs.bottom,
      maxHeight: cs.maxHeight
    }
  })
  console.log('Sidebar dims:', dims)

  const distanceFromBottom = dims.viewportHeight - dims.bottom
  // The sidebar uses bottom-4 (16px), same as the bottom panel
  expect(distanceFromBottom).toBeGreaterThan(10)
  expect(distanceFromBottom).toBeLessThan(20)

  await page.screenshot({ path: 'tests/e2e/__screenshots__/sidebar-bottom-margin.png', fullPage: false })
})