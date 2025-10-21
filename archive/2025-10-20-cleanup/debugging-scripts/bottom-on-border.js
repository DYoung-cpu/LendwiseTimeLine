const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 200 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Positioning button BOTTOM on TOP border line...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    const analysis = await page.evaluate(() => {
        const borderContainer = document.querySelector('.timeline-border-container');
        const filterSections = document.getElementById('filter-sections');
        const btn = document.querySelector('.new-filter-btn');

        const borderRect = borderContainer.getBoundingClientRect();
        const svgRect = filterSections?.children[0]?.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();

        // The TOP border line is at the very top of the border container
        const topBorderLineY = borderRect.top;

        // Button specs
        const buttonHeight = 23;

        // We want the BOTTOM of the button to sit ON the top border line
        const targetButtonBottomY = topBorderLineY;
        const targetButtonTopY = targetButtonBottomY - buttonHeight;

        // Calculate offset from border container
        const targetOffset = targetButtonTopY - borderRect.top;

        // Current positions
        const currentSvgOffset = svgRect ? svgRect.top - borderRect.top : null;
        const currentBtnOffset = btnRect.top - borderRect.top;
        const currentBtnBottom = btnRect.bottom - borderRect.top;

        return {
            borderTop: borderRect.top,
            topBorderLineY: topBorderLineY,
            buttonHeight: buttonHeight,
            targetButtonBottom: targetButtonBottomY,
            targetButtonTop: targetButtonTopY,
            targetOffset: targetOffset,
            currentSvgOffset: currentSvgOffset,
            currentBtnOffset: currentBtnOffset,
            currentBtnBottom: currentBtnBottom,
            svgAdjustment: targetOffset - currentSvgOffset,
            cssAdjustment: targetOffset - currentBtnOffset
        };
    });

    console.log('=== POSITION BUTTON BOTTOM ON TOP BORDER ===\n');
    console.log('Border container top:', analysis.borderTop.toFixed(2), 'px');
    console.log('Top border line Y:', analysis.topBorderLineY.toFixed(2), 'px');
    console.log('\nButton specs:');
    console.log('  Height:', analysis.buttonHeight, 'px');
    console.log('  Target BOTTOM Y:', analysis.targetButtonBottom.toFixed(2), 'px (ON top border line)');
    console.log('  Target TOP Y:', analysis.targetButtonTop.toFixed(2), 'px');
    console.log('  Target offset from container:', analysis.targetOffset.toFixed(2), 'px');

    console.log('\nCurrent positions:');
    console.log('  Button offset (top):', analysis.currentBtnOffset.toFixed(2), 'px');
    console.log('  Button offset (bottom):', analysis.currentBtnBottom.toFixed(2), 'px');
    console.log('  SVG offset:', analysis.currentSvgOffset?.toFixed(2), 'px');

    console.log('\nRequired adjustments:');
    console.log('  SVG needs to move:', analysis.svgAdjustment?.toFixed(2), 'px');
    console.log('  CSS top needs to change by:', analysis.cssAdjustment?.toFixed(2), 'px');

    const currentSvgY = 24;
    const currentCssTop = -11;
    const newSvgY = currentSvgY + Math.round(analysis.svgAdjustment);
    const newCssTop = currentCssTop + Math.round(analysis.cssAdjustment);

    console.log('\n=== NEW VALUES ===');
    console.log('SVG containerY:', currentSvgY, '→', newSvgY);
    console.log('CSS top:', currentCssTop, '→', newCssTop);

    // Screenshot before
    await page.locator('.timeline-border-container').screenshot({ path: 'bottom-on-border-before.png' });
    console.log('\n✓ Saved bottom-on-border-before.png');

    // Apply SVG fix
    await page.evaluate((newY) => {
        const borderContainer = document.querySelector('.timeline-border-container');
        const filterSections = document.getElementById('filter-sections');
        const filterBorder = document.getElementById('filter-border');

        const width = borderContainer.offsetWidth;
        const centerX = width / 2;
        const containerHeight = 23;
        const containerRadius = 8;
        const containerY = newY;
        const containerWidth = 110;
        const containerLeft = centerX - (containerWidth / 2);
        const containerRight = centerX + (containerWidth / 2);

        // Redraw SVG
        filterSections.innerHTML = '';
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `
            M ${containerLeft + containerRadius} ${containerY}
            L ${containerRight - containerRadius} ${containerY}
            Q ${containerRight} ${containerY} ${containerRight} ${containerY + containerRadius}
            Q ${containerRight} ${containerY + containerHeight} ${containerRight - containerRadius} ${containerY + containerHeight}
            L ${containerLeft + containerRadius} ${containerY + containerHeight}
            Q ${containerLeft} ${containerY + containerHeight} ${containerLeft} ${containerY + containerRadius}
            Q ${containerLeft} ${containerY} ${containerLeft + containerRadius} ${containerY}
            Z
        `.trim().replace(/\s+/g, ' '));
        path.setAttribute('fill', 'url(#filterGradient)');
        path.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
        path.setAttribute('stroke-width', '1');
        filterSections.appendChild(path);

        // Redraw border
        const borderPath = `
            M ${containerLeft + containerRadius} ${containerY}
            L ${containerRight - containerRadius} ${containerY}
            Q ${containerRight} ${containerY} ${containerRight} ${containerY + containerRadius}
            L ${containerRight} ${containerY + containerHeight - containerRadius}
            Q ${containerRight} ${containerY + containerHeight} ${containerRight - containerRadius} ${containerY + containerHeight}
            L ${containerLeft + containerRadius} ${containerY + containerHeight}
            Q ${containerLeft} ${containerY + containerHeight} ${containerLeft} ${containerY + containerHeight - containerRadius}
            L ${containerLeft} ${containerY + containerRadius}
            Q ${containerLeft} ${containerY} ${containerLeft + containerRadius} ${containerY}
        `.trim().replace(/\s+/g, ' ');
        filterBorder.setAttribute('d', borderPath);
    }, newSvgY);

    // Apply CSS fix
    await page.evaluate((newTop) => {
        const container = document.querySelector('.new-filter-container');
        container.style.top = `${newTop}px`;
    }, newCssTop);

    await page.waitForTimeout(500);

    // Verify
    const verify = await page.evaluate(() => {
        const borderContainer = document.querySelector('.timeline-border-container');
        const btn = document.querySelector('.new-filter-btn');
        const filterSections = document.getElementById('filter-sections');

        const borderRect = borderContainer.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const svgRect = filterSections?.children[0]?.getBoundingClientRect();

        const topBorderY = borderRect.top;
        const btnBottomY = btnRect.bottom;
        const svgCenterY = svgRect ? svgRect.top + (svgRect.height / 2) : null;
        const btnCenterY = btnRect.top + (btnRect.height / 2);

        return {
            topBorderY: topBorderY,
            btnBottomY: btnBottomY,
            btnCenterY: btnCenterY,
            svgCenterY: svgCenterY,
            btnBottomOnLine: Math.abs(btnBottomY - topBorderY),
            textInSvg: Math.abs(btnCenterY - svgCenterY),
            success: Math.abs(btnBottomY - topBorderY) < 2 && Math.abs(btnCenterY - svgCenterY) < 2
        };
    });

    console.log('\n=== VERIFICATION ===');
    console.log('Top border line Y:', verify.topBorderY.toFixed(2), 'px');
    console.log('Button BOTTOM Y:', verify.btnBottomY.toFixed(2), 'px');
    console.log('Difference:', verify.btnBottomOnLine.toFixed(2), 'px');
    console.log('Text centered in SVG:', verify.textInSvg.toFixed(2), 'px off');
    console.log('\nStatus:', verify.success ? '✓✓✓ PERFECTLY POSITIONED!' : '✗ Needs adjustment');

    // Screenshot after
    await page.locator('.timeline-border-container').screenshot({ path: 'bottom-on-border-after.png' });
    console.log('\n✓ Saved bottom-on-border-after.png');

    if (verify.success) {
        console.log('\n✓✓✓ SUCCESS! ✓✓✓');
        console.log('Button bottom is now sitting ON the top border line!');
        console.log('\nApply these fixes:');
        console.log('\n1. timeline-dev.html - Lines ~1834 & ~1923:');
        console.log(`   const containerY = ${newSvgY};`);
        console.log('\n2. timeline-dev.css - Line ~4137:');
        console.log(`   top: ${newCssTop}px;`);
        console.log('\n3. timeline-clean-test.css - Line ~4190:');
        console.log(`   top: ${newCssTop}px;`);
    }

    console.log('\nBrowser stays open for 30 seconds. Review the result.');
    await page.waitForTimeout(30000);
    await browser.close();
})();
