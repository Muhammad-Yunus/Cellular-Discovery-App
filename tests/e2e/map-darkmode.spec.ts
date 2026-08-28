import { test, expect } from '@playwright/test'

test('map loads dark OSM tiles by default', async ({ page }) => {
  const tileRequests: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (url.includes('tile')) {
      tileRequests.push(url)
    }
  })

  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)

  console.log('Tile requests sample:')
  tileRequests.slice(0, 5).forEach(u => console.log('  ' + u))

  const osmTileHits = tileRequests.filter(u => u.includes('tile.openstreetmap.org'))
  console.log(`OSM tile requests: ${osmTileHits.length} of ${tileRequests.length} total`)

  expect(osmTileHits.length).toBeGreaterThan(0)
  expect(osmTileHits.length).toBe(tileRequests.length) // all tiles should be OSM

  await page.screenshot({ path: 'tests/e2e/__screenshots__/map-darkmode.png', fullPage: false })
})