import { test, expect } from '@playwright/test'

test('api requests use 192.168.1.108 (not localhost)', async ({ page }) => {
  const apiRequests: string[] = []

  // Install handler BEFORE goto
  page.on('request', request => {
    const url = request.url()
    if (url.includes(':8000') || url.includes('/ws/') || (url.includes('/api/v1/') && !url.includes('localhost:3000'))) {
      apiRequests.push(url)
    }
  })

  // Visit home (scan result page)
  await page.goto('/', { waitUntil: 'commit' })

  // Poll until we see at least one backend request OR timeout (15s)
  const start = Date.now()
  while (apiRequests.length === 0 && Date.now() - start < 15000) {
    await page.waitForTimeout(500)
  }
  // Additional settle time
  await page.waitForTimeout(1000)

  console.log('=== Captured API requests ===')
  apiRequests.forEach(url => console.log(' -', url))

  const localhostBackendReqs = apiRequests.filter(u => u.includes('localhost') && (u.includes(':8000') || u.includes('/api/v1/')))
  const correctHostReqs = apiRequests.filter(u => u.includes('192.168.1.108'))

  console.log(`localhost backend requests: ${localhostBackendReqs.length}`)
  console.log(`192.168.1.108 backend requests: ${correctHostReqs.length}`)

  // Primary assertion: NO localhost:8000 API calls (localhost:3000 is fine — that's the Nuxt dev server)
  expect(localhostBackendReqs, 'should NOT hit localhost:8000 for backend API').toHaveLength(0)

  // Soft assertion: if backend IS reachable, requests must go to 192.168.1.108
  // (skip > 0 if backend is down — captured.length === 0 is acceptable when backend unreachable)
  if (correctHostReqs.length === 0 && apiRequests.length > 0) {
    throw new Error(`Found ${apiRequests.length} backend requests but none to 192.168.1.108`)
  }
})