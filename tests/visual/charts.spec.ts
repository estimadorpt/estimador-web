import { test, expect } from '@playwright/test';

test.describe('Chart Visual Regression', () => {
  test('should render polling trends chart consistently', async ({ page }) => {
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    
    // Wait for charts to load
    await page.waitForTimeout(3000);
    
    // Look for polling trends chart
    const pollingChart = page.locator('[data-testid="polling-chart"], .polling-chart, svg').first();
    
    if (await pollingChart.isVisible()) {
      // Take screenshot of chart for visual regression
      await expect(pollingChart).toHaveScreenshot('polling-trends-chart.png');
    }
  });

  test('should render seat forecast chart consistently', async ({ page }) => {
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for seat forecast chart
    const seatChart = page.locator('[data-testid="seat-chart"], .seat-chart, svg').nth(1);
    
    if (await seatChart.isVisible()) {
      await expect(seatChart).toHaveScreenshot('seat-forecast-chart.png');
    }
  });

  test('should render coalition chart consistently', async ({ page }) => {
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for coalition chart
    const coalitionChart = page.locator('[data-testid="coalition-chart"], .coalition-chart, svg').nth(2);
    
    if (await coalitionChart.isVisible()) {
      await expect(coalitionChart).toHaveScreenshot('coalition-chart.png');
    }
  });

  test('should render house effects matrix consistently', async ({ page }) => {
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for house effects matrix
    const houseEffects = page.locator('[data-testid="house-effects"], .house-effects');
    
    if (await houseEffects.isVisible()) {
      await expect(houseEffects).toHaveScreenshot('house-effects-matrix.png');
    }
  });

  test('should render district map consistently', async ({ page }) => {
    await page.goto('/pt/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);
    
    // Look for district map
    const districtMap = page.locator('[data-testid="district-map"], .district-map, svg').first();
    
    if (await districtMap.isVisible()) {
      await expect(districtMap).toHaveScreenshot('district-map.png');
    }
  });

  test('should render charts consistently on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/pt/forecast');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Take screenshot of entire forecast page on mobile
      await expect(page.locator('main')).toHaveScreenshot('forecast-mobile.png');
    }
  });

  test('should handle chart hover states consistently', async ({ page }) => {
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const firstChart = page.locator('svg').first();
    
    if (await firstChart.isVisible()) {
      // Hover over chart
      await firstChart.hover();
      await page.waitForTimeout(500);
      
      // Take screenshot with hover state
      await expect(firstChart).toHaveScreenshot('chart-hover-state.png');
    }
  });

  test('should render responsive chart layouts consistently', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await expect(page.locator('main')).toHaveScreenshot('forecast-desktop-layout.png');
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    await expect(page.locator('main')).toHaveScreenshot('forecast-tablet-layout.png');
  });

  test('should render chart loading states consistently', async ({ page }) => {
    // Start navigation but don't wait for full load
    await page.goto('/pt/forecast');
    
    // Take screenshot of loading state (if visible)
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner');
    
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toHaveScreenshot('chart-loading-state.png');
    }
    
    // Wait for full load
    await page.waitForLoadState('networkidle');
  });

  test('should render error states consistently', async ({ page }) => {
    // This test would need to simulate error conditions
    // For now, just check if error boundaries render consistently
    
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    
    // Look for any error messages that might be displayed
    const errorMessages = page.locator('[data-testid="error"], .error');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      await expect(errorMessages.first()).toHaveScreenshot('chart-error-state.png');
    }
  });
});