const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const data = await page.evaluate(() => {
        const milestones = Array.from(document.querySelectorAll('.timeline-milestone'));

        return milestones.map(ms => {
            const style = ms.getAttribute('style');
            const leftMatch = style?.match(/left:\s*([\d.]+)%/);
            const label = ms.querySelector('.milestone-dot')?.textContent?.trim();

            return {
                label,
                htmlLeft: leftMatch ? parseFloat(leftMatch[1]) : null
            };
        }).filter(m => m.htmlLeft !== null);
    });

    console.log('=== HTML LEFT PERCENTAGES ===\n');
    data.forEach((m, i) => {
        const spacing = i > 0 ? (m.htmlLeft - data[i-1].htmlLeft).toFixed(2) : 'N/A';
        console.log(`${m.label.padEnd(20)} ${m.htmlLeft}% (spacing: ${spacing}%)`);
    });

    await browser.close();
})();
