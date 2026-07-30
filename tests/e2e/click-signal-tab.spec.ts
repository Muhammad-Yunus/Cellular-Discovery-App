import { test, expect } from '@playwright/test'

test('click signal tab to reveal content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  // Click Signal tab
  const signalTab = page.locator('role=tab[name="Signal"]')
  await signalTab.click()
  await page.waitForTimeout(800)

  const signalPanelContent = await page.evaluate(() => {
    const c = document.querySelector('#reka-tabs-v-0-0-content-signal') as HTMLElement
    if (!c) return { found: false }
    return {
      found: true,
      dataState: c.getAttribute('data-state'),
      hidden: c.hidden,
      innerHTML: c.innerHTML.substring(0, 500),
      textContent: c.textContent?.trim().substring(0, 100)
    }
  })
  console.log('Signal panel content:', JSON.stringify(signalPanelContent, null, 2))

  await page.screenshot({ path: 'tests/e2e/__screenshots__/after-click-signal.png', fullPage: false })
})