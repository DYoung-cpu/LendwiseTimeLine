const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3005/timeline-dev.html', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'filter-buttons-before-fix.png', fullPage: false });
    console.log('✅ Screenshot saved');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
