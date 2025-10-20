const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(5000);

    const result = await page.evaluate(() => {
        const btn = document.querySelector('.new-filter-btn');
        const borderContainer = document.querySelector('.timeline-border-container');
        const container = document.querySelector('.new-filter-container');

        const btnRect = btn.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();
        const style = window.getComputedStyle(container);

        const gapCenter = borderRect.top + 35;
        const btnCenter = btnRect.top + (btnRect.height / 2);

        return {
            top: style.top,
            gap: gapCenter,
            btn: btnCenter,
            diff: gapCenter - btnCenter,
            ok: Math.abs(gapCenter - btnCenter) < 3
        };
    });

    console.log(`CSS top: ${result.top}`);
    console.log(`Gap center: ${result.gap.toFixed(1)}px`);
    console.log(`Button center: ${result.btn.toFixed(1)}px`);
    console.log(`Difference: ${result.diff.toFixed(1)}px`);
    console.log(`Status: ${result.ok ? 'ALIGNED ✓' : 'NOT ALIGNED ✗'}`);

    await browser.close();
})();
