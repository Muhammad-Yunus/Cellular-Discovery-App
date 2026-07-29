import { test, expect } from '@playwright/test'

test('map loads dark carto tiles by default', async ({ page }) => {
  const tileRequests: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (url.includes('tile') || url.includes('cartocdn')) {
      tileRequests.push(url)
    }
  })

  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)

  console.log('Tile requests sample:')
  tileRequests.slice(0, 5).forEach(u => console.log('  ' + u))

  const darkTileHits = tileRequests.filter(u => u.includes('dark_all') || u.includes('basemaps.cartocdn'))
  console.log(`Dark tile requests: ${darkTileHits.length} of ${tileRequests.length} total`)

  expect(darkTileHits.length).toBeGreaterThan(0)
  expect(darkTileHits.length).toBe(tileRequests.length) // all tiles should be dark

  await page.screenshot({ path: 'tests/e2e/__screenshots__/map-darkmode.png', fullPage: false })
})