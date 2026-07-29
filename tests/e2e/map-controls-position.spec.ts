import { test, expect } from '@playwright/test'

test('map zoom controls positioned top-right', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)

  const info = await page.evaluate(() => {
    const zoomControl = document.querySelector('.leaflet-control-zoom') as HTMLElement
    const container = document.querySelector('.leaflet-container') as HTMLElement
    const topRight = document.querySelector('.leaflet-top.leaflet-right') as HTMLElement
    const bottomLeft = document.querySelector('.leaflet-bottom.leaflet-left') as HTMLElement
    const topLeft = document.querySelector('.leaflet-top.leaflet-left') as HTMLElement
    const zoomInTopLeft = topLeft?.querySelector('.leaflet-control-zoom') !== null && topLeft?.querySelector('.leaflet-control-zoom') !== undefined

    const cRect = container?.getBoundingClientRect()
    const zRect = zoomControl?.getBoundingClientRect()
    const trRect = topRight?.getBoundingClientRect()
    const tlRect = topLeft?.getBoundingClientRect()

    return {
      containerRight: cRect?.right,
      containerTop: cRect?.top,
      zoomControl: zRect ? { x: zRect.x, y: zRect.y, right: zRect.right } : null,
      topRight: trRect ? { x: trRect.x, y: trRect.y, right: trRect.right } : null,
      topLeftPresent: !!topLeft,
      bottomLeftPresent: !!bottomLeft,
      zoomInTopLeft,
      zoomControlClass: zoomControl?.parentElement?.className,
      // Is zoom control near right edge?
      isOnRightSide: zRect && cRect ? (zRect.right > cRect.left + cRect.width / 2) : false,
      isOnTopSide: zRect && cRect ? (zRect.y < cRect.top + 100) : false
    }
  })
  console.log(JSON.stringify(info, null, 2))

  expect(info.zoomControl).not.toBeNull()
  expect(info.isOnRightSide).toBe(true)
  expect(info.isOnTopSide).toBe(true)
  expect(info.topRight).not.toBeNull()
  expect(info.zoomControlClass).toBe('leaflet-top leaflet-right')
  // Verify no zoom control sits inside the top-left corner container
  expect(info.zoomInTopLeft).toBe(false)
})