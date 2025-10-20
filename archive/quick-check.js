const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    const check = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const borderContainer = document.querySelector('.timeline-border-container');
        const style = window.getComputedStyle(container);
        const cRect = container.getBoundingClientRect();
        const bRect = borderContainer.getBoundingClientRect();

        const svgY = 24;
        const htmlTop = bRect.top + parseFloat(style.top);
        const svgTop = bRect.top + svgY;

        return {
            cssTop: style.top,
            htmlPos: htmlTop,
            svgPos: svgTop,
            diff: Math.abs(htmlTop - svgTop),
            ok: Math.abs(htmlTop - svgTop) < 5
        };
    });

    console.log('CSS top:', check.cssTop);
    console.log('HTML position:', check.htmlPos.toFixed(1));
    console.log('SVG position:', check.svgPos.toFixed(1));
    console.log('Difference:', check.diff.toFixed(1), 'px');
    console.log('Aligned:', check.ok ? 'YES ✓' : 'NO ✗');

    await browser.close();
})();
