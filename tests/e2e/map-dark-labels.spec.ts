import { test, expect } from '@playwright/test'

test('map has dark base + label overlay', async ({ page }) => {
  const tileRequests: Array<{ url: string, type: 'base' | 'label' | 'light' }> = []

  page.on('request', req => {
    const url = req.url()
    if (url.includes('dark_nolabels')) tileRequests.push({ url, type: 'base' })
    else if (url.includes('dark_only_labels')) tileRequests.push({ url, type: 'label' })
    else if (url.includes('tile.openstreetmap.org')) tileRequests.push({ url, type: 'light' })
  })

  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  const counts = {
    base: tileRequests.filter(r => r.type === 'base').length,
    label: tileRequests.filter(r => r.type === 'label').length,
    light: tileRequests.filter(r => r.type === 'light').length
  }
  console.log('Tile counts:', counts)
  console.log('Sample base:', tileRequests.find(r => r.type === 'base')?.url)
  console.log('Sample label:', tileRequests.find(r => r.type === 'label')?.url)

  // Both base and labels should be loaded
  expect(counts.base).toBeGreaterThan(0)
  expect(counts.label).toBeGreaterThan(0)
  expect(counts.light).toBe(0)

  // Layer count check
  const layerCount = await page.evaluate(() => {
    return document.querySelectorAll('.leaflet-layer').length
  })
  console.log(`Leaflet layers in DOM: ${layerCount}`)
  expect(layerCount).toBeGreaterThanOrEqual(2)

  await page.screenshot({ path: 'tests/e2e/__screenshots__/map-dark-with-labels.png' })
})