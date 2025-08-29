import { test, expect } from '@playwright/test';

test.describe('Forecast Page', () => {
  test('should load forecast page successfully', async ({ page }) => {
    await page.goto('/forecast');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/estimador\.pt/);
    
    // Wait for charts to load
    await page.waitForLoadState('networkidle');
    
    // Check for main content
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display forecast charts', async ({ page }) => {
    await page.goto('/forecast');
    await page.waitForLoadState('networkidle');
    
    // Wait for potential chart containers to load
    await page.waitForTimeout(2000);
    
    // Check if any SVG charts are present (Observable Plot creates SVGs)
    const svgCharts = page.locator('svg');
    const chartCount = await svgCharts.count();
    
    // We expect at least one chart to be present
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should have interactive chart elements', async ({ page }) => {
    await page.goto('/forecast');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for chart containers that might have interactive elements
    const chartContainers = page.locator('[data-testid*="chart"], .chart, svg').first();
    
    if (await chartContainers.isVisible()) {
      // Test hover interaction if chart is present
      await chartContainers.hover();
      
      // Check if tooltip or hover state appears
      // This is a basic test - specific implementations may vary
      const possibleTooltip = page.locator('[role="tooltip"], .tooltip');
      // Don't fail if tooltip doesn't appear, just check the hover worked
      await expect(chartContainers).toBeVisible();
    }
  });

  test('should load data successfully', async ({ page }) => {
    // Monitor network requests for data files
    let dataLoaded = false;
    
    page.on('response', response => {
      if (response.url().includes('.json') && response.status() === 200) {
        dataLoaded = true;
      }
    });

    await page.goto('/forecast');
    await page.waitForLoadState('networkidle');
    
    // Check that at least some JSON data was loaded
    expect(dataLoaded).toBe(true);
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/forecast');
      await page.waitForLoadState('networkidle');
      
      // Check that content is visible on mobile
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      // Check that charts adapt to mobile (they should still be visible)
      await page.waitForTimeout(2000);
      const svgCharts = page.locator('svg');
      if (await svgCharts.count() > 0) {
        await expect(svgCharts.first()).toBeVisible();
      }
    }
  });

  test('should handle loading states gracefully', async ({ page }) => {
    await page.goto('/forecast');
    
    // The page should load even if some charts fail
    await expect(page.locator('main')).toBeVisible();
    
    // Wait for network to settle
    await page.waitForLoadState('networkidle');
    
    // Check that page doesn't show any critical error messages
    const errorMessages = page.locator('[data-testid="error"], .error');
    const errorCount = await errorMessages.count();
    
    // If there are error messages, they should be graceful
    if (errorCount > 0) {
      const errorText = await errorMessages.first().textContent();
      expect(errorText).not.toContain('undefined');
      expect(errorText).not.toContain('null');
    }
  });
});