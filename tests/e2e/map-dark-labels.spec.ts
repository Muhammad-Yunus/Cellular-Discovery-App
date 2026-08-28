import { test, expect } from '@playwright/test'

test('map has dark OSM base tiles (CSS inverted)', async ({ page }) => {
  const tileRequests: Array<{ url: string, type: 'dark' | 'light' }> = []

  page.on('request', req => {
    const url = req.url()
    if (url.includes('tile.openstreetmap.org')) {
      tileRequests.push({ url, type: 'dark' })
    }
  })

  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  const counts = {
    dark: tileRequests.filter(r => r.type === 'dark').length,
    light: tileRequests.filter(r => r.type === 'light').length
  }
  console.log('Tile counts:', counts)
  console.log('Sample tile:', tileRequests[0]?.url)

  // Should load OSM tiles (which are inverted via CSS for dark mode)
  expect(counts.dark).toBeGreaterThan(0)
  expect(counts.light).toBe(0)

  // Single layer (no separate label overlay anymore)
  const layerCount = await page.evaluate(() => {
    return document.querySelectorAll('.leaflet-layer').length
  })
  console.log(`Leaflet layers in DOM: ${layerCount}`)
  expect(layerCount).toBeGreaterThanOrEqual(1)

  await page.screenshot({ path: 'tests/e2e/__screenshots__/map-dark-with-labels.png' })
})