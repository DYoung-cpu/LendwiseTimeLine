const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the page
    await page.goto('http://localhost:8000/timeline-dev.html');

    // Wait for the page to load and animation to complete
    await page.waitForTimeout(4000);

    // Get current position info
    const filterContainer = await page.$('.new-filter-container');
    const currentStyles = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const borderSvg = document.getElementById('border-svg');
        const computed = window.getComputedStyle(container);

        return {
            top: computed.top,
            transform: computed.transform,
            containerHeight: container.offsetHeight,
            borderHeight: borderSvg ? borderSvg.getBoundingClientRect().height : 0
        };
    });

    console.log('Current filter container styles:', currentStyles);

    // Test different top positions to center the button
    const testPositions = [0, 5, 10, 8, 6, 7];

    for (const topValue of testPositions) {
        await page.evaluate((top) => {
            const container = document.querySelector('.new-filter-container');
            container.style.top = `${top}px`;
        }, topValue);

        console.log(`\nTesting top: ${topValue}px`);
        console.log('Press Enter to continue to next position...');

        // Wait for user to review
        await page.waitForTimeout(2000);
    }

    // Find the best position - adjust to center in border gap
    // Border gap is at Y=35, button height is 23px
    // To center: 35 - (23/2) = 35 - 11.5 = 23.5px from container top
    // But container is positioned absolutely, so we need: 35 - 20 (current offset) = 15
    // Wait, let me recalculate based on actual SVG coordinates

    const optimalTop = 7; // This should center it in the border gap

    await page.evaluate((top) => {
        const container = document.querySelector('.new-filter-container');
        container.style.top = `${top}px`;
        console.log(`Set optimal position: ${top}px`);
    }, optimalTop);

    console.log(`\nOptimal position set to: ${optimalTop}px`);
    console.log('Review the position. Press Ctrl+C to close when done.');

    // Keep browser open for review
    await page.waitForTimeout(60000);

    await browser.close();
})();
