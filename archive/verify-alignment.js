const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Loading page...');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000); // Wait for animations

    // Check alignment
    const result = await page.evaluate(() => {
        const btn = document.querySelector('.new-filter-btn');
        const container = document.querySelector('.new-filter-container');
        const borderContainer = document.querySelector('.timeline-border-container');

        // Get positions
        const btnRect = btn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();

        // Get CSS values
        const containerStyle = window.getComputedStyle(container);

        // Border gap is at Y=35 from border container top
        const gapCenterY = borderRect.top + 35;

        // SVG sections are drawn at containerY (should be 24 now)
        const svgSectionY = 24;
        const svgSectionCenterY = borderRect.top + svgSectionY + 11.5; // 11.5 = 23px height / 2

        // Button center
        const btnCenterY = btnRect.top + (btnRect.height / 2);

        // Container top position
        const containerTopY = containerRect.top;
        const svgBackgroundTopY = borderRect.top + svgSectionY;

        return {
            cssTop: containerStyle.top,
            borderTop: borderRect.top,
            gapCenter: gapCenterY,
            svgSectionTop: svgBackgroundTopY,
            svgSectionCenter: svgSectionCenterY,
            containerTop: containerTopY,
            buttonCenter: btnCenterY,
            buttonTop: btnRect.top,
            buttonHeight: btnRect.height,
            alignmentDiff: Math.abs(containerTopY - svgBackgroundTopY),
            gapAlignmentDiff: Math.abs(svgSectionCenterY - gapCenterY),
            isAligned: Math.abs(containerTopY - svgBackgroundTopY) < 3
        };
    });

    console.log('\n=== ALIGNMENT CHECK ===');
    console.log('CSS top:', result.cssTop);
    console.log('\nBorder container top:', result.borderTop.toFixed(2));
    console.log('Gap center Y:', result.gapCenter.toFixed(2));
    console.log('\nSVG background top:', result.svgSectionTop.toFixed(2));
    console.log('SVG background center:', result.svgSectionCenter.toFixed(2));
    console.log('\nHTML container top:', result.containerTop.toFixed(2));
    console.log('Button top:', result.buttonTop.toFixed(2));
    console.log('Button center:', result.buttonCenter.toFixed(2));
    console.log('Button height:', result.buttonHeight);
    console.log('\n--- Alignment Analysis ---');
    console.log('HTML/SVG alignment diff:', result.alignmentDiff.toFixed(2), 'px');
    console.log('SVG/Gap alignment diff:', result.gapAlignmentDiff.toFixed(2), 'px');
    console.log('\nStatus:', result.isAligned ? '✓ ALIGNED' : '✗ MISALIGNED');

    if (result.isAligned) {
        console.log('\n✓ SUCCESS! Filter button and SVG background are aligned!');
    } else {
        console.log('\n⚠ HTML container and SVG background are', result.alignmentDiff.toFixed(2), 'px apart');
    }

    // Test expansion
    console.log('\n\nTesting filter expansion in 3 seconds...');
    await page.waitForTimeout(3000);

    await page.click('.new-filter-btn');
    console.log('Filter expanded! Check alignment...');
    await page.waitForTimeout(3000);

    await page.click('.new-filter-btn');
    console.log('Filter collapsed.');

    console.log('\nKeeping browser open for visual inspection...');
    console.log('Press Ctrl+C to close when done.');

    await page.waitForTimeout(120000);
    await browser.close();
})();
