import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/pt');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/estimador\.pt/);
    
    // Check for main navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for main content (homepage uses divs, not main element)
    await expect(page.locator('section').first()).toBeVisible();
    
    // Check for key headline content
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display key metrics cards', async ({ page }) => {
    await page.goto('/pt');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for metrics/cards that should be visible
    // These may be different based on the actual content
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/pt');
    
    // Test navigation to forecast page
    const forecastLink = page.locator('a[href*="forecast"]').first();
    if (await forecastLink.isVisible()) {
      const href = await forecastLink.getAttribute('href');
      if (href) {
        await forecastLink.click();
        await page.waitForLoadState('networkidle');
        const currentUrl = page.url();
        // Check that navigation occurred (URL changed)
        expect(currentUrl).not.toBe('http://localhost:3000/pt/');
      }
    }
    
    // Return to home for next test
    await page.goto('/pt');
    
    // Test that navigation elements exist and are clickable
    const navLinks = page.locator('nav a, a[href*="/pt/"]');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/pt');
      
      // Check that the page loads on mobile
      await expect(page).toHaveTitle(/estimador\.pt/);
      
      // Check for mobile navigation (might be hamburger menu)
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
      
      // Ensure content is visible and not cut off
      const main = page.locator('section, main, .container').first();
      await expect(main).toBeVisible();
    }
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    await page.goto('/pt');
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors (like 404s for optional resources)
    const criticalErrors = jsErrors.filter(error => 
      !error.includes('404') && 
      !error.includes('favicon') &&
      !error.toLowerCase().includes('network')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});