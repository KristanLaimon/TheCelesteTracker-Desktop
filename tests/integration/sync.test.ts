import { test, expect } from '@playwright/test';

test('app loads and shows campaign list', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h2:has-text("Campaigns")')).toBeVisible();
});

test('app connects to websocket', async ({ page }) => {
  await page.goto('/');
  // This depends on a mock or a running celeste instance
  // For integration test mode, we might want to mock the backend events
  // await page.evaluate(() => { ... });
});
