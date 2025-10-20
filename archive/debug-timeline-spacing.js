const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Debugging timeline spacing...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    const analysis = await page.evaluate(() => {
        const container = document.querySelector('.timeline-border-container');
        const milestones = Array.from(document.querySelectorAll('.milestone-item'));

        const containerWidth = container.offsetWidth;
        const containerRect = container.getBoundingClientRect();

        const milestoneData = milestones.map(m => {
            const rect = m.getBoundingClientRect();
            const dateAttr = m.getAttribute('data-date');
            const label = m.querySelector('.milestone-label')?.textContent;
            const leftPercent = ((rect.left - containerRect.left) / containerWidth * 100).toFixed(2);

            return {
                label,
                date: dateAttr,
                left: rect.left - containerRect.left,
                leftPercent: leftPercent + '%',
                width: rect.width
            };
        });

        // Sort by position
        milestoneData.sort((a, b) => a.left - b.left);

        // Calculate spacing between consecutive milestones
        const spacings = [];
        for (let i = 1; i < milestoneData.length; i++) {
            const spacing = milestoneData[i].left - milestoneData[i-1].left;
            spacings.push({
                from: milestoneData[i-1].label,
                to: milestoneData[i].label,
                spacing: spacing.toFixed(2),
                fromDate: milestoneData[i-1].date,
                toDate: milestoneData[i].date
            });
        }

        return {
            containerWidth,
            milestoneCount: milestones.length,
            milestones: milestoneData,
            spacings
        };
    });

    console.log('=== TIMELINE CONTAINER ===');
    console.log('Width:', analysis.containerWidth, 'px');
    console.log('Total milestones:', analysis.milestoneCount);

    console.log('\n=== MILESTONE POSITIONS ===');
    analysis.milestones.forEach((m, i) => {
        console.log(`${i + 1}. ${m.label}: ${m.leftPercent} (${m.left.toFixed(2)}px) - Date: ${m.date}`);
    });

    console.log('\n=== SPACING BETWEEN MILESTONES ===');
    analysis.spacings.forEach(s => {
        console.log(`${s.from} → ${s.to}: ${s.spacing}px (${s.fromDate} → ${s.toDate})`);
    });

    // Calculate statistics
    const spacingValues = analysis.spacings.map(s => parseFloat(s.spacing));
    const avgSpacing = (spacingValues.reduce((a, b) => a + b, 0) / spacingValues.length).toFixed(2);
    const minSpacing = Math.min(...spacingValues).toFixed(2);
    const maxSpacing = Math.max(...spacingValues).toFixed(2);

    console.log('\n=== SPACING STATISTICS ===');
    console.log('Average spacing:', avgSpacing, 'px');
    console.log('Min spacing:', minSpacing, 'px');
    console.log('Max spacing:', maxSpacing, 'px');
    console.log('Variance:', (maxSpacing - minSpacing), 'px');

    await page.screenshot({ path: 'timeline-spacing-debug.png', fullPage: true });
    console.log('\n✓ Saved timeline-spacing-debug.png');

    console.log('\nBrowser will stay open for 15 seconds.');
    await page.waitForTimeout(15000);
    await browser.close();
})();
