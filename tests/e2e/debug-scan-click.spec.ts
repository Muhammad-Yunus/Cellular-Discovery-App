import { test, expect } from '@playwright/test';

test.describe('Debug: Scan click behavior', () => {
  test('clicking floating scan button triggers POST and adds new scan to sidebar', async ({ page }) => {
    // Navigate to home page
    await page.goto('/', { waitUntil: 'networkidle' });

    // Intercept POST to /api/v1/scan
    const postResponses: { status: number; duration: number }[] = [];
    page.on('response', (resp) => {
      if (resp.request().method() === 'POST' && resp.request().url().includes('/api/v1/scan')) {
        postResponses.push({ status: resp.status(), duration: resp.duration() });
      }
    });

    // Initial count of scan items
    const initialCardCount = await page.locator('app-history-card').count();

    // Click floating scan button (wait for it to be visible)
    const floatingBtn = page.locator('.floating-scan-btn');
    await expect(floatingBtn).toBeVisible();
    await floatingBtn.click();

    // Wait for POST to complete (scan takes >=30s)
    await page.waitForTimeout(50000);

    // At least one POST response received
    expect(postResponses.length).toBeGreaterThan(0);

    // Last POST should be 200 and take at least 30 seconds
    const lastPost = postResponses[postResponses.length - 1];
    expect(lastPost.status).toBe(200);
    expect(lastPost.duration).toBeGreaterThanOrEqual(30000);

    // Card count should have increased by 1
    const finalCardCount = await page.locator('app-history-card').count();
    expect(finalCardCount).toBe(initialCardCount + 1);
  });
});
