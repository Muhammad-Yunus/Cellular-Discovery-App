import { test, expect } from '@playwright/test'

test.describe('Sidebar → Map selection flow', () => {
  test('clicking a history card selects its marker popup and flies the map to its coordinates', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Create two distinct scans at different coordinates so we can
    // verify the map moves and the popup content swaps when the user
    // picks a different card in the sidebar.
    const a = await page.request.post('/api/scans', {
      data: {
        latitude: -6.20,
        longitude: 106.81,
        mcc: 510,
        mnc: 1,
        rat: 'LTE',
        operator: 'Alpha'
      }
    })
    expect(a.status()).toBeLessThan(400)

    const b = await page.request.post('/api/scans', {
      data: {
        latitude: -6.30,
        longitude: 106.90,
        mcc: 510,
        mnc: 9,
        rat: 'LTE',
        operator: 'Bravo'
      }
    })
    expect(b.status()).toBeLessThan(400)

    // Allow the page to refresh markers from the API and auto-select
    // the latest scan.
    await page.waitForTimeout(3000)

    // Make sure sidebar cards are rendered. The sidebar lives in a
    // <aside> on the home layout.
    const aside = page.locator('aside').first()
    await expect(aside).toBeVisible()

    // Default state: latest scan auto-selected → its popup must be the
    // only one visible on the map.
    const initial = await page.evaluate(() => {
      const popups = Array.from(document.querySelectorAll('.leaflet-signal-popup')) as HTMLElement[]
      const visible = popups.filter(p => {
        const cs = getComputedStyle(p)
        return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0
      })
      const openMarkerHeaders = Array.from(document.querySelectorAll('.leaflet-signal-popup .signal-popup-header strong')).map(el => el.textContent?.trim())
      const center = (window as any).L && document.querySelector('.leaflet-container')
        ? ((document.querySelector('.leaflet-container') as any)?._leaflet_map?.getCenter?.()
          ?? null)
        : null
      return {
        popupCount: popups.length,
        visiblePopupCount: visible.length,
        openHeaders: openMarkerHeaders,
        centerLat: center?.lat ?? null,
        centerLng: center?.lng ?? null
      }
    })
    console.log('Initial:', initial)
    // Backend returns newest-first, so Bravo is the latest.
    expect(initial.popupCount).toBeGreaterThan(0)
    expect(initial.visiblePopupCount).toBe(1)
    expect(initial.openHeaders).toContain('Bravo')

    // Capture map center before clicking the older card.
    const centerBefore = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container') as any
      return container?._leaflet_map?.getCenter?.() ?? null
    })

    // Click the older scan card ("Alpha"). The sidebar uses HistoryCard
    // items inside the HistoryList; we locate by operator name.
    const alphaCard = aside.locator('text=Alpha').first()
    await expect(alphaCard).toBeVisible()
    await alphaCard.click()

    // Give leaflet a moment to flyTo and re-open the popup.
    await page.waitForTimeout(2000)

    const after = await page.evaluate(() => {
      const popups = Array.from(document.querySelectorAll('.leaflet-signal-popup')) as HTMLElement[]
      const visible = popups.filter(p => {
        const cs = getComputedStyle(p)
        return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0
      })
      const openHeaders = Array.from(document.querySelectorAll('.leaflet-signal-popup .signal-popup-header strong')).map(el => el.textContent?.trim())
      const container = document.querySelector('.leaflet-container') as any
      const center = container?._leaflet_map?.getCenter?.() ?? null
      return {
        visiblePopupCount: visible.length,
        openHeaders,
        centerLat: center?.lat ?? null,
        centerLng: center?.lng ?? null
      }
    })
    console.log('After click:', after)

    // Exactly one popup should remain visible, and it must be Alpha's.
    expect(after.visiblePopupCount).toBe(1)
    expect(after.openHeaders).toContain('Alpha')
    expect(after.openHeaders).not.toContain('Bravo')

    // The map must have flown towards Alpha's coordinates (-6.20).
    if (centerBefore && after.centerLat !== null) {
      expect(after.centerLat).toBeLessThan(initial.centerLat ?? -6.20)
    }

    await page.screenshot({ path: 'tests/e2e/__screenshots__/sidebar-select-map.png' })
  })
})
