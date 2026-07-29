import { test, expect } from '@playwright/test'

test('history: scan fetch from browser to backend should succeed (or give CORS)', async ({ page, browser }) => {
  // Capture all responses to see if there's a CORS preflight or 200 with data
  const responses: { url: string; status: number; headers: Record<string, string> }[] = []

  page.on('response', async response => {
    const url = response.url()
    if (url.includes('192.168.1.108') || url.includes('/api/v1/')) {
      const headers: Record<string, string> = {}
      response.headersArray().forEach(h => { headers[h.name.toLowerCase()] = h.value })
      responses.push({ url, status: response.status(), headers })
    }
  })

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[console.error] ${msg.text()}`)
  })

  await page.goto('/history', { waitUntil: 'domcontentloaded' })
  // Wait for hydration + fetch
  await page.waitForTimeout(8000)

  console.log('=== /history responses ===')
  responses.forEach(r => {
    console.log(`  ${r.status} ${r.url}`)
    console.log(`    Access-Control-Allow-Origin: ${r.headers['access-control-allow-origin'] || '(none)'}`)
  })

  // Read body to check whether error banner or data is shown
  const bodyText = await page.locator('body').innerText()
  const hasError = bodyText.includes('Failed to')
  const hasData = bodyText.includes('Scan History') && (bodyText.match(/LTE|NR|GSM/) != null)
  console.log(`Has error banner: ${hasError}`)
  console.log(`Has scan data: ${hasData}`)

  // Print a snippet around "Failed" if present
  if (hasError) {
    const idx = bodyText.indexOf('Failed to')
    console.log(`Failed context: ${bodyText.substring(Math.max(0, idx - 20), idx + 100)}`)
  }
})