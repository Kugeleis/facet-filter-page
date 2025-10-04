import { test, expect } from '@playwright/test';

test.describe('Facet Filter App E2E', () => {
  test.beforeEach(async ({ page }) => {
    // The baseURL is configured in playwright.config.ts
    // so we can use a relative path here.
    await page.goto('/facet-filter-page/');
  });

  test('should load products and allow filtering', async ({ page }) => {
    // 1. Verify initial state
    // Wait for the product cards to be rendered
    await expect(page.locator('.card')).toHaveCount(51, { timeout: 10000 });

    // Check for the initial product count text
    await expect(page.locator('#product-count-container')).toContainText('Showing 51 of 51 products');

    // 2. Apply a filter
    // Find the "DSL" Internet Type filter and click it
    const dslFilterLabel = page.getByLabel('DSL');
    await dslFilterLabel.check();

    // 3. Verify filtered state
    // After filtering, expect the product count to update
    await expect(page.locator('#product-count-container')).toContainText('Showing 26 of 51 products');

    // Expect 26 cards to be visible
    await expect(page.locator('.card')).toHaveCount(26);
  });

  test('should reset filters correctly', async ({ page }) => {
    // First, apply a filter
    const dslFilterLabel = page.getByLabel('DSL');
    await dslFilterLabel.check();
    await expect(page.locator('.card')).toHaveCount(26);

    // Now, click the reset button
    const resetButton = page.getByRole('button', { name: 'Reset Filters' });
    await resetButton.click();

    // Verify that the filters are reset
    await expect(page.locator('.card')).toHaveCount(51);
    await expect(page.locator('#product-count-container')).toContainText('Showing 51 of 51 products');
    await expect(dslFilterLabel).not.toBeChecked();
  });
});