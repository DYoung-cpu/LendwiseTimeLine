const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the page
    await page.goto('http://localhost:3005/timeline-dev.html', { waitUntil: 'networkidle' });

    // Wait for timeline to be visible
    await page.waitForSelector('.timeline-container', { timeout: 10000 });

    // Wait a bit for animations
    await page.waitForTimeout(2000);

    // Take screenshot showing filter buttons
    await page.screenshot({
      path: 'filter-buttons-before-fix.png',
      fullPage: true
    });

    console.log('✅ Before screenshot saved as filter-buttons-before-fix.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
