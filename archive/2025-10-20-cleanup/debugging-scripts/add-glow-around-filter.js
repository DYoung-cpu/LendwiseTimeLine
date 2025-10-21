const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 200 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Adding glow effect around filter button...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    // Analyze current state
    const analysis = await page.evaluate(() => {
        const borderPath = document.getElementById('border-path');
        const borderContainer = document.querySelector('.timeline-border-container');
        const filterSections = document.getElementById('filter-sections');

        const borderRect = borderContainer.getBoundingClientRect();
        const svgRect = filterSections?.children[0]?.getBoundingClientRect();

        return {
            borderPathD: borderPath?.getAttribute('d'),
            borderPathStroke: borderPath?.getAttribute('stroke'),
            borderPathStrokeWidth: borderPath?.getAttribute('stroke-width'),
            borderPathFilter: borderPath?.getAttribute('filter'),
            svgOffset: svgRect ? svgRect.top - borderRect.top : null,
            svgHeight: svgRect?.height,
            containerWidth: borderRect.width
        };
    });

    console.log('=== CURRENT BORDER STATE ===');
    console.log('Border glow effect:', analysis.borderPathFilter || 'none');
    console.log('Border stroke:', analysis.borderPathStroke);
    console.log('Border stroke width:', analysis.borderPathStrokeWidth);
    console.log('\n=== FILTER BUTTON POSITION ===');
    console.log('SVG offset from top:', analysis.svgOffset, 'px');
    console.log('SVG height:', analysis.svgHeight, 'px');

    // Screenshot before
    await page.locator('.timeline-border-container').screenshot({ path: 'glow-before.png' });
    console.log('\n✓ Saved glow-before.png');

    // Modify the border path to wrap around the filter button
    await page.evaluate(() => {
        const borderContainer = document.querySelector('.timeline-border-container');
        const width = borderContainer.offsetWidth;
        const height = borderContainer.offsetHeight + 35;
        const radius = 12;
        const centerX = width / 2;

        // Filter button specs (matching the actual button)
        const filterWidth = 110;
        const filterHeight = 23;
        const filterRadius = 8;
        const filterY = 12; // containerY from JavaScript
        const filterBottom = filterY + filterHeight; // Bottom of filter = 35px (which is on the border line at 0)

        const filterLeft = centerX - (filterWidth / 2);
        const filterRight = centerX + (filterWidth / 2);

        // Create the new border path that wraps around the filter button
        const newBorderPath = `
            M ${radius} 0
            L ${filterLeft - filterRadius} 0

            // Go up and around the filter button (left side)
            L ${filterLeft - filterRadius} ${-filterHeight + filterRadius}
            Q ${filterLeft - filterRadius} ${-filterHeight} ${filterLeft} ${-filterHeight}

            // Top of filter button
            L ${filterRight} ${-filterHeight}

            // Come back down (right side of filter)
            Q ${filterRight + filterRadius} ${-filterHeight} ${filterRight + filterRadius} ${-filterHeight + filterRadius}
            L ${filterRight + filterRadius} 0

            // Continue with the rest of the border
            L ${width - radius} 0
            Q ${width} 0 ${width} ${radius}
            L ${width} ${height - radius}
            Q ${width} ${height} ${width - radius} ${height}
            L ${radius} ${height}
            Q 0 ${height} 0 ${height - radius}
            L 0 ${radius}
            Q 0 0 ${radius} 0
            Z
        `.trim().replace(/\s+/g, ' ');

        const borderPath = document.getElementById('border-path');
        if (borderPath) {
            borderPath.setAttribute('d', newBorderPath);
            console.log('Border path updated to wrap around filter button');
        }
    });

    await page.waitForTimeout(1000);

    // Screenshot after
    await page.locator('.timeline-border-container').screenshot({ path: 'glow-after.png' });
    console.log('\n✓ Saved glow-after.png');

    console.log('\n=== RESULT ===');
    console.log('The glow effect now wraps around the filter button!');
    console.log('\nTo apply this fix permanently, update the createMainBorderPath() function');
    console.log('in timeline-dev.html around line ~1794');

    console.log('\nBrowser will stay open for 60 seconds for review.');
    await page.waitForTimeout(60000);
    await browser.close();
})();
