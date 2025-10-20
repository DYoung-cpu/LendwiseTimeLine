const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    console.log('=== ANALYZING PROBLEM ===\n');

    const analysis = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const borderContainer = document.querySelector('.timeline-border-container');
        const filterSections = document.getElementById('filter-sections');

        const style = window.getComputedStyle(container);
        const htmlRect = container.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();

        let svgRect = null;
        if (filterSections && filterSections.children.length > 0) {
            svgRect = filterSections.children[0].getBoundingClientRect();
        }

        return {
            htmlTop: htmlRect.top,
            svgTop: svgRect?.top,
            borderTop: borderRect.top,
            htmlOffset: htmlRect.top - borderRect.top,
            svgOffset: svgRect ? svgRect.top - borderRect.top : null,
            gap: (htmlRect.top - borderRect.top) - (svgRect?.top - borderRect.top),
            cssTop: style.top
        };
    });

    console.log('CSS top:', analysis.cssTop);
    console.log('HTML offset from border:', analysis.htmlOffset.toFixed(2), 'px');
    console.log('SVG offset from border:', analysis.svgOffset?.toFixed(2), 'px');
    console.log('Gap between them:', analysis.gap?.toFixed(2), 'px');
    console.log('\nThe SVG is', analysis.gap?.toFixed(2), 'px ABOVE the HTML text');

    // The fix: Move SVG down by the gap amount
    const adjustment = Math.round(analysis.gap);
    console.log('\n=== APPLYING FIX ===');
    console.log('Need to increase SVG containerY by:', adjustment, 'px\n');

    // Take before screenshot
    await page.locator('.new-filter-container').screenshot({ path: 'fix-before.png' });
    console.log('✓ Saved fix-before.png');

    // Apply the fix via JavaScript injection
    await page.evaluate((adj) => {
        // Update the createFilterSections function
        window.fixedContainerY = 24 + adj;
        console.log('New containerY will be:', window.fixedContainerY);

        // We need to modify and re-run the functions
        // Find the script or modify the DOM
        // Since we can't easily modify the function, let's manually redraw

        const borderContainer = document.querySelector('.timeline-border-container');
        const filterSections = document.getElementById('filter-sections');
        const filterBorder = document.getElementById('filter-border');

        const width = borderContainer.offsetWidth;
        const centerX = width / 2;
        const containerHeight = 23;
        const containerRadius = 8;
        const containerY = 24 + adj; // FIXED VALUE
        const containerWidth = 110;
        const containerLeft = centerX - (containerWidth / 2);
        const containerRight = centerX + (containerWidth / 2);

        // Clear and redraw sections
        filterSections.innerHTML = '';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `
            M ${containerLeft + containerRadius} ${containerY}
            L ${containerRight - containerRadius} ${containerY}
            Q ${containerRight} ${containerY} ${containerRight} ${containerY + containerRadius}
            Q ${containerRight} ${containerY + containerHeight} ${containerRight - containerRadius} ${containerY + containerHeight}
            L ${containerLeft + containerRadius} ${containerY + containerHeight}
            Q ${containerLeft} ${containerY + containerHeight} ${containerLeft} ${containerY + containerRadius}
            Q ${containerLeft} ${containerY} ${containerLeft + containerRadius} ${containerY}
            Z
        `.trim().replace(/\s+/g, ' '));
        path.setAttribute('fill', 'url(#filterGradient)');
        path.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
        path.setAttribute('stroke-width', '1');
        filterSections.appendChild(path);

        // Redraw border
        const borderPath = `
            M ${containerLeft + containerRadius} ${containerY}
            L ${containerRight - containerRadius} ${containerY}
            Q ${containerRight} ${containerY} ${containerRight} ${containerY + containerRadius}
            L ${containerRight} ${containerY + containerHeight - containerRadius}
            Q ${containerRight} ${containerY + containerHeight} ${containerRight - containerRadius} ${containerY + containerHeight}
            L ${containerLeft + containerRadius} ${containerY + containerHeight}
            Q ${containerLeft} ${containerY + containerHeight} ${containerLeft} ${containerY + containerHeight - containerRadius}
            L ${containerLeft} ${containerY + containerRadius}
            Q ${containerLeft} ${containerY} ${containerLeft + containerRadius} ${containerY}
        `.trim().replace(/\s+/g, ' ');
        filterBorder.setAttribute('d', borderPath);

    }, adjustment);

    await page.waitForTimeout(500);

    // Verify
    const verify = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const borderContainer = document.querySelector('.timeline-border-container');
        const filterSections = document.getElementById('filter-sections');

        const htmlRect = container.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();
        let svgRect = null;
        if (filterSections && filterSections.children.length > 0) {
            svgRect = filterSections.children[0].getBoundingClientRect();
        }

        const diff = Math.abs((htmlRect.top - borderRect.top) - (svgRect?.top - borderRect.top));

        return {
            htmlOffset: htmlRect.top - borderRect.top,
            svgOffset: svgRect?.top - borderRect.top,
            difference: diff,
            aligned: diff < 2
        };
    });

    console.log('\n=== VERIFICATION ===');
    console.log('HTML offset:', verify.htmlOffset.toFixed(2), 'px');
    console.log('SVG offset:', verify.svgOffset?.toFixed(2), 'px');
    console.log('Difference:', verify.difference.toFixed(2), 'px');
    console.log('Status:', verify.aligned ? '✓ ALIGNED!' : '✗ Still misaligned');

    // Take after screenshot
    await page.locator('.new-filter-container').screenshot({ path: 'fix-after.png' });
    console.log('✓ Saved fix-after.png');

    if (verify.aligned) {
        console.log('\n✓✓✓ SUCCESS! ✓✓✓');
        console.log(`\nApply this fix to timeline-dev.html:`);
        console.log(`\nIn createFilterSections function (line ~1830):`);
        console.log(`  Change: const containerY = 24;`);
        console.log(`  To:     const containerY = ${24 + adjustment};`);
        console.log(`\nIn createFilterBorder function (line ~1919):`);
        console.log(`  Change: const containerY = 24;`);
        console.log(`  To:     const containerY = ${24 + adjustment};`);
    }

    console.log('\nBrowser stays open for review. Press Ctrl+C to close.');
    await page.waitForTimeout(120000);
    await browser.close();
})();
