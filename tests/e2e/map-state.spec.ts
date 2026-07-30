import { test } from '@playwright/test'

test('capture map state visual', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)

  const state = await page.evaluate(() => {
    const container = document.querySelector('.leaflet-container') as HTMLElement
    const tilePane = document.querySelector('.leaflet-tile-pane') as HTMLElement
    const tileLayer = document.querySelector('.leaflet-layer') as HTMLElement
    const mapPane = document.querySelector('.leaflet-map-pane') as HTMLElement

    const visibleTiles = document.querySelectorAll<HTMLImageElement>('.leaflet-tile-loaded')
    const sampleTile = visibleTiles[0]

    return {
      containerSize: { w: container.offsetWidth, h: container.offsetHeight },
      containerStyle: container.style.cssText,
      containerComputed: {
        background: getComputedStyle(container).backgroundColor,
        position: getComputedStyle(container).position,
        overflow: getComputedStyle(container).overflow
      },
      tilePaneSize: { w: tilePane.offsetWidth, h: tilePane.offsetHeight, sw: tilePane.scrollWidth, sh: tilePane.scrollHeight },
      mapPanePosition: mapPane?.style.cssText,
      tileLayerSize: { w: tileLayer.offsetWidth, h: tileLayer.offsetHeight },
      visibleTileCount: visibleTiles.length,
      sampleTilePosition: sampleTile ? sampleTile.style.cssText : null,
      sampleTileRect: sampleTile ? sampleTile.getBoundingClientRect() : null,
      controlPresent: document.querySelector('.leaflet-control-zoom') !== null,
      attributionPresent: document.querySelector('.leaflet-control-attribution') !== null
    }
  })
  console.log('Map state:', JSON.stringify(state, null, 2))
})