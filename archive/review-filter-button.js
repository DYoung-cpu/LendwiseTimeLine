const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 200 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Reviewing filter button state...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    // Check if filter button exists and its state
    const analysis = await page.evaluate(() => {
        const filterContainer = document.querySelector('.new-filter-container');
        const filterSections = document.getElementById('filter-sections');
        const filterBorder = document.getElementById('filter-border');
        const borderPath = document.getElementById('border-path');
        const borderContainer = document.querySelector('.timeline-border-container');

        const filterRect = filterContainer?.getBoundingClientRect();
        const borderRect = borderContainer?.getBoundingClientRect();

        return {
            filterExists: !!filterContainer,
            filterVisible: filterContainer ? window.getComputedStyle(filterContainer).display !== 'none' : false,
            filterOpacity: filterContainer ? window.getComputedStyle(filterContainer).opacity : 'N/A',
            filterTop: filterContainer ? window.getComputedStyle(filterContainer).top : 'N/A',
            filterPosition: filterRect ? {
                top: filterRect.top,
                left: filterRect.left,
                width: filterRect.width,
                height: filterRect.height
            } : null,
            filterSectionsExists: !!filterSections,
            filterBorderExists: !!filterBorder,
            borderPathD: borderPath?.getAttribute('d')?.substring(0, 150),
            borderTop: borderRect?.top,
            svgChildCount: filterSections?.children.length || 0
        };
    });

    console.log('=== FILTER BUTTON STATE ===');
    console.log('Filter container exists:', analysis.filterExists);
    console.log('Filter visible:', analysis.filterVisible);
    console.log('Filter opacity:', analysis.filterOpacity);
    console.log('Filter top CSS:', analysis.filterTop);
    console.log('\n=== FILTER POSITION ===');
    console.log('Position:', analysis.filterPosition);
    console.log('\n=== SVG ELEMENTS ===');
    console.log('Filter sections exists:', analysis.filterSectionsExists);
    console.log('Filter border exists:', analysis.filterBorderExists);
    console.log('SVG children count:', analysis.svgChildCount);
    console.log('\n=== BORDER PATH (first 150 chars) ===');
    console.log(analysis.borderPathD);

    // Take screenshot
    await page.screenshot({ path: 'filter-review.png', fullPage: false });
    console.log('\n✓ Saved filter-review.png');

    // Also screenshot just the border container
    await page.locator('.timeline-border-container').screenshot({ path: 'border-container-review.png' });
    console.log('✓ Saved border-container-review.png');

    console.log('\nBrowser will stay open for 30 seconds for review.');
    await page.waitForTimeout(30000);
    await browser.close();
})();
