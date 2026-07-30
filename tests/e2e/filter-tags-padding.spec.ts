import { test, expect } from '@playwright/test'

test('filter tags have horizontal padding', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Open sidebar if not open
  const sidebar = page.locator('aside')
  if (!(await sidebar.first().isVisible())) {
    await page.waitForTimeout(500)
  }

  // Find the filter tag buttons (size 2xs in filter panel) - they have labels ALL/All/LTE/NR/GSM/UMTS/CDMA
  const tags = page.locator('aside button:has-text("LTE"), aside button:has-text("NR"), aside button:has-text("GSM"), aside button:has-text("UMTS"), aside button:has-text("CDMA"), aside button:has-text("All")')
  const count = await tags.count()
  console.log('Found filter tags:', count)

  for (let i = 0; i < count; i++) {
    const tag = tags.nth(i)
    const text = (await tag.textContent())?.trim()
    const padding = await tag.evaluate(el => {
      const cs = getComputedStyle(el)
      return {
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        width: cs.width
      }
    })
    console.log(`Tag "${text}":`, padding)
  }

  await page.screenshot({ path: 'tests/e2e/__screenshots__/filter-tags-padding.png', clip: { x: 0, y: 0, width: 320, height: 300 } })
})