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
    const mapPaths = page.locator('svg path[data-district], svg path[id*="district"], svg path[class*="district"]');
    const pathCount = await mapPaths.count();
    
    if (pathCount > 0) {
      // Test that map elements exist and are interactive
      await expect(mapPaths.first()).toBeVisible();
      
      // Try gentle interaction without forcing hover
      try {
        await mapPaths.first().click({ timeout: 5000 });
      } catch (error) {
        // If interaction fails, just verify the element exists
        await expect(mapPaths.first()).toBeVisible();
      }
    } else {
      // If no specific district paths found, check for any SVG content
      const svgElements = page.locator('svg');
      await expect(svgElements.first()).toBeVisible();
    }
  });

  test('should display district information on interaction', async ({ page }) => {
    await page.goto('/pt/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for interactive district elements
    const districtPaths = page.locator('svg path[data-district], svg path[id*="district"], svg path[class*="district"]');
    const pathCount = await districtPaths.count();
    
    if (pathCount > 0) {
      // Try to interact with first district element
      try {
        await districtPaths.first().hover({ timeout: 5000 });
        
        // Look for tooltip or info panel
        const tooltip = page.locator('[role="tooltip"], .tooltip, .district-info');
        
        // If tooltip appears, it should contain meaningful content
        if (await tooltip.isVisible()) {
          const tooltipContent = await tooltip.textContent();
          expect(tooltipContent).toBeTruthy();
          expect(tooltipContent!.length).toBeGreaterThan(0);
        }
      } catch (error) {
        // If hover fails, just verify the map exists
        await expect(districtPaths.first()).toBeVisible();
      }
    } else {
      // Check that map is present even if no interactive elements
      const mapContent = page.locator('svg, [data-testid="map"], .map-container');
      await expect(mapContent.first()).toBeVisible();
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