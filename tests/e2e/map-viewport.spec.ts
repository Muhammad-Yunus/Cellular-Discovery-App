import { test } from '@playwright/test'

test('map viewport and pane sizing', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  const info = await page.evaluate(() => {
    const container = document.querySelector('.leaflet-container') as HTMLElement
    const mapPane = document.querySelector('.leaflet-map-pane') as HTMLElement
    const tilePane = document.querySelector('.leaflet-tile-pane') as HTMLElement
    const tileLayer = document.querySelector('.leaflet-layer') as HTMLElement
    const overlayPane = document.querySelector('.leaflet-overlay-pane') as HTMLElement
    const markerPane = document.querySelector('.leaflet-marker-pane') as HTMLElement

    // Sample first loaded tile's rect
    const tiles = document.querySelectorAll<HTMLImageElement>('.leaflet-tile-loaded')
    const sample = tiles[0]
    const sampleRect = sample?.getBoundingClientRect()
    const containerRect = container?.getBoundingClientRect()

    return {
      containerRect: containerRect ? { x: containerRect.x, y: containerRect.y, w: containerRect.width, h: containerRect.height } : null,
      containerOverflow: getComputedStyle(container).overflow,
      containerBackground: getComputedStyle(container).backgroundColor,
      panes: {
        mapPane: { ow: mapPane.offsetWidth, oh: mapPane.offsetHeight, rect: mapPane.getBoundingClientRect() },
        tilePane: { ow: tilePane.offsetWidth, oh: tilePane.offsetHeight, sw: tilePane.scrollWidth, sh: tilePane.scrollHeight },
        tileLayer: { ow: tileLayer.offsetWidth, oh: tileLayer.offsetHeight, rect: tileLayer.getBoundingClientRect() },
        overlayPane: overlayPane ? { ow: overlayPane.offsetWidth, oh: overlayPane.offsetHeight } : null,
        markerPane: markerPane ? { ow: markerPane.offsetWidth, oh: markerPane.offsetHeight } : null
      },
      tileCount: tiles.length,
      sampleTileRect: sampleRect ? { x: sampleRect.x, y: sampleRect.y, w: sampleRect.width, h: sampleRect.height } : null,
      // Check if tile is within visible area
      tileInViewport: sampleRect && containerRect
        ? !(sampleRect.right < containerRect.left || sampleRect.left > containerRect.right ||
           sampleRect.bottom < containerRect.top || sampleRect.top > containerRect.bottom)
        : false
    }
  })
  console.log(JSON.stringify(info, null, 2))
})