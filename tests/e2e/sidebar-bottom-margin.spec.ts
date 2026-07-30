import { test, expect } from '@playwright/test'

test('sidebar has 5% bottom margin', async ({ page }) => {
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
  const fivePercentHeight = dims.viewportHeight * 0.05
  console.log(`Distance from page bottom: ${distanceFromBottom}px, expected ~5% (${fivePercentHeight}px)`)

  expect(distanceFromBottom).toBeGreaterThan(fivePercentHeight - 5)
  expect(distanceFromBottom).toBeLessThan(fivePercentHeight + 5)

  await page.screenshot({ path: 'tests/e2e/__screenshots__/sidebar-bottom-margin.png', fullPage: false })
})