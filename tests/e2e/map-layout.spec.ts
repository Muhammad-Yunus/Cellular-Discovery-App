import { test } from '@playwright/test'

test('inspect leaflet layout', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)

  const layout = await page.evaluate(() => {
    const mapDiv = document.querySelector('[id^="map-"]') as HTMLElement
    const mapContainer = mapDiv?.parentElement
    const leafletPane = document.querySelector('.leaflet-pane.map-pane') as HTMLElement
    const tilePane = document.querySelector('.leaflet-tile-pane') as HTMLElement
    const tileContainer = document.querySelector('.leaflet-layer .leaflet-tile-container') as HTMLElement
    const leafletMap = document.querySelector('.leaflet-container') as HTMLElement

    const getRect = (el: Element | null) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        width: r.width,
        height: r.height,
        x: r.x,
        y: r.y,
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        zIndex: cs.zIndex,
        position: cs.position,
        overflow: cs.overflow,
        background: cs.background.substring(0, 80)
      }
    }

    return {
      mapDiv: getRect(mapDiv),
      mapContainer: getRect(mapContainer),
      leafletContainer: getRect(leafletMap),
      mapPane: getRect(leafletPane),
      tilePane: getRect(tilePane),
      tileContainer: getRect(tileContainer),
      leafletContainerHTML: leafletMap?.outerHTML?.substring(0, 400)
    }
  })
  console.log(JSON.stringify(layout, null, 2))

  // Take a screenshot of just the map area
  const mapEl = page.locator('.leaflet-container').first()
  if (await mapEl.count() > 0) {
    await mapEl.screenshot({ path: 'tests/e2e/__screenshots__/map-only-area.png' })
  }
})