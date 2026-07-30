import { test, expect } from '@playwright/test'

test('map dark background applied', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)

  const bg = await page.evaluate(() => {
    const container = document.querySelector('.leaflet-container') as HTMLElement
    return getComputedStyle(container).backgroundColor
  })
  console.log('Container background:', bg)
  expect(bg).toBe('rgb(10, 10, 10)')

  await page.screenshot({ path: 'tests/e2e/__screenshots__/map-dark-final.png' })
})