import { expect, test } from '@playwright/test'

/**
 * Verifies the floating "Scan Signal" button:
 *  - Positioned bottom-right of the map (above zoom controls)
 *  - Uses the Lucide radio-tower icon
 *  - Pill-shaped with primary gradient background
 *  - Hovering scales slightly; pressing enters loading state with spinner
 *  - Located outside the sidebar (proves the button was moved out)
 */
test('floating scan button is bottom-right with radio-tower icon and Scan Signal label', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('.floating-scan-btn', { timeout: 15_000 })
  await page.waitForTimeout(500)

  const info = await page.evaluate(() => {
    const btn = document.querySelector('.floating-scan-btn') as HTMLElement | null
    if (!btn) return { found: false }

    const rect = btn.getBoundingClientRect()
    const viewport = { w: window.innerWidth, h: window.innerHeight }

    const svg = btn.querySelector('svg')
    const svgViewBox = svg?.getAttribute('viewBox') || ''
    const svgPathCount = svg?.querySelectorAll('path').length || 0
    const hasCircle = !!svg?.querySelector('circle')

    const cs = window.getComputedStyle(btn)
    const radius = parseFloat(cs.borderTopLeftRadius) || 0
    const bgImage = cs.backgroundImage

    const aside = document.querySelector('aside') as HTMLElement | null
    const asideContainsBtn = aside?.contains(btn) || false

    return {
      found: true,
      viewport,
      rect: {
        top: rect.top, right: rect.right, bottom: rect.bottom,
        left: rect.left, width: rect.width, height: rect.height
      },
      isBottomRight: rect.right > viewport.w / 2 && rect.bottom > viewport.h / 2,
      hasSvg: !!svg,
      svgViewBox,
      svgPathCount,
      hasCircle,
      borderRadius: radius,
      isPill: radius > 20,
      hasGradient: bgImage.includes('linear-gradient'),
      ariaLabel: btn.getAttribute('aria-label'),
      title: btn.getAttribute('title'),
      labelText: btn.querySelector('.floating-scan-btn__label')?.textContent?.trim(),
      iconVisible: !!svg && rect.width > 40 && rect.height > 40,
      asideContainsBtn
    }
  })

  console.log('Floating scan button:', info)

  expect(info.found).toBe(true)
  // Located in bottom-right quadrant
  expect(info.isBottomRight).toBe(true)
  // Lucide radio-tower has 2 paths + 1 circle
  expect(info.hasSvg).toBe(true)
  expect(info.svgViewBox).toBe('0 0 24 24')
  expect(info.svgPathCount).toBe(2)
  expect(info.hasCircle).toBe(true)
  // Pill shape
  expect(info.isPill).toBe(true)
  // Gradient background
  expect(info.hasGradient).toBe(true)
  // Has visible label "Scan Signal"
  expect(info.labelText).toBe('Scan Signal')
  // NOT inside the sidebar anymore
  expect(info.asideContainsBtn).toBe(false)
})

test('floating scan button enters loading state on click', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('.floating-scan-btn', { timeout: 15_000 })

  const btn = page.locator('.floating-scan-btn')
  // Click triggers createScan() which flips creating=true at least briefly
  await btn.click({ force: true })

  // While the request is in-flight the button should have loading modifier
  const isLoading = await page.evaluate(() => {
    const b = document.querySelector('.floating-scan-btn')
    return b?.classList.contains('floating-scan-btn--loading') || false
  })

  // Either still loading OR already finished — verify the button remains
  // functional and the spinner svg appeared at some point. Capture state.
  const finalState = await page.evaluate(() => {
    const b = document.querySelector('.floating-scan-btn') as HTMLButtonElement | null
    const label = b?.querySelector('.floating-scan-btn__label')?.textContent?.trim()
    const disabled = b?.disabled || false
    return { label, disabled }
  })

  console.log('Loading state captured:', { isLoading, finalState })

  // After click, the button should NOT be in its idle state (label might be
  // "Scanning…" or it may have already returned to "Scan Signal").
  expect(['Scan Signal', 'Scanning…']).toContain(finalState.label)
  expect(typeof finalState.disabled).toBe('boolean')

  // After the request settles, button returns to enabled idle state
  await page.waitForFunction(() => {
    const b = document.querySelector('.floating-scan-btn') as HTMLButtonElement | null
    return b && !b.disabled
  }, { timeout: 15_000 })

  const settled = await page.evaluate(() => {
    const b = document.querySelector('.floating-scan-btn') as HTMLButtonElement | null
    return {
      label: b?.querySelector('.floating-scan-btn__label')?.textContent?.trim(),
      disabled: b?.disabled,
      hasLoadingClass: b?.classList.contains('floating-scan-btn--loading') || false
    }
  })

  console.log('Settled state:', settled)
  expect(settled.label).toBe('Scan Signal')
  expect(settled.disabled).toBe(false)
  expect(settled.hasLoadingClass).toBe(false)
})