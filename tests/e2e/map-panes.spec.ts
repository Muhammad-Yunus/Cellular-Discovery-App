import { test } from '@playwright/test'

test('inspect leaflet panes deeply', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)

  const layout = await page.evaluate(() => {
    const mapPanes = document.querySelectorAll('.leaflet-map-pane')
    const tilePanes = document.querySelectorAll('.leaflet-tile-pane')
    const tileLayers = document.querySelectorAll('.leaflet-layer')
    const tileImages = document.querySelectorAll('.leaflet-tile')

    const dump = (els: NodeListOf<Element>) => Array.from(els).map((el, i) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        i,
        tag: el.tagName,
        cls: el.className,
        width: r.width,
        height: r.height,
        offsetWidth: (el as HTMLElement).offsetWidth,
        offsetHeight: (el as HTMLElement).offsetHeight,
        scrollWidth: (el as HTMLElement).scrollWidth,
        scrollHeight: (el as HTMLElement).scrollHeight,
        transform: cs.transform,
        position: cs.position,
        inlineStyle: ((el as HTMLElement).style.cssText || '').substring(0, 200)
      }
    })

    return {
      mapPanes: dump(mapPanes),
      tilePanes: dump(tilePanes),
      tileLayers: dump(tileLayers),
      tileImagesCount: tileImages.length,
      tileImagesSample: Array.from(tileImages).slice(0, 5).map(img => {
        const ii = img as HTMLImageElement
        return {
          src: ii.src.substring(0, 80),
          offsetWidth: ii.offsetWidth,
          offsetHeight: ii.offsetHeight,
          naturalWidth: ii.naturalWidth,
          naturalHeight: ii.naturalHeight,
          style: ii.style.cssText.substring(0, 200)
        }
      })
    }
  })
  console.log(JSON.stringify(layout, null, 2))
})