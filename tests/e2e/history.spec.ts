import { test, expect } from '@playwright/test'

test.describe('History Page Smoke Test', () => {
  test('should load without HTTP error', async ({ page }) => {
    const response = await page.goto('/history', { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
  })
})

test.describe('History Page Date Range Filter', () => {
  test('should send start_time & end_time when filter diterapkan', async ({ page }) => {
    // Kunjungi halaman History
    await page.goto('/history')

    // Dapatkan elemen input berdasarkan label
    const fromInput = page.getByLabel('From')
    const toInput = page.getByLabel('To')

    // Buat contoh timestamp (waktu lokal) - format datetime-local (YYYY-MM-DDTHH:MM)
    const formatDate = (date: Date): string => {
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const today = new Date()

    // Isi nilai tanggal
    await fromInput.fill(formatDate(yesterday))
    await fromInput.dispatchEvent('input')
    await toInput.fill(formatDate(today))
    await toInput.dispatchEvent('input')

    // Tunggu hingga permintaan yang berisi start_time muncul
    const request = await page.waitForRequest(req => {
      const url = new URL(req.url())
      return url.pathname === '/api/v1/scans' && url.searchParams.has('start_time')
    }, { timeout: 30000 })

    // Juga tunggu respons yang sesuai untuk memeriksa total data
    const response = await page.waitForResponse(resp => {
      const url = resp.request().url()
      return url.includes('/api/v1/scans') && resp.status() === 200
    }, { timeout: 30000 })

    const json = await response.json()
    // Validasi format parameter URL
    const url = new URL(request.url())
    const startDate = url.searchParams.get('start_time') ?? ''
    const endDate = url.searchParams.get('end_time') ?? ''
    const isoWithOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
    expect(startDate).toMatch(isoWithOffset)
    expect(endDate).toMatch(isoWithOffset)
    expect(new Date(startDate).getTime()).toBeLessThanOrEqual(new Date(endDate).getTime())

    // Cek bahwa total sesuai dengan jumlah data yang dikembalikan
    const scans = json.items || []
    const total = json.total ?? 0
    expect(scans.length).toEqual(total)
    // Jika ada data, pastikan semuanya berada dalam rentang waktu yang diminta
    scans.forEach(scan => {
      const scanTime = new Date(scan.scan_time)
      expect(scanTime).toBeTruthy()
      expect(scanTime).toBeGreaterThanOrEqual(new Date(startDate))
      expect(scanTime).toBeLessThanOrEqual(new Date(endDate))
    })
  })

  test('should reset filters when date fields dibersihkan', async ({ page }) => {
    await page.goto('/history')

    const fromInput = page.getByLabel('From')
    const toInput = page.getByLabel('To')

    // Isi dulu tanggal
    const sampleDate = new Date().toISOString().slice(0, 16) // "YYYY-MM-DDTHH:MM"
    await fromInput.fill(sampleDate)
    await toInput.fill(sampleDate)

    // Tunggu permintaan pertama (dengan filter)
    await page.waitForRequest(req => {
      const url = new URL(req.url())
      return url.pathname === '/api/v1/scans' && url.searchParams.has('start_time')
    }, { timeout: 30000 })

    // Juga tunggu respons pertama untuk validasi total
    const response1 = await page.waitForResponse(resp => {
      const url = resp.request().url()
      return url.includes('/api/v1/scans') && resp.status() === 200
    }, { timeout: 30000 })
    const json1 = await response1.json()
    const scans1 = json1.items || []
    const total1 = json1.total ?? 0
    expect(scans1.length).toEqual(total1)

    // Bersihkan input
    await fromInput.clear()
    await fromInput.dispatchEvent('input')
    await toInput.clear()
    await toInput.dispatchEvent('input')

    // Tunggu permintaan berikutnya tanpa start_time & end_time
    const request2 = await page.waitForRequest(req => {
      const url = new URL(req.url())
      return url.pathname === '/api/v1/scans' && !url.searchParams.has('start_time')
    }, { timeout: 30000 })

    // Pastikan tidak ada parameter start_time/end_time
    const url2 = new URL(request2.url())
    expect(url2.searchParams.has('start_time')).toBeFalsy()
    expect(url2.searchParams.has('end_time')).toBeFalsy()

    // Juga tunggu respons kedua dan validasi total
    const response2 = await page.waitForResponse(resp => {
      const url = resp.request().url()
      return url.includes('/api/v1/scans') && resp.status() === 200
    }, { timeout: 30000 })
    const json2 = await response2.json()
    const scans2 = json2.items || []
    const total2 = json2.total ?? 0
    expect(scans2.length).toEqual(total2)
  })
})
