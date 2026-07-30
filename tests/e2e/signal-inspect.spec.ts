import { test, expect } from '@playwright/test'

test('inspect signal tabpanel', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  const info = await page.evaluate(() => {
    const signalContent = document.querySelector('#reka-tabs-v-0-0-content-signal') as HTMLElement
    const gpsContent = document.querySelector('#reka-tabs-v-0-0-content-gps') as HTMLElement
    return {
      signalHTML: signalContent?.outerHTML?.substring(0, 800),
      signalInnerLength: signalContent?.innerHTML?.length,
      gpsInnerLength: gpsContent?.innerHTML?.length
    }
  })
  console.log(JSON.stringify(info, null, 2))

  await page.screenshot({ path: 'tests/e2e/__screenshots__/signal-detail.png', fullPage: false })
})