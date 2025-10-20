const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('http://localhost:3005/timeline-dev.html');
    await page.waitForTimeout(3000); // Wait for animations

    // Measure all positions
    const borderContainerBox = await page.locator('.timeline-border-container').boundingBox();
    const svgBox = await page.locator('.border-svg').boundingBox();
    const timelineLineBox = await page.locator('.timeline-main-line').boundingBox();

    const borderCenterY = borderContainerBox.y + (borderContainerBox.height / 2);
    const svgCenterY = svgBox.y + (svgBox.height / 2);

    console.log('=== FINAL MEASUREMENTS ===');
    console.log(`Border Container Center: ${borderCenterY.toFixed(2)}px`);
    console.log(`SVG Center: ${svgCenterY.toFixed(2)}px`);
    console.log(`Timeline Line Position: ${timelineLineBox.y.toFixed(2)}px`);
    console.log(`\n=== ALIGNMENT VERIFICATION ===`);

    const alignmentDiff = Math.abs(timelineLineBox.y - borderCenterY);
    console.log(`Border Center vs Timeline Line: ${alignmentDiff.toFixed(2)}px difference`);

    if (alignmentDiff < 1) {
        console.log('✅ PASS: Border is aligned with timeline line (< 1px difference)');
    } else {
        console.log('❌ FAIL: Border is NOT aligned with timeline line (>= 1px difference)');
        await browser.close();
        process.exit(1);
    }

    // Draw measurement lines and take screenshot
    await page.evaluate(() => {
        const borderContainer = document.querySelector('.timeline-border-container');
        const timeline = document.querySelector('.timeline-main-line');

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
        `;

        const borderBox = borderContainer.getBoundingClientRect();
        const timelineBox = timeline.getBoundingClientRect();
        const borderCenterY = borderBox.top + (borderBox.height / 2);

        const lines = [
            { y: borderCenterY, color: 'blue', label: `Border Center: ${borderCenterY.toFixed(1)}px`, offset: -20 },
            { y: timelineBox.top, color: 'green', label: `Timeline: ${timelineBox.top.toFixed(1)}px`, offset: 5 }
        ];

        lines.forEach(line => {
            const div = document.createElement('div');
            div.style.cssText = `
                position: absolute;
                top: ${line.y}px;
                left: 0;
                width: 100%;
                height: 2px;
                background: ${line.color};
                opacity: 0.8;
            `;
            overlay.appendChild(div);

            const label = document.createElement('div');
            label.textContent = line.label;
            label.style.cssText = `
                position: absolute;
                top: ${line.y + line.offset}px;
                left: 10px;
                background: ${line.color};
                color: white;
                padding: 4px 8px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 4px;
                opacity: 0.9;
            `;
            overlay.appendChild(label);
        });

        const alignmentBox = document.createElement('div');
        const diff = Math.abs(borderCenterY - timelineBox.top);
        alignmentBox.textContent = diff < 1 ? '✅ ALIGNED' : '❌ NOT ALIGNED';
        alignmentBox.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: ${diff < 1 ? 'green' : 'red'};
            color: white;
            padding: 12px 20px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        overlay.appendChild(alignmentBox);

        document.body.appendChild(overlay);
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'border-position-after.png', fullPage: false });
    console.log('\n📸 Screenshot saved: border-position-after.png');

    console.log('\n=== TESTING EXPANDED STATE ===');
    await page.click('.new-filter-btn');
    await page.waitForTimeout(500);

    const expandedBorderBox = await page.locator('.timeline-border-container').boundingBox();
    const expandedTimelineBox = await page.locator('.timeline-main-line').boundingBox();
    const expandedBorderCenterY = expandedBorderBox.y + (expandedBorderBox.height / 2);
    const expandedDiff = Math.abs(expandedTimelineBox.y - expandedBorderCenterY);

    console.log(`Border Center (expanded): ${expandedBorderCenterY.toFixed(2)}px`);
    console.log(`Timeline Line: ${expandedTimelineBox.y.toFixed(2)}px`);
    console.log(`Difference: ${expandedDiff.toFixed(2)}px`);

    if (expandedDiff < 1) {
        console.log('✅ PASS: Border remains aligned when expanded');
    } else {
        console.log('❌ FAIL: Border alignment breaks when expanded');
        await browser.close();
        process.exit(1);
    }

    await page.screenshot({ path: 'border-position-after-expanded.png', fullPage: false });
    console.log('📸 Screenshot saved: border-position-after-expanded.png');

    console.log('\n✅ ALL ALIGNMENT TESTS PASSED!');
    await browser.close();
})();
