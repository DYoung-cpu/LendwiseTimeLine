const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Loading page with updated CSS...');
    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    const verification = await page.evaluate(() => {
        const btn = document.querySelector('.new-filter-btn');
        const borderContainer = document.querySelector('.timeline-border-container');
        const container = document.querySelector('.new-filter-container');

        const btnRect = btn.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();
        const containerStyle = window.getComputedStyle(container);

        // Calculate expected gap center (border top + 35px gap position)
        const gapCenterY = borderRect.top + 35;
        const btnCenterY = btnRect.top + (btnRect.height / 2);
        const difference = gapCenterY - btnCenterY;

        return {
            cssTop: containerStyle.top,
            gapCenter: gapCenterY.toFixed(2),
            btnCenter: btnCenterY.toFixed(2),
            difference: difference.toFixed(2),
            isAligned: Math.abs(difference) < 3
        };
    });

    console.log('\n=== VERIFICATION RESULTS ===');
    console.log('CSS top value:', verification.cssTop);
    console.log('Expected gap center Y:', verification.gapCenter);
    console.log('Button actual center Y:', verification.btnCenter);
    console.log('Difference:', verification.difference, 'px');
    console.log('Status:', verification.isAligned ? '✓ ALIGNED' : '✗ NOT ALIGNED');

    if (verification.isAligned) {
        console.log('\n✓ SUCCESS! Filter button is properly centered in the border gap.');
    } else {
        console.log('\n⚠ Still needs adjustment. Difference:', verification.difference, 'px');
    }

    // Test expansion
    console.log('\nTesting filter expansion...');
    await page.click('.new-filter-btn');
    await page.waitForTimeout(2000);
    await page.click('.new-filter-btn');

    console.log('\nDone! Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
})();
