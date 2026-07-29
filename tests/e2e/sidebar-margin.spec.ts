import { test, expect } from '@playwright/test'

test('sidebar bottom margin matches bottom panel', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)

  // Ensure both sidebar & bottom panel are visible
  const sidebar = page.locator('aside').first()
  const bottomPanel = page.locator('div').filter({ hasText: /Signal|GPS|System/ }).first()

  await expect(sidebar).toBeVisible()

  const info = await page.evaluate(() => {
    const sidebar = document.querySelector('aside') as HTMLElement
    // The bottom panel is the element with fixed bottom-4 and centered (left-1/2)
    const allFixed = Array.from(document.querySelectorAll<HTMLElement>('[class*="fixed"]'))
    const bottomPanel = allFixed.find(el => {
      const cls = el.className
      return cls.includes('bottom-4') && cls.includes('left-1/2') && cls.includes('-translate-x-1/2')
    })

    const viewport = window.innerHeight

    if (!sidebar || !bottomPanel) {
      return { error: 'sidebar or bottom panel not found', sidebar: !!sidebar, bottomPanel: !!bottomPanel }
    }

    const sRect = sidebar.getBoundingClientRect()
    const bRect = bottomPanel.getBoundingClientRect()

    const sidebarBottomGap = viewport - sRect.bottom
    const bottomPanelBottomGap = viewport - bRect.bottom

    return {
      viewportHeight: viewport,
      sidebar: {
        bottom: sRect.bottom,
        top: sRect.top,
        height: sRect.height,
        bottomGap: sidebarBottomGap
      },
      bottomPanel: {
        bottom: bRect.bottom,
        bottomGap: bottomPanelBottomGap
      },
      gapDifference: Math.abs(sidebarBottomGap - bottomPanelBottomGap),
      classNames: { sidebar: sidebar.className, bottomPanel: bottomPanel.className }
    }
  })

  console.log(JSON.stringify(info, null, 2))

  // The gap should be the same (both are bottom-4 = 16px)
  expect(info.gapDifference).toBeLessThanOrEqual(1)
})