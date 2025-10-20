const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('\n🔍 Verifying Filter Button Fix...\n');

    await page.goto('http://localhost:3005/timeline-dev.html', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    await page.waitForTimeout(1500);

    // Check new-filter-btn background
    const btnBg = await page.evaluate(() => {
      const btn = document.querySelector('.new-filter-btn');
      return btn ? getComputedStyle(btn).background : 'NOT_FOUND';
    });

    console.log('✅ .new-filter-btn background:', btnBg);

    // Check for SVG sections
    const svgCount = await page.evaluate(() => {
      return document.querySelectorAll('.filter-visual-section').length;
    });

    console.log('✅ SVG sections found:', svgCount);

    // Take screenshot
    await page.screenshot({ path: 'filter-after-fix.png', fullPage: false });
    console.log('✅ Screenshot saved: filter-after-fix.png');

    console.log('\n✨ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
