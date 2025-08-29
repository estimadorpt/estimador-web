import { test, expect } from '@playwright/test';

test.describe('Responsive Design Visual Tests', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 }, // iPhone SE
    { name: 'tablet', width: 768, height: 1024 }, // iPad
    { name: 'desktop', width: 1200, height: 800 }, // Desktop
    { name: 'large-desktop', width: 1920, height: 1080 } // Large Desktop
  ];

  for (const viewport of viewports) {
    test(`should render homepage correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/pt');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: true
      });
    });

    test(`should render forecast page correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/pt/forecast');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for charts to load
      
      await expect(page).toHaveScreenshot(`forecast-${viewport.name}.png`, {
        fullPage: true
      });
    });

    test(`should render map page correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/pt/map');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(4000); // Wait for map to load
      
      await expect(page).toHaveScreenshot(`map-${viewport.name}.png`, {
        fullPage: true
      });
    });
  }

  test('should handle navigation menu responsively', async ({ page }) => {
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for mobile menu trigger
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]');
    
    if (await mobileMenuButton.isVisible()) {
      await expect(page.locator('nav')).toHaveScreenshot('mobile-nav-closed.png');
      
      // Open mobile menu
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('nav')).toHaveScreenshot('mobile-nav-open.png');
    }
    
    // Test desktop navigation
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    await expect(page.locator('nav')).toHaveScreenshot('desktop-nav.png');
  });

  test('should render chart responsiveness correctly', async ({ page }) => {
    await page.goto('/forecast');
    await page.waitForLoadState('networkidle');
    
    // Test different chart container sizes
    const chartSizes = [
      { width: 320, height: 568 }, // Small mobile
      { width: 414, height: 896 }, // Large mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1024, height: 768 } // Desktop
    ];
    
    for (const size of chartSizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(1000); // Wait for responsive resize
      
      const charts = page.locator('svg');
      const chartCount = await charts.count();
      
      if (chartCount > 0) {
        await expect(charts.first()).toHaveScreenshot(`chart-responsive-${size.width}x${size.height}.png`);
      }
    }
  });

  test('should render typography responsively', async ({ page }) => {
    const pages = ['/about', '/methodology'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Test mobile typography
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      const mainContent = page.locator('main');
      if (await mainContent.isVisible()) {
        await expect(mainContent).toHaveScreenshot(`${pagePath.replace('/', '')}-typography-mobile.png`);
      }
      
      // Test desktop typography
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);
      
      if (await mainContent.isVisible()) {
        await expect(mainContent).toHaveScreenshot(`${pagePath.replace('/', '')}-typography-desktop.png`);
      }
    }
  });

  test('should handle overflow and scrolling correctly', async ({ page }) => {
    // Test horizontal overflow on mobile
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/forecast');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for horizontal scrollbars (should be minimal)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    // Allow for minimal overflow (less than 20px)
    expect(scrollWidth - clientWidth).toBeLessThan(20);
    
    // Take screenshot to verify no cut-off content
    await expect(page).toHaveScreenshot('mobile-overflow-check.png', {
      fullPage: true
    });
  });

  test('should render footer responsively', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const footer = page.locator('footer');
    
    if (await footer.isVisible()) {
      // Mobile footer
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      await expect(footer).toHaveScreenshot('footer-mobile.png');
      
      // Desktop footer
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);
      await expect(footer).toHaveScreenshot('footer-desktop.png');
    }
  });
});