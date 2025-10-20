const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('📝 CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('❌ ERROR:', error.message));

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    await browser.close();
})();
