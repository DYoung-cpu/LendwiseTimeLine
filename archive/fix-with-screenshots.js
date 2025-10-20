const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Loading page...');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    // Measure current positions
    const before = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const btn = document.querySelector('.new-filter-btn');
        const filterSections = document.getElementById('filter-sections');
        const borderContainer = document.querySelector('.timeline-border-container');

        const style = window.getComputedStyle(container);
        const containerRect = container.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();

        // Get SVG section position (first path in filter-sections)
        let svgSectionRect = null;
        if (filterSections && filterSections.children.length > 0) {
            svgSectionRect = filterSections.children[0].getBoundingClientRect();
        }

        return {
            cssTop: style.top,
            containerTop: containerRect.top,
            borderTop: borderRect.top,
            svgSectionTop: svgSectionRect ? svgSectionRect.top : null,
            offsetFromBorder: containerRect.top - borderRect.top,
            svgOffsetFromBorder: svgSectionRect ? svgSectionRect.top - borderRect.top : null
        };
    });

    console.log('\n=== BEFORE STATE ===');
    console.log('CSS top:', before.cssTop);
    console.log('Container offset from border:', before.offsetFromBorder.toFixed(2), 'px');
    console.log('SVG section offset from border:', before.svgOffsetFromBorder?.toFixed(2), 'px');
    console.log('Difference:', (before.offsetFromBorder - (before.svgOffsetFromBorder || 0)).toFixed(2), 'px');

    // Take BEFORE screenshots
    const filterButton = await page.$('.new-filter-container');
    await filterButton.screenshot({ path: 'before-collapsed.png' });
    console.log('✓ Saved before-collapsed.png');

    // Click to expand
    await page.click('.new-filter-btn');
    await page.waitForTimeout(1000);
    await filterButton.screenshot({ path: 'before-expanded.png' });
    console.log('✓ Saved before-expanded.png');

    // Click to collapse
    await page.click('.new-filter-btn');
    await page.waitForTimeout(1000);

    // Calculate the fix
    const svgContainerY = 24; // From JavaScript
    const currentCSSTop = parseFloat(before.cssTop);
    const correctCSSTop = svgContainerY;

    console.log('\n=== CALCULATING FIX ===');
    console.log('SVG containerY:', svgContainerY, 'px');
    console.log('Current CSS top:', currentCSSTop, 'px');
    console.log('Should be:', correctCSSTop, 'px');
    console.log('Adjustment needed:', (correctCSSTop - currentCSSTop), 'px');

    // Apply the fix
    await page.evaluate((newTop) => {
        const container = document.querySelector('.new-filter-container');
        container.style.top = `${newTop}px`;
    }, correctCSSTop);

    await page.waitForTimeout(500);

    // Verify fix
    const after = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const filterSections = document.getElementById('filter-sections');
        const borderContainer = document.querySelector('.timeline-border-container');

        const style = window.getComputedStyle(container);
        const containerRect = container.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();

        let svgSectionRect = null;
        if (filterSections && filterSections.children.length > 0) {
            svgSectionRect = filterSections.children[0].getBoundingClientRect();
        }

        return {
            cssTop: style.top,
            containerTop: containerRect.top,
            svgSectionTop: svgSectionRect ? svgSectionRect.top : null,
            difference: svgSectionRect ? Math.abs(containerRect.top - svgSectionRect.top) : null,
            aligned: svgSectionRect ? Math.abs(containerRect.top - svgSectionRect.top) < 2 : false
        };
    });

    console.log('\n=== AFTER STATE ===');
    console.log('CSS top:', after.cssTop);
    console.log('Container top:', after.containerTop.toFixed(2));
    console.log('SVG section top:', after.svgSectionTop?.toFixed(2));
    console.log('Difference:', after.difference?.toFixed(2), 'px');
    console.log('Status:', after.aligned ? '✓ ALIGNED' : '✗ NOT ALIGNED');

    // Take AFTER screenshots
    await filterButton.screenshot({ path: 'after-collapsed.png' });
    console.log('✓ Saved after-collapsed.png');

    await page.click('.new-filter-btn');
    await page.waitForTimeout(1000);
    await filterButton.screenshot({ path: 'after-expanded.png' });
    console.log('✓ Saved after-expanded.png');

    if (after.aligned) {
        console.log('\n✓✓✓ SUCCESS! ✓✓✓');
        console.log(`\nApply this fix to CSS files:`);
        console.log(`Change: top: ${before.cssTop};`);
        console.log(`To:     top: ${correctCSSTop}px;`);
        console.log(`\nCheck the screenshot files to visually confirm.`);
    } else {
        console.log('\n✗ Still misaligned by', after.difference?.toFixed(2), 'px');
    }

    console.log('\nBrowser will stay open for 30 seconds for visual inspection...');
    await page.waitForTimeout(30000);

    await browser.close();
})();
