const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Checking timeline state...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    await page.screenshot({ path: 'timeline-current-state.png', fullPage: true });
    console.log('✓ Saved timeline-current-state.png');

    await page.locator('.timeline-border-container').screenshot({ path: 'timeline-markers.png' });
    console.log('✓ Saved timeline-markers.png');

    await browser.close();
})();
