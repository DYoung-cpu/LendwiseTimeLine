const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });

    console.log('=== FILTER BUTTON DIAGNOSTIC ===\n');
    console.log('Waiting 5 seconds for animations...');
    await page.waitForTimeout(5000);

    const analysis = await page.evaluate(() => {
        const filterContainer = document.querySelector('.new-filter-container');
        const borderContainer = document.querySelector('.timeline-border-container');
        const mainBtn = document.getElementById('main-filter-btn');

        if (!filterContainer) return { error: 'Filter container not found in DOM' };
        if (!borderContainer) return { error: 'Border container not found in DOM' };

        const filterStyles = window.getComputedStyle(filterContainer);
        const borderStyles = window.getComputedStyle(borderContainer);
        const filterRect = filterContainer.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();

        // Check what elements are at the filter button's position
        const centerX = filterRect.left + (filterRect.width / 2);
        const centerY = filterRect.top + (filterRect.height / 2);
        const elementAtPosition = document.elementFromPoint(centerX, centerY);

        return {
            filterContainer: {
                exists: true,
                display: filterStyles.display,
                opacity: filterStyles.opacity,
                visibility: filterStyles.visibility,
                zIndex: filterStyles.zIndex,
                top: filterStyles.top,
                left: filterStyles.left,
                position: filterStyles.position,
                animation: filterStyles.animation,
                rect: {
                    top: filterRect.top,
                    left: filterRect.left,
                    width: filterRect.width,
                    height: filterRect.height,
                    bottom: filterRect.bottom
                }
            },
            borderContainer: {
                overflow: borderStyles.overflow,
                overflowX: borderStyles.overflowX,
                overflowY: borderStyles.overflowY,
                position: borderStyles.position,
                rect: {
                    top: borderRect.top,
                    left: borderRect.left,
                    width: borderRect.width,
                    height: borderRect.height
                }
            },
            elementAtCenter: {
                tagName: elementAtPosition?.tagName,
                className: elementAtPosition?.className,
                id: elementAtPosition?.id,
                isFilterButton: elementAtPosition?.id === 'main-filter-btn' || elementAtPosition?.classList.contains('new-filter-container')
            },
            isFilterAboveViewport: filterRect.bottom < 0,
            isFilterBelowViewport: filterRect.top > window.innerHeight,
            isFilterLeftOfViewport: filterRect.right < 0,
            isFilterRightOfViewport: filterRect.left > window.innerWidth
        };
    });

    if (analysis.error) {
        console.log(`❌ ERROR: ${analysis.error}`);
        await browser.close();
        return;
    }

    console.log('\n=== FILTER CONTAINER ===');
    console.log(`  Exists: ${analysis.filterContainer.exists}`);
    console.log(`  Display: ${analysis.filterContainer.display}`);
    console.log(`  Opacity: ${analysis.filterContainer.opacity}`);
    console.log(`  Visibility: ${analysis.filterContainer.visibility}`);
    console.log(`  Z-Index: ${analysis.filterContainer.zIndex}`);
    console.log(`  Position: ${analysis.filterContainer.position}`);
    console.log(`  Top: ${analysis.filterContainer.top}`);
    console.log(`  Left: ${analysis.filterContainer.left}`);
    console.log(`  Animation: ${analysis.filterContainer.animation}`);

    console.log('\n=== FILTER POSITION ===');
    console.log(`  Top: ${analysis.filterContainer.rect.top}px`);
    console.log(`  Left: ${analysis.filterContainer.rect.left}px`);
    console.log(`  Width: ${analysis.filterContainer.rect.width}px`);
    console.log(`  Height: ${analysis.filterContainer.rect.height}px`);
    console.log(`  Bottom: ${analysis.filterContainer.rect.bottom}px`);

    console.log('\n=== BORDER CONTAINER ===');
    console.log(`  Overflow: ${analysis.borderContainer.overflow}`);
    console.log(`  Overflow-X: ${analysis.borderContainer.overflowX}`);
    console.log(`  Overflow-Y: ${analysis.borderContainer.overflowY}`);
    console.log(`  Position: ${analysis.borderContainer.position}`);
    console.log(`  Top: ${analysis.borderContainer.rect.top}px`);

    console.log('\n=== VISIBILITY CHECKS ===');
    console.log(`  Above viewport: ${analysis.isFilterAboveViewport}`);
    console.log(`  Below viewport: ${analysis.isFilterBelowViewport}`);
    console.log(`  Left of viewport: ${analysis.isFilterLeftOfViewport}`);
    console.log(`  Right of viewport: ${analysis.isFilterRightOfViewport}`);

    console.log('\n=== ELEMENT AT FILTER CENTER ===');
    console.log(`  Tag: ${analysis.elementAtCenter.tagName}`);
    console.log(`  Class: ${analysis.elementAtCenter.className}`);
    console.log(`  ID: ${analysis.elementAtCenter.id}`);
    console.log(`  Is Filter Button: ${analysis.elementAtCenter.isFilterButton}`);

    // Diagnosis
    console.log('\n=== DIAGNOSIS ===');
    if (analysis.filterContainer.opacity === '0') {
        console.log('❌ PROBLEM: Filter opacity is 0 (invisible)');
        console.log('   Animation may not have completed or CSS is overriding it');
    }
    if (analysis.filterContainer.display === 'none') {
        console.log('❌ PROBLEM: Filter display is none (hidden)');
    }
    if (analysis.filterContainer.visibility === 'hidden') {
        console.log('❌ PROBLEM: Filter visibility is hidden');
    }
    if (analysis.borderContainer.overflow === 'hidden') {
        console.log('⚠️  WARNING: Border container has overflow:hidden');
        console.log('   This may clip the filter button if it extends outside');
    }
    if (analysis.isFilterAboveViewport) {
        console.log('❌ PROBLEM: Filter is positioned above the viewport');
    }
    if (!analysis.elementAtCenter.isFilterButton) {
        console.log('⚠️  WARNING: Filter button is not the top element at its position');
        console.log(`   Element blocking it: ${analysis.elementAtCenter.tagName}.${analysis.elementAtCenter.className}`);
    }

    if (analysis.filterContainer.opacity === '1' &&
        analysis.filterContainer.display !== 'none' &&
        analysis.filterContainer.visibility !== 'hidden' &&
        !analysis.isFilterAboveViewport &&
        analysis.elementAtCenter.isFilterButton) {
        console.log('✅ Filter button should be visible!');
    } else {
        console.log('❌ Filter button has visibility issues');
    }

    await browser.close();
})();
