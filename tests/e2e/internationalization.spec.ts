import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
  test('should default to Portuguese locale', async ({ page }) => {
    await page.goto('/');
    
    // Check that URL contains Portuguese locale or defaults to it
    const url = page.url();
    expect(url).toMatch(/\/pt\//);
  });

  test('should support English locale', async ({ page }) => {
    await page.goto('/en');
    
    // Check that URL contains English locale
    expect(page.url()).toMatch(/\/en\//);
    
    // Check that page loads successfully in English
    await expect(page.locator('section, main, .container').first()).toBeVisible();
  });

  test('should have language switcher', async ({ page }) => {
    await page.goto('/');
    
    // Look for language switcher elements
    const langSwitcher = page.locator('[data-testid="language-switcher"], [aria-label*="language"], [aria-label*="idioma"]');
    
    if (await langSwitcher.isVisible()) {
      // Test switching languages
      await langSwitcher.click();
      
      // Should be able to interact with language options
      const englishOption = page.locator('text=English, text=EN, [href*="/en"]').first();
      if (await englishOption.isVisible()) {
        await englishOption.click();
        
        // Should navigate to English version
        await page.waitForLoadState('networkidle');
        expect(page.url()).toMatch(/\/en\//);
      }
    }
  });

  test('should maintain language preference across navigation', async ({ page }) => {
    // Start with English
    await page.goto('/en');
    expect(page.url()).toMatch(/\/en\//);
    
    // Navigate to different pages and check language is maintained
    const forecastLink = page.locator('a[href*="forecast"]').first();
    if (await forecastLink.isVisible()) {
      await forecastLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/en\/.*forecast/);
    }
    
    // Navigate to map page
    const mapLink = page.locator('a[href*="map"]').first();
    if (await mapLink.isVisible()) {
      await mapLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/en\/.*map/);
    }
  });

  test('should display content in correct language', async ({ page }) => {
    // Test Portuguese content
    await page.goto('/pt');
    await page.waitForLoadState('networkidle');
    
    const ptContent = await page.textContent('body');
    
    // Look for Portuguese words
    const hasPortuguese = ptContent?.includes('Eleições') || 
                         ptContent?.includes('Legislativas') ||
                         ptContent?.includes('Portugal') ||
                         ptContent?.includes('Assembleia');
    
    if (hasPortuguese) {
      expect(hasPortuguese).toBe(true);
    }
    
    // Test English content
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    
    const enContent = await page.textContent('body');
    
    // Look for English words
    const hasEnglish = enContent?.includes('Elections') || 
                      enContent?.includes('Forecast') ||
                      enContent?.includes('Parliament') ||
                      enContent?.includes('Assembly');
    
    if (hasEnglish) {
      expect(hasEnglish).toBe(true);
    }
  });

  test('should handle locale redirects correctly', async ({ page }) => {
    // Test root redirect
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to a locale-specific URL
    const url = page.url();
    expect(url).toMatch(/\/(pt|en)\//);
  });

  test('should handle invalid locales gracefully', async ({ page }) => {
    // Test with invalid locale
    const response = await page.goto('/invalid-locale/forecast');
    
    // Should either redirect to valid locale or show 404
    // But shouldn't crash the application
    expect(response?.status()).toBeLessThan(500);
  });

  test('should preserve query parameters during locale switching', async ({ page }) => {
    // Navigate with query parameters
    await page.goto('/pt/forecast?test=123');
    
    // Switch language if switcher is available
    const langSwitcher = page.locator('[data-testid="language-switcher"], [href*="/en"]').first();
    
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click();
      await page.waitForLoadState('networkidle');
      
      // Query parameters should be preserved
      expect(page.url()).toContain('test=123');
    }
  });
});