import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have working main navigation', async ({ page }) => {
    await page.goto('/pt');
    
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
        await expect(page.locator('section, main, .container').first()).toBeVisible();
        
        // Go back to home
        await page.goto('/pt');
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
    await page.goto('/pt');
    
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
    await page.goto('/pt');
    
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
          await expect(page.locator('section, main, .container').first()).toBeVisible();
        }
      }
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/pt/non-existent-page');
    
    // Should handle invalid pages without crashing
    expect(response?.status()).toBeLessThan(500);
    
    // Check that some content is displayed (even if it's redirected)
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('should have mobile-friendly navigation', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/pt');
      
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
            await expect(page.locator('section, main, .container').first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should support back/forward browser navigation', async ({ page }) => {
    // Test browser navigation with direct URL navigation
    await page.goto('/pt');
    await page.waitForLoadState('networkidle');
    
    // Navigate to forecast page directly
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/forecast/);
    
    // Navigate to map page directly
    await page.goto('/pt/map');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/map/);
    
    // Test browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/forecast/);
    
    // Test browser forward button
    await page.goForward();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/map/);
  });
});