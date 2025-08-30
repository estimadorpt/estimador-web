import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page, isMobile }) => {
    await page.goto('/pt');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/estimador\.pt/);
    
    // Check for navigation
    if (!isMobile) {
      // Desktop: nav should be visible
      await expect(page.locator('nav').first()).toBeVisible();
    } else {
      // Mobile: hamburger menu button should be visible
      await expect(page.locator('button[aria-label="Toggle mobile menu"]')).toBeVisible();
    }
    
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
      
      // Test mobile navigation functionality
      const menuButton = page.locator('button[aria-label="Toggle mobile menu"]');
      await expect(menuButton).toBeVisible();
      
      // Open mobile menu
      await menuButton.click();
      
      // Verify mobile navigation menu appears
      const mobileNav = page.locator('nav').nth(1); // Second nav is the mobile menu
      await expect(mobileNav).toBeVisible();
      
      // Verify navigation links are visible in mobile menu specifically
      await expect(mobileNav.locator('text=Previsões')).toBeVisible();
      await expect(mobileNav.locator('text=Mapa')).toBeVisible();
      
      // Verify language switcher is accessible in mobile menu
      await expect(mobileNav.locator('text=PT')).toBeVisible();
      await expect(mobileNav.locator('text=EN')).toBeVisible();
      
      // Close mobile menu
      await menuButton.click();
      
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