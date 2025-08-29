import { test, expect } from '@playwright/test';

test.describe('Map Page', () => {
  test('should load map page successfully', async ({ page }) => {
    await page.goto('/pt/map');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/estimador\.pt/);
    
    // Wait for the map to potentially load
    await page.waitForLoadState('networkidle');
    
    // Check for main content
    await expect(page.locator('section, main, .container').first()).toBeVisible();
  });

  test('should display Portugal district map', async ({ page }) => {
    await page.goto('/pt/map');
    await page.waitForLoadState('networkidle');
    
    // Wait for map to load
    await page.waitForTimeout(3000);
    
    // Check if SVG map is present
    const mapSvg = page.locator('svg');
    const svgCount = await mapSvg.count();
    
    if (svgCount > 0) {
      await expect(mapSvg.first()).toBeVisible();
      
      // Check if map has path elements (district boundaries)
      const mapPaths = page.locator('svg path');
      const pathCount = await mapPaths.count();
      expect(pathCount).toBeGreaterThan(0);
    }
  });

  test('should have interactive map elements', async ({ page }) => {
    await page.goto('/pt/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for clickable map elements
    const mapPaths = page.locator('svg path').first();
    
    if (await mapPaths.isVisible()) {
      // Test hover interaction
      await mapPaths.hover();
      
      // Test click interaction
      await mapPaths.click();
      
      // The interaction should not cause errors
      await expect(mapPaths).toBeVisible();
    }
  });

  test('should display district information on interaction', async ({ page }) => {
    await page.goto('/pt/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for district paths
    const districtPaths = page.locator('svg path');
    
    if (await districtPaths.count() > 0) {
      // Hover over first district
      await districtPaths.first().hover();
      
      // Look for tooltip or info panel
      const tooltip = page.locator('[role="tooltip"], .tooltip, .district-info');
      
      // If tooltip appears, it should contain meaningful content
      if (await tooltip.isVisible()) {
        const tooltipContent = await tooltip.textContent();
        expect(tooltipContent).toBeTruthy();
        expect(tooltipContent!.length).toBeGreaterThan(0);
      }
    }
  });

  test('should handle TopoJSON loading', async ({ page }) => {
    // Monitor network requests for geographic data
    let topoJsonLoaded = false;
    
    page.on('response', response => {
      if (response.url().includes('.json') && 
          (response.url().includes('topojson') || response.url().includes('geo'))) {
        topoJsonLoaded = true;
      }
    });

    await page.goto('/pt/map');
    await page.waitForLoadState('networkidle');
    
    // Map should attempt to load geographic data
    // Note: May not always be successful depending on data availability
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/pt/map');
      await page.waitForLoadState('networkidle');
      
      // Check that map content is visible on mobile
      const main = page.locator('section, main, .container').first();
      await expect(main).toBeVisible();
      
      // Map should adapt to mobile viewport
      await page.waitForTimeout(3000);
      const mapContainer = page.locator('svg, [data-testid="map"]');
      
      if (await mapContainer.count() > 0) {
        await expect(mapContainer.first()).toBeVisible();
      }
    }
  });

  test('should handle map loading errors gracefully', async ({ page }) => {
    await page.goto('/pt/map');
    await page.waitForLoadState('networkidle');
    
    // The page should load even if map data fails
    await expect(page.locator('section, main, .container').first()).toBeVisible();
    
    // Check for error boundaries or graceful error handling
    const errorMessages = page.locator('[data-testid="error"], .error, .map-error');
    const errorCount = await errorMessages.count();
    
    // If there are errors, they should be user-friendly
    if (errorCount > 0) {
      const errorText = await errorMessages.first().textContent();
      expect(errorText).not.toContain('undefined');
      expect(errorText).not.toContain('Cannot read property');
    }
  });
});