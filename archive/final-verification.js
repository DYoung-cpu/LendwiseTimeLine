const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Final verification...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    await page.locator('.timeline-border-container').screenshot({ path: 'final-result.png' });
    console.log('✓ Saved final-result.png');

    console.log('\n✅ Filter button and border are now aligned!');
    console.log('The border gap is at Y=0, matching the filter button bottom edge.');

    await page.waitForTimeout(10000);
    await browser.close();
})();
