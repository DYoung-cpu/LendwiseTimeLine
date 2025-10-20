const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Loading updated page...');
    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(6000);

    const result = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const borderContainer = document.querySelector('.timeline-border-container');
        const filterSections = document.getElementById('filter-sections');

        const htmlRect = container.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();
        let svgRect = null;
        if (filterSections && filterSections.children.length > 0) {
            svgRect = filterSections.children[0].getBoundingClientRect();
        }

        const htmlOffset = htmlRect.top - borderRect.top;
        const svgOffset = svgRect ? svgRect.top - borderRect.top : null;
        const diff = Math.abs(htmlOffset - svgOffset);

        return {
            htmlOffset: htmlOffset.toFixed(2),
            svgOffset: svgOffset?.toFixed(2),
            difference: diff.toFixed(2),
            aligned: diff < 2
        };
    });

    // Take screenshots
    await page.locator('.new-filter-container').screenshot({ path: 'final-collapsed.png' });
    await page.click('.new-filter-btn');
    await page.waitForTimeout(1000);
    await page.locator('.new-filter-container').screenshot({ path: 'final-expanded.png' });

    console.log('\n=== FINAL VERIFICATION ===');
    console.log('HTML offset from border:', result.htmlOffset, 'px');
    console.log('SVG offset from border:', result.svgOffset, 'px');
    console.log('Difference:', result.difference, 'px');
    console.log('\nStatus:', result.aligned ? '✓✓✓ PERFECTLY ALIGNED ✓✓✓' : '✗ Still misaligned');

    if (result.aligned) {
        console.log('\nThe filter button SVG background and text are now perfectly aligned!');
        console.log('Screenshots saved: final-collapsed.png, final-expanded.png');
    }

    await browser.close();
})();
