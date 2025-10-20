const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Diagnosing timeline button spacing...\n');

    // Force hard reload to bypass cache
    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(6000);

    const analysis = await page.evaluate(() => {
        const container = document.querySelector('.timeline-border-container');
        const milestones = Array.from(document.querySelectorAll('.timeline-milestone'));

        if (!container) return { error: 'Container not found' };

        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;

        const results = milestones.map(ms => {
            const styleAttr = ms.getAttribute('style');
            const leftMatch = styleAttr?.match(/left:\s*([\d.]+)%/);
            const htmlLeftPercent = leftMatch ? parseFloat(leftMatch[1]) : null;

            const index = ms.getAttribute('data-index');
            const milestone = ms.getAttribute('data-milestone');

            const dot = ms.querySelector('.milestone-dot');
            const label = dot?.textContent?.trim();

            // Get actual rendered position
            const msRect = ms.getBoundingClientRect();
            const actualLeftPx = msRect.left - containerRect.left;
            const actualLeftPercent = (actualLeftPx / containerWidth * 100).toFixed(2);

            // Get computed style left value
            const computedLeft = window.getComputedStyle(ms).left;

            return {
                index,
                milestone,
                label,
                htmlLeftPercent,
                actualLeftPercent: parseFloat(actualLeftPercent),
                actualLeftPx: actualLeftPx.toFixed(2),
                computedLeft,
                width: msRect.width.toFixed(2)
            };
        });

        // Sort by index
        results.sort((a, b) => parseInt(a.index) - parseInt(b.index));

        // Calculate spacing
        const spacings = [];
        for (let i = 1; i < results.length; i++) {
            const spacing = (results[i].actualLeftPercent - results[i-1].actualLeftPercent).toFixed(3);
            spacings.push({
                from: results[i-1].label,
                to: results[i].label,
                spacing: parseFloat(spacing)
            });
        }

        return {
            containerWidth,
            milestones: results,
            spacings
        };
    });

    if (analysis.error) {
        console.error('Error:', analysis.error);
        await browser.close();
        return;
    }

    console.log('=== CONTAINER ===');
    console.log(`Width: ${analysis.containerWidth}px\n`);

    console.log('=== MILESTONE POSITIONS ===');
    console.log('Index | Label | HTML Left% | Actual Left% | Diff | Actual Px | Computed Left');
    console.log('------|-------|------------|--------------|------|-----------|---------------');
    analysis.milestones.forEach(m => {
        const diff = (m.actualLeftPercent - m.htmlLeftPercent).toFixed(2);
        console.log(`${m.index.padStart(5)} | ${m.label.padEnd(15)} | ${String(m.htmlLeftPercent).padStart(10)} | ${String(m.actualLeftPercent).padStart(12)} | ${diff.padStart(4)} | ${m.actualLeftPx.padStart(9)} | ${m.computedLeft}`);
    });

    console.log('\n=== SPACING BETWEEN BUTTONS ===');
    analysis.spacings.forEach(s => {
        console.log(`${s.from} → ${s.to}: ${s.spacing}%`);
    });

    const spacingValues = analysis.spacings.map(s => s.spacing);
    const avgSpacing = (spacingValues.reduce((a, b) => a + b, 0) / spacingValues.length).toFixed(3);
    const minSpacing = Math.min(...spacingValues).toFixed(3);
    const maxSpacing = Math.max(...spacingValues).toFixed(3);
    const variance = (maxSpacing - minSpacing).toFixed(3);

    console.log('\n=== STATISTICS ===');
    console.log(`Average spacing: ${avgSpacing}%`);
    console.log(`Min spacing: ${minSpacing}%`);
    console.log(`Max spacing: ${maxSpacing}%`);
    console.log(`Variance: ${variance}%`);

    if (variance > 0.1) {
        console.log(`\n⚠️  PROBLEM: Spacing is not consistent (variance ${variance}%)`);
    } else {
        console.log('\n✅ Spacing is consistent!');
    }

    // Check if HTML and actual positions match
    const positionMismatch = analysis.milestones.some(m =>
        Math.abs(m.actualLeftPercent - m.htmlLeftPercent) > 0.5
    );

    if (positionMismatch) {
        console.log('\n⚠️  WARNING: HTML left% values do not match actual rendered positions!');
        console.log('This suggests CSS is overriding the inline styles.');
    }

    await page.screenshot({ path: 'spacing-diagnostic.png', fullPage: true });
    console.log('\n✓ Saved spacing-diagnostic.png');

    console.log('\nBrowser will stay open for 15 seconds.');
    await page.waitForTimeout(15000);
    await browser.close();
})();
