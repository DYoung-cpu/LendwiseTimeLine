const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const analysis = await page.evaluate(() => {
        const milestones = Array.from(document.querySelectorAll('.timeline-milestone'));

        return milestones.map(m => {
            const index = m.getAttribute('data-index');
            const milestone = m.getAttribute('data-milestone');
            const style = m.getAttribute('style');
            const leftMatch = style.match(/left:\s*([\d.]+)%/);
            const left = leftMatch ? parseFloat(leftMatch[1]) : null;

            return { index, milestone, left };
        }).sort((a, b) => parseFloat(a.index) - parseFloat(b.index));
    });

    console.log('=== VERIFIED TIMELINE POSITIONS ===\n');

    const spacings = [];
    for (let i = 1; i < analysis.length; i++) {
        const spacing = (analysis[i].left - analysis[i-1].left).toFixed(3);
        spacings.push(parseFloat(spacing));
        console.log(`${analysis[i-1].milestone} (${analysis[i-1].left}%) → ${analysis[i].milestone} (${analysis[i].left}%): ${spacing}% spacing`);
    }

    const avgSpacing = (spacings.reduce((a, b) => a + b, 0) / spacings.length).toFixed(3);
    const minSpacing = Math.min(...spacings).toFixed(3);
    const maxSpacing = Math.max(...spacings).toFixed(3);

    console.log('\n=== STATISTICS ===');
    console.log(`Average spacing: ${avgSpacing}%`);
    console.log(`Min spacing: ${minSpacing}%`);
    console.log(`Max spacing: ${maxSpacing}%`);
    console.log(`Variance: ${(maxSpacing - minSpacing).toFixed(3)}%`);
    console.log(`\n${spacings.every(s => Math.abs(s - 4.533) < 0.01) ? '✅' : '❌'} All spacings are consistent`);

    await page.screenshot({ path: 'timeline-fixed-spacing.png', fullPage: true });
    console.log('\n✓ Saved timeline-fixed-spacing.png');

    await browser.close();
})();
