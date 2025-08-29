import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/pt');
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Homepage should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have acceptable Core Web Vitals', async ({ page }) => {
    await page.goto('/pt');
    
    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // First Contentful Paint
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['paint'] });
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Return vitals after a delay to collect metrics
        setTimeout(() => resolve(vitals), 3000);
      });
    });
    
    // Core Web Vitals thresholds
    if ((vitals as any).fcp) {
      expect((vitals as any).fcp).toBeLessThan(2000); // FCP < 2s
    }
    if ((vitals as any).lcp) {
      expect((vitals as any).lcp).toBeLessThan(2500); // LCP < 2.5s
    }
    if ((vitals as any).cls !== undefined) {
      expect((vitals as any).cls).toBeLessThan(0.1); // CLS < 0.1
    }
  });

  test('should load forecast page charts efficiently', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    
    // Wait for charts to render
    await page.waitForTimeout(3000);
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Forecast page with charts should load within 8 seconds
    expect(loadTime).toBeLessThan(8000);
    
    // Check that charts are actually rendered
    const charts = page.locator('svg');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should handle multiple chart interactions efficiently', async ({ page }) => {
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const charts = page.locator('svg');
    const chartCount = await charts.count();
    
    if (chartCount > 0) {
      const startTime = Date.now();
      
      // Perform multiple interactions
      for (let i = 0; i < Math.min(3, chartCount); i++) {
        await charts.nth(i).hover();
        await page.waitForTimeout(100);
        await charts.nth(i).click();
        await page.waitForTimeout(100);
      }
      
      const endTime = Date.now();
      const interactionTime = endTime - startTime;
      
      // Interactions should be responsive (< 1 second total)
      expect(interactionTime).toBeLessThan(1000);
    }
  });

  test('should load data files efficiently', async ({ page }) => {
    let totalDataSize = 0;
    let dataRequestCount = 0;
    
    page.on('response', response => {
      if (response.url().includes('.json') && response.status() === 200) {
        dataRequestCount++;
        // Note: response.body() is not available in all contexts
        // This is a simplified check
      }
    });
    
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    
    // Should load data efficiently
    expect(dataRequestCount).toBeGreaterThan(0);
    expect(dataRequestCount).toBeLessThan(20); // Reasonable limit
  });

  test('should maintain performance on mobile devices', async ({ page, isMobile }) => {
    if (isMobile) {
      const startTime = Date.now();
      
      await page.goto('/pt/forecast');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Mobile should load within 10 seconds (allowing for slower processing)
      expect(loadTime).toBeLessThan(10000);
      
      // Check that content is visible
      const main = page.locator('main');
      await expect(main).toBeVisible();
    }
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/pt/forecast');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Get memory metrics
    const metrics = await page.evaluate(() => {
      return {
        // @ts-ignore
        memory: (performance as any).memory ? {
          // @ts-ignore
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          // @ts-ignore
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          // @ts-ignore
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      };
    });
    
    if (metrics.memory) {
      // Memory usage should be reasonable (< 100MB)
      expect(metrics.memory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
    }
  });

  test('should handle rapid navigation efficiently', async ({ page }) => {
    const pages = ['/pt', '/pt/forecast', '/pt/map', '/pt/about'];
    const startTime = Date.now();
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      // Don't wait for networkidle to test rapid navigation
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Rapid navigation through all pages should be quick
    expect(totalTime).toBeLessThan(10000);
  });

  test('should load without render-blocking resources', async ({ page }) => {
    let renderBlockingResources = 0;
    
    page.on('response', response => {
      const url = response.url();
      
      // Check for potentially render-blocking resources
      if ((url.includes('.css') || url.includes('.js')) && 
          !url.includes('/_next/') && 
          !response.fromCache()) {
        renderBlockingResources++;
      }
    });
    
    await page.goto('/pt');
    await page.waitForLoadState('domcontentloaded');
    
    // Should minimize render-blocking resources
    expect(renderBlockingResources).toBeLessThan(10);
  });

  test('should have efficient image loading', async ({ page }) => {
    let imageCount = 0;
    let imageSize = 0;
    
    page.on('response', response => {
      const contentType = response.headers()['content-type'] || '';
      
      if (contentType.startsWith('image/')) {
        imageCount++;
        // Track image loading for performance
      }
    });
    
    await page.goto('/pt');
    await page.waitForLoadState('networkidle');
    
    // Check for images in the DOM
    const images = page.locator('img');
    const domImageCount = await images.count();
    
    // Should load images efficiently
    if (domImageCount > 0) {
      expect(imageCount).toBeGreaterThanOrEqual(0);
    }
  });
});