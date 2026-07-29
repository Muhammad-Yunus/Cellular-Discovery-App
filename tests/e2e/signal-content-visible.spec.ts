import { test, expect } from '@playwright/test'

test('signal panel content visible by default', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  // Find bottom panel
  const panel = page.locator('[class*="bottom-4"]').first()
  await expect(panel).toBeVisible()

  // Look for SignalPanel content via text
  const noScanText = page.locator('text="No scan selected"')
  console.log('"No scan selected" count:', await noScanText.count())

  // Inspect TabsContent for "signal" — should be data-state=active
  const tabsContents = await page.evaluate(() => {
    const contents = document.querySelectorAll('[data-slot="content"], [role="tabpanel"]')
    return Array.from(contents).map(c => ({
      tag: c.tagName,
      state: c.getAttribute('data-state'),
      hidden: c.hasAttribute('hidden'),
      style: c.getAttribute('style'),
      textSample: c.textContent?.trim().substring(0, 80),
      outerHTMLStart: c.outerHTML.substring(0, 200)
    }))
  })
  console.log('Tab panels:', JSON.stringify(tabsContents, null, 2))

  // Check signal tab panel explicit
  const signalPanel = await page.evaluate(() => {
    // Find by id reka-tabs content 0
    const c0 = document.querySelector('#reka-tabs-v-0-0-content-0') as HTMLElement
    if (!c0) return { found: false }
    return {
      found: true,
      dataState: c0.getAttribute('data-state'),
      hidden: c0.hasAttribute('hidden'),
      html: c0.outerHTML.substring(0, 300)
    }
  })
  console.log('Signal tabpanel:', JSON.stringify(signalPanel, null, 2))

  await page.screenshot({ path: 'tests/e2e/__screenshots__/signal-content-visible.png', fullPage: false })
})