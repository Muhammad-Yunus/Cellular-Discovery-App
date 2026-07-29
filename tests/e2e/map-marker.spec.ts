import { test, expect } from '@playwright/test'

test('signal marker uses lucide svg and popup open by default', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  // Create a scan via the API to ensure a marker appears
  const scanResp = await page.request.post('/api/scans', {
    data: {
      latitude: -6.2,
      longitude: 106.81,
      mcc: 510,
      mnc: 1,
      rat: 'LTE',
      operator: 'Telkomsel'
    }
  })
  console.log('Scan created:', scanResp.status())

  await page.waitForTimeout(3000)

  const info = await page.evaluate(() => {
    const marker = document.querySelector('.leaflet-signal-marker') as HTMLElement
    const badge = document.querySelector('.signal-marker-badge') as HTMLElement
    const svg = document.querySelector('.leaflet-signal-marker svg')
    const svgPaths = document.querySelectorAll('.leaflet-signal-marker:first-of-type svg path')
    const popup = document.querySelector('.leaflet-signal-popup') as HTMLElement
    const popupContent = document.querySelector('.leaflet-signal-popup .signal-popup')
    const popupHeader = document.querySelector('.leaflet-signal-popup .signal-popup-header')

    const popupVisible = popup ? getComputedStyle(popup).display !== 'none' && getComputedStyle(popup).visibility !== 'hidden' : false
    const popupOpacity = popup ? parseFloat(getComputedStyle(popup).opacity) : 0

    return {
      markerExists: !!marker,
      badgeExists: !!badge,
      svgExists: !!svg,
      svgPathCount: svgPaths.length,
      svgViewBox: svg?.getAttribute('viewBox'),
      popupExists: !!popup,
      popupVisible,
      popupOpacity,
      popupHeaderText: popupHeader?.textContent?.trim(),
      popupHasMCC: popupContent?.textContent?.includes('MCC'),
      popupHasMNC: popupContent?.textContent?.includes('MNC'),
      popupHasRAT: popupContent?.textContent?.includes('RAT'),
      badgeBg: badge ? getComputedStyle(badge).backgroundImage.substring(0, 80) : null
    }
  })

  console.log(JSON.stringify(info, null, 2))

  expect(info.markerExists).toBe(true)
  expect(info.svgExists).toBe(true)
  // lucide radio-tower has 2 <path> elements + 1 <circle>
  // Both marker SVG & navbar SVG must contain the same Lucide path data
  expect(info.svgPathCount).toBe(2)
  expect(info.popupExists).toBe(true)
  expect(info.popupVisible).toBe(true)
  expect(info.popupOpacity).toBeGreaterThan(0)
  expect(info.popupHasMCC).toBe(true)
  expect(info.popupHasMNC).toBe(true)
  expect(info.popupHasRAT).toBe(true)

  // Verify the navbar app-logo uses the same icon class (i-lucide:radio-tower)
  const navbarInfo = await page.evaluate(() => {
    const link = document.querySelector('header a[href="/"]') as HTMLElement
    const iconSpan = link?.querySelector('span')
    return {
      iconClass: iconSpan?.className
    }
  })
  console.log('Navbar icon class:', navbarInfo.iconClass)
  expect(navbarInfo.iconClass).toContain('i-lucide:radio-tower')

  // Verify time block has both absolute (formatted) and relative (human) format
  const timeInfo = await page.evaluate(() => {
    const abs = document.querySelector('.signal-popup-time-absolute') as HTMLElement
    const rel = document.querySelector('.signal-popup-time-relative') as HTMLElement
    return {
      absoluteText: abs?.textContent?.trim(),
      relativeText: rel?.textContent?.trim(),
      relativeDataIso: rel?.getAttribute('data-iso')
    }
  })
  console.log('Time block:', timeInfo)
  // Absolute should not be raw ISO; should contain spaces (e.g. "May 24, 2024, 14:32:08")
  expect(timeInfo.absoluteText).toBeTruthy()
  expect(timeInfo.absoluteText).not.toMatch(/^\d{4}-\d{2}-\d{2}T/)
  expect(timeInfo.absoluteText).toMatch(/[A-Za-z]{3}\s+\d{1,2}/)
  // Relative should be a friendly phrase
  expect(timeInfo.relativeText).toBeTruthy()
  expect(timeInfo.relativeText).toMatch(/(ago|just now|min|h|d|sec)/)
  expect(timeInfo.relativeDataIso).toMatch(/^\d{4}-\d{2}-\d{2}T/)

  await page.screenshot({ path: 'tests/e2e/__screenshots__/map-marker-popup.png' })
})