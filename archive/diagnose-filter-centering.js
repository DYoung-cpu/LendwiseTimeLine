const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('http://localhost:8080/timeline-dev.html');
    await page.waitForTimeout(4000); // Wait for intro animation

    console.log('\n=== BEFORE EXPANSION (COLLAPSED) ===\n');

    let beforeMeasurements = await page.evaluate(() => {
        const filterBar = document.querySelector('.filter-bar');
        const filterContainer = document.querySelector('.filter-container');
        const buttonStackWrapper = document.querySelector('.button-stack-wrapper');

        const filterBarRect = filterBar.getBoundingClientRect();
        const containerRect = filterContainer.getBoundingClientRect();
        const wrapperRect = buttonStackWrapper ? buttonStackWrapper.getBoundingClientRect() : null;

        const viewportCenter = window.innerWidth / 2;

        return {
            viewportCenter,
            filterBarWidth: filterBarRect.width,
            filterBarLeft: filterBarRect.left,
            filterBarCenter: filterBarRect.left + (filterBarRect.width / 2),
            containerTransform: window.getComputedStyle(filterContainer).transform,
            wrapperTransform: buttonStackWrapper ? window.getComputedStyle(buttonStackWrapper).transform : null
        };
    });

    console.log('Viewport center:', beforeMeasurements.viewportCenter.toFixed(2), 'px');
    console.log('Filter bar (collapsed) width:', beforeMeasurements.filterBarWidth.toFixed(2), 'px');
    console.log('Filter bar (collapsed) center:', beforeMeasurements.filterBarCenter.toFixed(2), 'px');
    console.log('Container transform:', beforeMeasurements.containerTransform);
    console.log('Wrapper transform:', beforeMeasurements.wrapperTransform);

    // Click filter to expand it
    await page.click('.filter-trigger');
    await page.waitForTimeout(500); // Wait for expansion animation

    console.log('\n=== AFTER EXPANSION ===\n');

    let afterMeasurements = await page.evaluate(() => {
        const filterBar = document.querySelector('.filter-bar');
        const filterContainer = document.querySelector('.filter-container');
        const buttonStackWrapper = document.querySelector('.button-stack-wrapper');

        const filterBarRect = filterBar.getBoundingClientRect();
        const containerRect = filterContainer.getBoundingClientRect();

        const viewportCenter = window.innerWidth / 2;
        const filterBarCenter = filterBarRect.left + (filterBarRect.width / 2);
        const offsetFromCenter = filterBarCenter - viewportCenter;

        return {
            viewportCenter,
            filterBarWidth: filterBarRect.width,
            filterBarLeft: filterBarRect.left,
            filterBarRight: filterBarRect.right,
            filterBarCenter: filterBarCenter,
            containerLeft: containerRect.left,
            offsetFromCenter: offsetFromCenter,
            containerTransform: window.getComputedStyle(filterContainer).transform,
            wrapperTransform: buttonStackWrapper ? window.getComputedStyle(buttonStackWrapper).transform : null
        };
    });

    console.log('Viewport center:', afterMeasurements.viewportCenter.toFixed(2), 'px');
    console.log('Expanded filter bar width:', afterMeasurements.filterBarWidth.toFixed(2), 'px');
    console.log('Expanded filter bar left:', afterMeasurements.filterBarLeft.toFixed(2), 'px');
    console.log('Expanded filter bar right:', afterMeasurements.filterBarRight.toFixed(2), 'px');
    console.log('Expanded filter bar center:', afterMeasurements.filterBarCenter.toFixed(2), 'px');
    console.log('Container transform:', afterMeasurements.containerTransform);
    console.log('Wrapper transform:', afterMeasurements.wrapperTransform);
    console.log('\nOffset from viewport center:', afterMeasurements.offsetFromCenter.toFixed(2), 'px');

    if (afterMeasurements.offsetFromCenter < 0) {
        console.log('Filter bar is', Math.abs(afterMeasurements.offsetFromCenter).toFixed(2), 'px LEFT of center');
        console.log('Need to shift RIGHT by', Math.abs(afterMeasurements.offsetFromCenter).toFixed(2), 'px');
    } else {
        console.log('Filter bar is', afterMeasurements.offsetFromCenter.toFixed(2), 'px RIGHT of center');
        console.log('Need to shift LEFT by', afterMeasurements.offsetFromCenter.toFixed(2), 'px');
    }

    // Extract current translateX value from transform matrix
    const match = afterMeasurements.containerTransform.match(/matrix\(([^)]+)\)/);
    if (match) {
        const values = match[1].split(',').map(v => parseFloat(v.trim()));
        const currentTranslateX = values[4] || 0;
        console.log('\nCurrent translateX (from matrix):', currentTranslateX.toFixed(2), 'px');

        const correctionNeeded = -afterMeasurements.offsetFromCenter;
        const newTranslateX = currentTranslateX + correctionNeeded;
        console.log('Correction needed:', correctionNeeded.toFixed(2), 'px');
        console.log('New translateX should be:', newTranslateX.toFixed(2), 'px');
    }

    await page.waitForTimeout(3000);
    await browser.close();
})();
