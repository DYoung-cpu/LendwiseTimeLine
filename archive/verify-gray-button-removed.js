const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    const check = await page.evaluate(() => {
        const filterBorder = document.getElementById('filter-border');
        return {
            exists: !!filterBorder,
            visible: filterBorder ? filterBorder.getAttribute('d') !== '' : false,
            hasStroke: filterBorder ? getComputedStyle(filterBorder).stroke : null
        };
    });

    console.log('=== GRAY BUTTON CHECK ===');
    console.log('filter-border element exists:', check.exists ? 'YES ❌' : 'NO ✅');
    console.log('filter-border is visible:', check.visible ? 'YES ❌' : 'NO ✅');
    console.log('filter-border stroke:', check.hasStroke);

    if (!check.exists) {
        console.log('\n✅ SUCCESS: Gray button removed!');
    } else if (!check.visible) {
        console.log('\n✅ SUCCESS: Gray button hidden (no path drawn)');
    } else {
        console.log('\n❌ FAILED: Gray button still visible');
    }

    await page.screenshot({ path: 'no-gray-button.png', fullPage: false });
    console.log('\nScreenshot saved: no-gray-button.png');

    await browser.close();
})();
