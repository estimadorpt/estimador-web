# E2E Testing with Playwright

This directory contains comprehensive end-to-end tests for estimador.pt using Playwright.

## Test Structure

```
tests/
├── e2e/                     # End-to-end functionality tests
│   ├── homepage.spec.ts     # Homepage functionality and navigation
│   ├── forecast.spec.ts     # Forecast page and chart functionality
│   ├── map.spec.ts          # Interactive map functionality
│   ├── internationalization.spec.ts # Language switching
│   ├── navigation.spec.ts   # Site navigation and routing
│   └── performance.spec.ts  # Performance benchmarks
├── visual/                  # Visual regression tests
│   ├── charts.spec.ts       # Chart rendering consistency
│   └── responsive.spec.ts   # Responsive design verification
├── accessibility/           # Accessibility compliance tests
│   └── a11y.spec.ts        # WCAG compliance and screen reader support
└── README.md               # This file
```

## Running Tests

### All Tests
```bash
npm test                    # Run all tests
npm run test:headed         # Run with browser UI visible
npm run test:ui             # Run with Playwright UI mode
```

### Specific Test Categories
```bash
npm run test:visual         # Visual regression tests
npm run test:accessibility  # Accessibility tests
npm run test:performance    # Performance benchmarks
```

### Device and Browser Testing
```bash
npm run test:mobile         # Mobile device tests
npm run test:browsers       # All browser engines (Chromium, Firefox, WebKit)
```

### Development and Debugging
```bash
npm run test:debug          # Debug mode with breakpoints
npm run test:report         # View test report
```

## Test Categories

### E2E Tests (`tests/e2e/`)

**Homepage Tests**
- Page loading and basic functionality
- Navigation link verification
- Mobile responsiveness
- JavaScript error detection

**Forecast Tests**
- Chart rendering and data loading
- Interactive chart elements
- Mobile chart adaptation
- Loading state handling

**Map Tests**
- Portugal district map display
- Interactive map elements (hover, click)
- TopoJSON data loading
- District information display

**Internationalization Tests**
- Portuguese/English locale support
- Language switcher functionality
- Content translation verification
- Locale persistence across navigation

**Navigation Tests**
- Main navigation functionality
- Breadcrumb navigation
- Footer links
- 404 error handling
- Mobile navigation (hamburger menus)
- Browser back/forward support

**Performance Tests**
- Page load times (< 5s homepage, < 8s forecast)
- Core Web Vitals (FCP < 2s, LCP < 2.5s, CLS < 0.1)
- Chart interaction responsiveness
- Data loading efficiency
- Memory usage monitoring

### Visual Regression Tests (`tests/visual/`)

**Chart Visual Tests**
- Polling trends chart consistency
- Seat forecast chart rendering
- Coalition chart display
- House effects matrix
- District map visualization
- Chart hover states

**Responsive Visual Tests**
- Multiple viewport sizes (mobile, tablet, desktop)
- Navigation menu adaptations
- Chart responsiveness
- Typography scaling
- Footer layout changes

### Accessibility Tests (`tests/accessibility/`)

**WCAG Compliance**
- Proper heading hierarchy (h1, h2, h3...)
- Alt text for images
- Keyboard navigation support
- Form accessibility (labels, ARIA)
- Color contrast verification
- ARIA landmarks (main, nav, footer)
- Focus indicators
- Screen reader compatibility

**Chart Accessibility**
- Chart titles and labels
- Alternative text descriptions
- Keyboard accessible interactions

## Configuration

### Playwright Configuration (`playwright.config.ts`)

**Browser Support**
- Chromium (primary)
- Firefox
- WebKit/Safari
- Mobile Chrome
- Mobile Safari

**Test Settings**
- Parallel execution
- Automatic retries on CI
- Screenshot capture on failure
- Video recording on failure
- Trace collection for debugging

**Performance Settings**
- Base URL: `http://localhost:3000`
- Automatic dev server startup
- Network idle detection
- Timeout configurations

### CI/CD Integration (`.github/workflows/playwright-tests.yml`)

**Test Jobs**
- **Main Tests**: E2E functionality across all browsers
- **Visual Regression**: Screenshot comparison tests
- **Accessibility**: WCAG compliance verification
- **Performance**: Load time and Core Web Vitals monitoring

**Artifact Collection**
- Test reports and videos
- Visual regression diffs
- Performance metrics
- Accessibility audit results

## Best Practices

### Writing Tests

1. **Wait Strategies**
   ```typescript
   await page.waitForLoadState('networkidle');  // Wait for network requests
   await page.waitForTimeout(3000);             // Wait for charts to render
   ```

2. **Element Selection**
   ```typescript
   // Prefer data-testid attributes
   page.locator('[data-testid="chart"]')
   
   // Fallback to semantic selectors
   page.locator('nav, [role="navigation"]')
   ```

3. **Responsive Testing**
   ```typescript
   if (isMobile) {
     // Mobile-specific tests
   }
   ```

4. **Error Handling**
   ```typescript
   const errorCount = await errorMessages.count();
   if (errorCount > 0) {
     // Handle graceful errors
   }
   ```

### Maintenance

1. **Update Screenshots**: When visual changes are intentional
   ```bash
   npx playwright test --update-snapshots
   ```

2. **Test Isolation**: Each test should be independent and not rely on other tests

3. **Performance Thresholds**: Update performance expectations as the site evolves

4. **Cross-Browser**: Ensure tests work across all supported browsers

## Troubleshooting

### Common Issues

**Charts Not Loading**
- Increase wait timeout for chart rendering
- Check for JavaScript errors in console
- Verify data file loading

**Visual Regression Failures**
- Check if changes are intentional
- Update snapshots if needed
- Consider font rendering differences across systems

**Mobile Test Failures**
- Verify touch target sizes (44px minimum)
- Check viewport-specific CSS
- Test with different mobile devices

**Performance Test Failures**
- Check network conditions
- Review resource loading order
- Optimize large assets

### Debugging

```bash
# Run specific test with debugging
npx playwright test tests/e2e/homepage.spec.ts --debug

# Run with browser UI visible
npx playwright test --headed

# Generate trace for analysis
npx playwright test --trace on
```

## Integration with Development

### Pre-commit Hooks
Consider adding Playwright tests to pre-commit hooks for critical paths:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:accessibility && npm run test:performance"
    }
  }
}
```

### Development Workflow
1. Write new features
2. Add corresponding tests
3. Run tests locally
4. Push to trigger CI/CD pipeline
5. Review test results and visual diffs

### Continuous Monitoring
- Performance regression alerts
- Accessibility compliance monitoring
- Visual change notifications
- Cross-browser compatibility checks

This testing framework ensures estimador.pt maintains high quality, accessibility, and performance standards as it continues to evolve.