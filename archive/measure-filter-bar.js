const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('http://localhost:8080/timeline-dev.html');
    await page.waitForTimeout(4000); // Wait for intro animation

    // Click filter to expand it
    await page.click('.filter-trigger');
    await page.waitForTimeout(500); // Wait for expansion

    // Get measurements
    const measurements = await page.evaluate(() => {
        const filterBar = document.querySelector('.filter-bar');
        const filterContainer = document.querySelector('.filter-container');
        const filterRect = filterBar.getBoundingClientRect();
        const containerRect = filterContainer.getBoundingClientRect();

        // Get page center (viewport center)
        const pageCenter = window.innerWidth / 2;

        // Get filter bar center
        const filterBarCenter = filterRect.left + (filterRect.width / 2);

        // Get current container position
        const containerLeft = containerRect.left;

        return {
            filterBarWidth: filterRect.width,
            filterBarLeft: filterRect.left,
            filterBarCenter: filterBarCenter,
            pageCenter: pageCenter,
            offsetFromCenter: filterBarCenter - pageCenter,
            containerLeft: containerLeft,
            containerWidth: containerRect.width
        };
    });

    console.log('\n=== EXPANDED FILTER BAR MEASUREMENTS ===\n');
    console.log('Page center (viewport):', measurements.pageCenter.toFixed(2), 'px');
    console.log('Expanded filter bar width:', measurements.filterBarWidth.toFixed(2), 'px');
    console.log('Expanded filter bar left edge:', measurements.filterBarLeft.toFixed(2), 'px');
    console.log('Expanded filter bar center:', measurements.filterBarCenter.toFixed(2), 'px');
    console.log('Offset from page center:', measurements.offsetFromCenter.toFixed(2), 'px');
    console.log('\nContainer left position:', measurements.containerLeft.toFixed(2), 'px');

    // Calculate how much we need to shift RIGHT to center the expanded bar
    const shiftNeeded = -measurements.offsetFromCenter;
    console.log('\n=== CENTERING CALCULATION ===\n');
    console.log('Shift needed to center expanded bar:', shiftNeeded.toFixed(2), 'px');
    console.log('Current collapsed translateX: -271.84px');
    console.log('New expanded translateX should be:', (-271.84 + shiftNeeded).toFixed(2), 'px');

    await page.waitForTimeout(2000);
    await browser.close();
})();
