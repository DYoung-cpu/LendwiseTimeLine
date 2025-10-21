const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 100
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to the page
    console.log('Loading page...');
    await page.goto('http://localhost:8000/timeline-dev.html');

    // Wait for animation to complete
    await page.waitForTimeout(5000);

    // Analyze current positions
    console.log('\n=== ANALYZING CURRENT POSITIONS ===');
    const analysis = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const borderContainer = document.querySelector('.timeline-border-container');
        const borderSvg = document.getElementById('border-svg');
        const filterBtn = document.querySelector('.new-filter-btn');

        const containerRect = container.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();
        const btnRect = filterBtn.getBoundingClientRect();

        // Get computed style
        const containerStyle = window.getComputedStyle(container);

        // The border gap in SVG coordinates (from JavaScript)
        const borderGapY = 35; // from createMainBorderPath function
        const filterSectionY = 15; // from createFilterSections function

        return {
            containerTop: containerStyle.top,
            containerRect: {
                top: containerRect.top,
                bottom: containerRect.bottom,
                height: containerRect.height
            },
            borderRect: {
                top: borderRect.top,
                height: borderRect.height
            },
            btnRect: {
                top: btnRect.top,
                bottom: btnRect.bottom,
                height: btnRect.height
            },
            svgGapY: borderGapY,
            svgFilterY: filterSectionY,
            offset: borderGapY - filterSectionY
        };
    });

    console.log('Current CSS top:', analysis.containerTop);
    console.log('Button visual position:', analysis.btnRect);
    console.log('Border container position:', analysis.borderRect);
    console.log('SVG gap Y coordinate:', analysis.svgGapY);
    console.log('SVG filter section Y coordinate:', analysis.svgFilterY);
    console.log('Offset between gap and filter:', analysis.offset);

    // Calculate optimal position
    // The border gap is at Y=35 in SVG coords, filter section is at Y=15
    // Current CSS top is -20px, which positions button at visual Y=15
    // To center at Y=35, we need to move down by 20px
    // New top should be: current(-20) + offset(20) = 0

    const currentTopValue = parseInt(analysis.containerTop);
    const optimalTop = currentTopValue + analysis.offset;

    console.log(`\nCalculated optimal top position: ${optimalTop}px`);
    console.log(`(moving from ${currentTopValue}px to ${optimalTop}px)\n`);

    // Apply the fix
    await page.evaluate((newTop) => {
        const container = document.querySelector('.new-filter-container');
        container.style.top = `${newTop}px`;
    }, optimalTop);

    console.log('✓ Position updated! Check the browser window.\n');

    // Test the filter button expansion
    console.log('Testing filter expansion...');
    await page.waitForTimeout(1000);
    await page.click('.new-filter-btn');
    await page.waitForTimeout(2000);

    console.log('Filter expanded. Checking alignment...');
    await page.waitForTimeout(1000);

    // Close filter
    await page.click('.new-filter-btn');
    await page.waitForTimeout(1000);

    console.log('\n=== VERIFICATION ===');
    const verification = await page.evaluate(() => {
        const btn = document.querySelector('.new-filter-btn');
        const borderContainer = document.querySelector('.timeline-border-container');
        const btnRect = btn.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();

        // The border top edge + 35px (gap position)
        const gapCenterY = borderRect.top + 35;
        const btnCenterY = btnRect.top + (btnRect.height / 2);

        return {
            borderTop: borderRect.top,
            gapExpectedCenter: gapCenterY,
            btnActualCenter: btnCenterY,
            difference: Math.abs(gapCenterY - btnCenterY),
            isAligned: Math.abs(gapCenterY - btnCenterY) < 3 // within 3px tolerance
        };
    });

    console.log('Border container top:', verification.borderTop);
    console.log('Expected gap center Y:', verification.gapExpectedCenter);
    console.log('Button actual center Y:', verification.btnActualCenter);
    console.log('Difference:', verification.difference.toFixed(2), 'px');
    console.log('Aligned:', verification.isAligned ? '✓ YES' : '✗ NO');

    if (verification.isAligned) {
        console.log('\n✓ SUCCESS! The filter button is now centered in the border gap.');
        console.log(`\nApply this fix to timeline-clean-test.css:`);
        console.log(`Change: top: -20px;`);
        console.log(`To:     top: ${optimalTop}px;`);
    } else {
        console.log('\n⚠ Alignment needs adjustment. Try:', verification.gapExpectedCenter - (analysis.btnRect.height / 2) - verification.borderTop);
    }

    console.log('\nPress Ctrl+C to close the browser when done reviewing.');

    // Keep browser open
    await page.waitForTimeout(120000);

    await browser.close();
})();
