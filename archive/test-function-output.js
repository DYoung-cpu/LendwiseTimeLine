const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Testing createMainBorderPath function output...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    // Test the function directly
    const test = await page.evaluate(() => {
        const borderContainer = document.querySelector('.timeline-border-container');

        // Inline the function to test it
        const width = borderContainer?.offsetWidth;
        const height = borderContainer ? borderContainer.offsetHeight + 35 : 0;
        const radius = 12;
        const centerX = width / 2;

        const filterWidth = 110;
        const filterHeight = 23;
        const filterRadius = 8;

        const filterLeft = centerX - (filterWidth / 2);
        const filterRight = centerX + (filterWidth / 2);

        const path = `
            M ${radius} 0
            L ${filterLeft - filterRadius} 0

            L ${filterLeft - filterRadius} ${-filterHeight + filterRadius}
            Q ${filterLeft - filterRadius} ${-filterHeight} ${filterLeft} ${-filterHeight}

            L ${filterRight} ${-filterHeight}

            Q ${filterRight + filterRadius} ${-filterHeight} ${filterRight + filterRadius} ${-filterHeight + filterRadius}
            L ${filterRight + filterRadius} 0

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

        return {
            containerWidth: width,
            containerHeight: height,
            pathLength: path.length,
            pathFirst100: path.substring(0, 100),
            pathLast100: path.substring(path.length - 100),
            filterLeft,
            filterRight,
            fullPath: path
        };
    });

    console.log('=== CONTAINER DIMENSIONS ===');
    console.log('Width:', test.containerWidth);
    console.log('Height:', test.containerHeight);
    console.log('\n=== PATH OUTPUT ===');
    console.log('Path length:', test.pathLength);
    console.log('First 100 chars:', test.pathFirst100);
    console.log('Last 100 chars:', test.pathLast100);
    console.log('\n=== FILTER POSITIONS ===');
    console.log('Filter left:', test.filterLeft);
    console.log('Filter right:', test.filterRight);
    console.log('\n=== FULL PATH ===');
    console.log(test.fullPath);

    await browser.close();
})();
