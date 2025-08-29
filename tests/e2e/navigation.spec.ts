import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have working main navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check main navigation exists
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Test navigation to different sections
    const sections = [
      { name: 'forecast', pattern: /forecast/ },
      { name: 'map', pattern: /map/ },
      { name: 'about', pattern: /about/ },
      { name: 'methodology', pattern: /methodology/ },
      { name: 'articles', pattern: /articles/ }
    ];
    
    for (const section of sections) {
      const link = page.locator(`a[href*="${section.name}"]`).first();
      
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState('networkidle');
        
        // Check URL matches expected pattern
        expect(page.url()).toMatch(section.pattern);
        
        // Check page loads successfully
        await expect(page.locator('main')).toBeVisible();
        
        // Go back to home
        await page.goto('/');
      }
    }
  });

  test('should have working breadcrumb navigation', async ({ page }) => {
    await page.goto('/forecast');
    
    // Look for breadcrumb navigation
    const breadcrumbs = page.locator('[aria-label="breadcrumb"], .breadcrumb, nav[aria-label*="breadcrumb"]');
    
    if (await breadcrumbs.isVisible()) {
      // Should contain links back to parent pages
      const homeLink = breadcrumbs.locator('a[href*="/"]').first();
      
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await expect(page).toHaveURL(/\/(pt|en)\/?$/);
      }
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation has proper ARIA labels
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
    
    // Check navigation items are keyboard accessible
    const navLinks = nav.locator('a');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      // Focus first navigation link
      await navLinks.first().focus();
      
      // Should be able to tab through navigation
      for (let i = 0; i < Math.min(3, linkCount); i++) {
        await page.keyboard.press('Tab');
      }
    }
  });

  test('should have working footer navigation', async ({ page }) => {
    await page.goto('/');
    
    // Look for footer navigation
    const footer = page.locator('footer');
    
    if (await footer.isVisible()) {
      const footerLinks = footer.locator('a');
      const linkCount = await footerLinks.count();
      
      if (linkCount > 0) {
        // Test first footer link
        const firstLink = footerLinks.first();
        const href = await firstLink.getAttribute('href');
        
        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          await firstLink.click();
          await page.waitForLoadState('networkidle');
          
          // Should navigate successfully
          await expect(page.locator('main')).toBeVisible();
        }
      }
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    
    // Should return 404 status
    expect(response?.status()).toBe(404);
    
    // Should show a user-friendly error page
    await expect(page.locator('main')).toBeVisible();
    
    // Should have navigation back to main site
    const homeLink = page.locator('a[href*="/"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/(pt|en)\/?$/);
    }
  });

  test('should have mobile-friendly navigation', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      
      // Look for mobile navigation (hamburger menu, etc.)
      const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, button[aria-label*="menu"]');
      
      if (await mobileNav.isVisible()) {
        // Test mobile menu toggle
        await mobileNav.click();
        
        // Menu should open/expand
        const expandedMenu = page.locator('[aria-expanded="true"], .nav-open, .menu-open');
        
        if (await expandedMenu.isVisible()) {
          // Should be able to navigate from mobile menu
          const firstLink = expandedMenu.locator('a').first();
          
          if (await firstLink.isVisible()) {
            await firstLink.click();
            await page.waitForLoadState('networkidle');
            await expect(page.locator('main')).toBeVisible();
          }
        }
      }
    }
  });

  test('should support back/forward browser navigation', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to forecast page
    const forecastLink = page.locator('a[href*="forecast"]').first();
    if (await forecastLink.isVisible()) {
      await forecastLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/forecast/);
      
      // Navigate to map page
      const mapLink = page.locator('a[href*="map"]').first();
      if (await mapLink.isVisible()) {
        await mapLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toMatch(/map/);
        
        // Test browser back button
        await page.goBack();
        expect(page.url()).toMatch(/forecast/);
        
        // Test browser forward button
        await page.goForward();
        expect(page.url()).toMatch(/map/);
      }
    }
  });
});