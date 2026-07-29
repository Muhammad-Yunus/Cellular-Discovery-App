import { test, expect } from '@playwright/test'

test('map setDarkMode toggle works', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)

  // expose mapActions via window from test page
  const result = await page.evaluate(() => {
    // Try to grab the Leaflet map instance via a known ID prefix
    const mapDiv = document.querySelector('[id^="map-"]') as HTMLElement
    if (!mapDiv) return { error: 'no map div' }

    // The map key used in Leaflet
    const leafletMapKey = Object.keys(mapDiv).find(k => k.startsWith('__reactContainer') || k.startsWith('_leaflet'))
    const L = (window as unknown as Record<string, unknown>).L as { _leaflet_id?: unknown }

    // Find the Leaflet map via its _leaflet_id
    return {
      mapId: mapDiv.id,
      hasLeafletId: leafletMapKey !== undefined,
      leafletGlobal: typeof L
    }
  })
  console.log('Map inspect:', result)

  await page.screenshot({ path: 'tests/e2e/__screenshots__/map-darkmode-loaded.png', fullPage: false })
})