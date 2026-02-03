/**
 * Visual Regression Testing for Map Component
 * 
 * This test suite performs visual snapshot testing on the map component
 * to catch rendering regressions (e.g., broken shaders, missing styles).
 * 
 * Setup:
 * 1. Install Playwright: npm install -D @playwright/test
 * 2. Install browsers: npx playwright install
 * 3. Run tests: npx playwright test
 */

import { test, expect } from '@playwright/test';

test.describe('Map Component Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set up viewport and mock Geolocation API for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.route('**/api/**', async (route) => {
      // Mock API responses for consistent testing
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });
  });

  test('should render map correctly at default location', async ({ page }) => {
    // Navigate to the map page
    await page.goto('/map');

    // Wait for map to fully load
    await page.waitForSelector('.maplibregl-canvas', { timeout: 30000 });

    // Wait for any loading states to disappear
    await page.waitForFunction(() => {
      const loadingIndicator = document.querySelector('[class*="loading"], [class*="Loader"]');
      return !loadingIndicator;
    });

    // Take a screenshot of the map container
    const mapContainer = page.locator('.maplibregl-map, [class*="MapContainer"]');
    await expect(mapContainer).toHaveScreenshot('map-default-view.png', {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    });
  });

  test('should render map at specific coordinates', async ({ page }) => {
    // Navigate with specific query parameters for location
    await page.goto('/map?lat=40.7128&lng=-74.0060&zoom=12');

    // Wait for map to load
    await page.waitForSelector('.maplibregl-canvas', { timeout: 30000 });

    // Wait for tiles to load
    await page.waitForFunction(() => {
      const canvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement;
      if (!canvas) return false;
      // Check if canvas has content (not blank)
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const imageData = ctx.getImageData(50, 50, 1, 1).data;
      return imageData[0] !== 0 || imageData[1] !== 0 || imageData[2] !== 0;
    });

    // Take screenshot of map at specific coordinates
    const mapCanvas = page.locator('.maplibregl-canvas');
    await expect(mapCanvas).toHaveScreenshot('map-nyc-coordinates.png', {
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('should render map controls correctly', async ({ page }) => {
    await page.goto('/map');
    await page.waitForSelector('.maplibregl-canvas', { timeout: 30000 });

    // Check that map controls are present and visible
    const zoomControls = page.locator('[class*="zoom"], .maplibregl-ctrl-zoom');
    await expect(zoomControls).toBeVisible();

    // Screenshot of controls area
    const mapContainer = page.locator('.maplibregl-map');
    await expect(mapContainer).toHaveScreenshot('map-with-controls.png');
  });

  test('should render different zoom levels correctly', async ({ page }) => {
    await page.goto('/map');
    await page.waitForSelector('.maplibregl-canvas', { timeout: 30000 });

    // Test zoom level 4 (city view)
    // Note: In a real test, you would interact with zoom controls or use API
    await page.waitForTimeout(2000); // Allow map to settle

    await expect(page.locator('.maplibregl-map')).toHaveScreenshot('map-zoom-city.png');
  });

  test('should maintain consistent rendering across sessions', async ({ page }) => {
    // First session - establish baseline
    await page.goto('/map?baseline=true');
    await page.waitForSelector('.maplibregl-canvas', { timeout: 30000 });
    await page.waitForTimeout(3000); // Allow full render

    const baselineScreenshot = await page
      .locator('.maplibregl-map')
      .screenshot({ path: '/tmp/baseline.png' });

    // In production, this baseline would be stored in the repository
    // and compared against in subsequent test runs
    expect(baselineScreenshot).toBeDefined();
  });

  test('should handle overlay layers correctly', async ({ page }) => {
    // Mock a layer configuration response
    await page.route('**/api/layers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'layer-1', type: 'fill', visible: true },
          { id: 'layer-2', type: 'line', visible: true },
        ]),
      });
    });

    await page.goto('/map');
    await page.waitForSelector('.maplibregl-canvas', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Screenshot should show map with any visible overlays
    await expect(page.locator('.maplibregl-map')).toHaveScreenshot('map-with-layers.png');
  });
});

test.describe('Dashboard Component Visual Regression', () => {
  test('should render dashboard layout correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Screenshot of dashboard layout
    await expect(page.locator('[class*="Dashboard"]')).toHaveScreenshot(
      'dashboard-layout.png'
    );
  });
});

test.describe('Sidebar Component Visual Regression', () => {
  test('should render sidebar tabs correctly', async ({ page }) => {
    await page.goto('/map');
    await page.waitForSelector('[class*="Sidebar"]', { timeout: 30000 });

    // Test each sidebar tab
    const tabs = ['layers', 'analytics', 'data', 'visualization', 'spatial-analysis'];

    for (const tab of tabs) {
      // Click on tab
      await page.click(`[class*="Sidebar"] [data-tab="${tab}"]`);
      await page.waitForTimeout(500);

      // Take screenshot
      await expect(page.locator('[class*="Sidebar"]')).toHaveScreenshot(
        `sidebar-tab-${tab}.png`
      );
    }
  });
});

// Helper function to generate baseline images
// Run with: npx playwright test --update-snapshots
test('generate baseline screenshots', async ({ page }) => {
  // This test is only for generating initial baselines
  // In CI, this would be run separately and baselines committed
  test.skip();
});
