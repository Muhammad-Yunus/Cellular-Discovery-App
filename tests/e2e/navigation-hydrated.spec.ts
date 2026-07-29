import { test, expect } from '@playwright/test'

test.describe('Navigation (with 3s hydration delay)', () => {
  test('pages load without HTTP error after hydration', async ({ page }) => {
    const pages = ['/', '/about', '/health', '/history', '/settings']
    const errors: string[] = []
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
    page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })

    for (const path of pages) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), `HTTP failed on ${path}`).toBe(200)
      // Hold 3 seconds to allow full SSR+CSR hydration before assertions
      await page.waitForTimeout(3000)
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200))
      console.log(`[${path}] body sample:`, bodyText.replace(/\n/g, ' '))
    }

    // Filter out expected dev-only warnings (e.g. Nuxt DevTools, intentional backend absence)
    const realErrors = errors.filter(e =>
      !e.includes('DevTools') &&
      !e.includes('Failed to load resource') &&
      !e.includes('favicon') &&
      !e.includes('Failed to fetch') &&
      !e.includes('WebSocket') &&
      !e.includes('ws://localhost:8000') &&
      !e.includes('http://localhost:8000')
    )
    if (realErrors.length) {
      console.log('Errors detected:', realErrors)
    }
    expect(realErrors, 'No runtime errors').toHaveLength(0)
  })
})