import { test, expect } from '@playwright/test'

test.describe('History Page Smoke Test', () => {
  test('should load without HTTP error', async ({ page }) => {
    const response = await page.goto('/history', { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
  })
})

test.describe('History Page Date Range Filter', () => {
  test('should send start_date & end_date when filter diterapkan', async ({ page }) => {
    // Kunjungi halaman History
    await page.goto('/history')

    // Dapatkan elemen input berdasarkan label
    const fromInput = page.getByLabel('From')
    const toInput = page.getByLabel('To')

    // Buat contoh timestamp (waktu lokal)
    const formatDate = (date: Date): string => {
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const today = new Date()

    // Isi nilai tanggal
    await fromInput.fill(formatDate(yesterday))
    await toInput.fill(formatDate(today))

    // Tunggu hingga permintaan yang berisi start_date muncul
    const request = await page.waitForRequest(req => {
      const url = new URL(req.url())
      return url.pathname === '/scans' && url.searchParams.has('start_date')
    })

    const url = new URL(request.url())
    expect(url.searchParams.get('start_date')).toEqual(formatDate(yesterday))
    expect(url.searchParams.get('end_date')).toEqual(formatDate(today))
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
      return url.pathname === '/scans' && url.searchParams.has('start_date')
    })

    // Bersihkan input
    await fromInput.clear()
    await toInput.clear()

    // Tunggu permintaan berikutnya tanpa start_date & end_date
    const request = await page.waitForRequest(req => {
      const url = new URL(req.url())
      return url.pathname === '/scans' && !url.searchParams.has('start_date')
    })

    // Pastikan tidak ada parameter start_date/end_date
    const url = new URL(request.url())
    expect(url.searchParams.has('start_date')).toBeFalsy()
    expect(url.searchParams.has('end_date')).toBeFalsy()
  })
})
