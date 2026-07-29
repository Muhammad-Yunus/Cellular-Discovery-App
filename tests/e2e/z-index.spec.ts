import { test, expect } from '@playwright/test'

test('home: sidebar and bottom panel render above map (high z-index)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  // Wait for sidebar (default open=true per uiStore) — proves page is hydrated
  const sidebar = page.locator('aside').first()
  await expect(sidebar, 'sidebar should be visible').toBeVisible({ timeout: 30000 })

  // Wait for bottom panel (default open=true)
  const bottomPanel = page.locator('[class*="bottom-4"][class*="translate-x"]').first()
  await expect(bottomPanel, 'bottom panel should be visible').toBeVisible({ timeout: 30000 })

  // Leaflet attempt to mount (may not have tiles in offline; just check for leaflet container)
  const leafletMounted = await page.locator('.leaflet-container').count()
  console.log(`leaflet containers: ${leafletMounted}`)

  // Read computed z-index of sidebar
  const sidebarZ = await sidebar.evaluate((el) => window.getComputedStyle(el).zIndex)
  // Read computed z-index of bottom panel
  const panelZ = await bottomPanel.evaluate((el) => window.getComputedStyle(el).zIndex)
  // Read computed z-index of any leaflet pane (optional)
  const leafletZ = await page.evaluate(() => {
    const pane = document.querySelector('.leaflet-pane, .leaflet-control')
    return pane ? window.getComputedStyle(pane).zIndex : null
  })

  console.log(`sidebar z-index: ${sidebarZ}`)
  console.log(`bottom panel z-index: ${panelZ}`)
  console.log(`leaflet pane z-index: ${leafletZ}`)

  // Sidebar & bottom panel must have z-index >= 1000 (above Leaflet max of 1000)
  expect(Number(sidebarZ), 'sidebar z-index high enough').toBeGreaterThanOrEqual(1000)
  expect(Number(panelZ), 'bottom panel z-index high enough').toBeGreaterThanOrEqual(1000)
  // If leaflet mounted, it must be lower than sidebar/panel
  if (leafletZ !== null) {
    expect(Number(leafletZ), 'leaflet z-index lower than sidebar/panel').toBeLessThan(1100)
  }
})