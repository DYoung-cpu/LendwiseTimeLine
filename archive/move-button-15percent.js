const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Loading page...');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    // Get current state
    const before = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const borderContainer = document.querySelector('.timeline-border-container');
        const style = window.getComputedStyle(container);

        const containerRect = container.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();

        return {
            cssTop: parseFloat(style.top),
            borderHeight: borderRect.height,
            currentPosition: containerRect.top,
            borderTop: borderRect.top
        };
    });

    console.log('\n=== BEFORE ===');
    console.log('CSS top:', before.cssTop, 'px');
    console.log('Border container height:', before.borderHeight, 'px');

    // Calculate 15% movement (of border container height)
    const moveAmount = before.borderHeight * 0.15;
    const newTop = before.cssTop + moveAmount;

    console.log('\n=== CALCULATION ===');
    console.log('15% of border height:', moveAmount.toFixed(2), 'px');
    console.log('Current CSS top:', before.cssTop, 'px');
    console.log('New CSS top:', newTop.toFixed(2), 'px');
    console.log('Total movement:', moveAmount.toFixed(2), 'px DOWN');

    // Screenshot before
    await page.locator('.new-filter-container').screenshot({ path: 'move-before.png' });
    console.log('\n✓ Saved move-before.png');

    // Apply the change
    await page.evaluate((top) => {
        const container = document.querySelector('.new-filter-container');
        container.style.top = `${top}px`;
    }, newTop);

    await page.waitForTimeout(500);

    // Screenshot after
    await page.locator('.timeline-border-container').screenshot({ path: 'move-after-full.png' });
    await page.locator('.new-filter-container').screenshot({ path: 'move-after.png' });
    console.log('✓ Saved move-after.png');

    // Test expansion
    console.log('\nTesting expanded state...');
    await page.click('.new-filter-btn');
    await page.waitForTimeout(1000);
    await page.locator('.timeline-border-container').screenshot({ path: 'move-after-expanded.png' });
    console.log('✓ Saved move-after-expanded.png');

    // Get final position
    const after = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const style = window.getComputedStyle(container);
        return {
            cssTop: style.top
        };
    });

    console.log('\n=== AFTER ===');
    console.log('New CSS top:', after.cssTop);

    console.log('\n✓✓✓ PREVIEW COMPLETE ✓✓✓');
    console.log('\nTo apply this fix:');
    console.log('1. timeline-dev.css - Change: top: 18px;  To: top:', Math.round(newTop), 'px;');
    console.log('2. timeline-clean-test.css - Change: top: 24px;  To: top:', Math.round(newTop), 'px;');

    console.log('\nBrowser will stay open for 30 seconds. Review the screenshots and visual result.');
    await page.waitForTimeout(30000);

    await browser.close();
})();
