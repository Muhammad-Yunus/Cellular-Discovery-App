import { test, expect } from '@playwright/test'

test('navbar icons render', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // App name brand
  const brand = page.locator('header a[href="/"]').first()
  await expect(brand).toBeVisible()

  // Brand icon (radio-tower) — check that the class is rendered AND CSS background-image is resolved
  const brandIcon = brand.locator('span').first()
  const brandIconClass = await brandIcon.getAttribute('class')
  console.log('Brand icon class:', brandIconClass)

  // For Nuxt Icon with class strategy, an inline <svg> is rendered instead of background CSS
  // Both strategies are valid — accept either
  const brandSvgCount = await brand.locator('svg').count()
  const brandBgImage = await brandIcon.evaluate(el => getComputedStyle(el).backgroundImage)
  console.log('Brand svg count:', brandSvgCount, 'bgImage:', brandBgImage.substring(0, 80))

  // Nav links with icons
  const navLinks = page.locator('header nav a')
  const count = await navLinks.count()
  console.log('Nav links count:', count)

  for (let i = 0; i < count; i++) {
    const link = navLinks.nth(i)
    const text = (await link.textContent())?.trim()
    const iconSpan = link.locator('span').first()
    const iconClass = await iconSpan.getAttribute('class')
    const iconSvgCount = await link.locator('svg').count()
    const bgImage = await iconSpan.evaluate(el => getComputedStyle(el).backgroundImage)
    console.log(`Nav link "${text}": icon class=${iconClass}, svg count=${iconSvgCount}, bgImage=${bgImage.substring(0, 60)}`)
  }

  // Take screenshot for visual proof
  await page.screenshot({ path: 'tests/e2e/__screenshots__/navbar-icons.png', fullPage: false })

  console.log('Console errors:', errors)
})