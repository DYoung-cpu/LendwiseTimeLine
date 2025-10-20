const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    const visibility = await page.evaluate(() => {
        const left = document.getElementById('filter-options-left');
        const right = document.getElementById('filter-options-right');

        return {
            leftClasses: left ? left.className : null,
            leftStyle: left ? {
                opacity: getComputedStyle(left).opacity,
                visibility: getComputedStyle(left).visibility,
                display: getComputedStyle(left).display
            } : null,
            rightClasses: right ? right.className : null,
            rightStyle: right ? {
                opacity: getComputedStyle(right).opacity,
                visibility: getComputedStyle(right).visibility,
                display: getComputedStyle(right).display
            } : null,
            hasVisibleClass: {
                left: left ? left.classList.contains('visible') : false,
                right: right ? right.classList.contains('visible') : false
            }
        };
    });

    console.log('=== FILTER OPTIONS VISIBILITY ===');
    console.log('\nLeft container:');
    console.log('  Classes:', visibility.leftClasses);
    console.log('  Has .visible:', visibility.hasVisibleClass.left);
    console.log('  Computed styles:', visibility.leftStyle);

    console.log('\nRight container:');
    console.log('  Classes:', visibility.rightClasses);
    console.log('  Has .visible:', visibility.hasVisibleClass.right);
    console.log('  Computed styles:', visibility.rightStyle);

    await browser.close();
})();
