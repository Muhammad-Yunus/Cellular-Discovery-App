import { test, expect } from '@playwright/test'

test('bottom panel default shows signal tab', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Check bottom panel is visible
  const panel = page.locator('[class*="bottom-4"]').first()
  const isPanelVisible = await panel.isVisible()
  console.log('Bottom panel visible:', isPanelVisible)

  // Find tabs
  const tabs = page.locator('[role="tab"]')
  const tabCount = await tabs.count()
  console.log('Tab count:', tabCount)

  for (let i = 0; i < tabCount; i++) {
    const tab = tabs.nth(i)
    const text = await tab.textContent()
    const isSelected = await tab.getAttribute('aria-selected')
    const isActive = await tab.evaluate(el => el.classList.contains('active') || el.getAttribute('data-state') === 'active')
    console.log(`Tab "${text?.trim()}": aria-selected=${isSelected}, active=${isActive}`)
  }

  // Check signal panel content
  const signalContent = page.locator('text="No scan selected", text="Select a scan from the sidebar"')
  console.log('Signal content visible:', await signalContent.first().isVisible())

  await page.screenshot({ path: 'tests/e2e/__screenshots__/bottom-panel-default.png', fullPage: false })
})