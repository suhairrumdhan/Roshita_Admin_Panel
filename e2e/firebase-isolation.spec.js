import { expect, test } from '@playwright/test';

test('admin test build never requests the production Firebase project', async ({ page }) => {
  const productionRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('pharma-apps')) {
      productionRequests.push(request.url());
    }
  });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  expect(productionRequests).toEqual([]);
});
