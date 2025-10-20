const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 200 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Loading page for comprehensive analysis...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    const analysis = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const btn = document.querySelector('.new-filter-btn');
        const borderContainer = document.querySelector('.timeline-border-container');
        const filterSections = document.getElementById('filter-sections');
        const borderPath = document.getElementById('border-path');

        // Get all rectangles
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();
        const svgRect = filterSections?.children[0]?.getBoundingClientRect();

        // Get CSS values
        const containerStyle = window.getComputedStyle(container);
        const btnStyle = window.getComputedStyle(btn);

        // Calculate border gap position (from createMainBorderPath - gap is at Y=35)
        const borderGapY = borderRect.top + 35;

        // SVG background position
        const svgTop = svgRect?.top;
        const svgBottom = svgRect?.bottom;
        const svgCenterY = svgRect ? svgRect.top + (svgRect.height / 2) : null;

        // Button text position
        const btnCenterY = btnRect.top + (btnRect.height / 2);

        return {
            // CSS
            cssTop: containerStyle.top,
            btnHeight: btnRect.height,
            svgHeight: svgRect?.height,

            // Absolute positions
            borderTop: borderRect.top,
            borderGapY: borderGapY,
            svgTop: svgTop,
            svgCenterY: svgCenterY,
            btnTop: btnRect.top,
            btnCenterY: btnCenterY,
            containerTop: containerRect.top,

            // Alignment issues
            issue1_svgVsBorderGap: svgRect ? (svgCenterY - borderGapY) : null,
            issue2_textVsSvgCenter: svgRect ? (btnCenterY - svgCenterY) : null,

            // Offsets from border container
            svgOffset: svgRect ? (svgRect.top - borderRect.top) : null,
            btnOffset: btnRect.top - borderRect.top
        };
    });

    console.log('=== COMPREHENSIVE ANALYSIS ===\n');
    console.log('CSS Configuration:');
    console.log('  CSS top:', analysis.cssTop);
    console.log('  Button height:', analysis.btnHeight, 'px');
    console.log('  SVG height:', analysis.svgHeight, 'px');

    console.log('\n=== ISSUE #1: SVG vs Border Gap ===');
    console.log('Border gap center Y:', analysis.borderGapY.toFixed(2), 'px');
    console.log('SVG center Y:', analysis.svgCenterY?.toFixed(2), 'px');
    console.log('Difference:', analysis.issue1_svgVsBorderGap?.toFixed(2), 'px');
    if (Math.abs(analysis.issue1_svgVsBorderGap) > 2) {
        console.log('❌ SVG is', analysis.issue1_svgVsBorderGap > 0 ? 'BELOW' : 'ABOVE', 'the border gap by', Math.abs(analysis.issue1_svgVsBorderGap).toFixed(2), 'px');
    } else {
        console.log('✓ SVG is aligned with border gap');
    }

    console.log('\n=== ISSUE #2: Text vs SVG Box ===');
    console.log('SVG center Y:', analysis.svgCenterY?.toFixed(2), 'px');
    console.log('Button text center Y:', analysis.btnCenterY.toFixed(2), 'px');
    console.log('Difference:', analysis.issue2_textVsSvgCenter?.toFixed(2), 'px');
    if (Math.abs(analysis.issue2_textVsSvgCenter) > 2) {
        console.log('❌ Text is', analysis.issue2_textVsSvgCenter > 0 ? 'BELOW' : 'ABOVE', 'the SVG box by', Math.abs(analysis.issue2_textVsSvgCenter).toFixed(2), 'px');
    } else {
        console.log('✓ Text is centered in SVG box');
    }

    // Screenshot before fix
    await page.locator('.timeline-border-container').screenshot({ path: 'comprehensive-before.png' });
    console.log('\n✓ Saved comprehensive-before.png');

    // Calculate fixes
    const svgYAdjustment = -Math.round(analysis.issue1_svgVsBorderGap);
    const textYAdjustment = -Math.round(analysis.issue2_textVsSvgCenter);

    console.log('\n=== CALCULATED FIXES ===');
    console.log('Fix #1 - Move SVG:', svgYAdjustment, 'px (to align with border gap)');
    console.log('Fix #2 - Move text:', textYAdjustment, 'px (to center in SVG box)');

    const currentSvgY = 35;
    const currentCssTop = 35;
    const newSvgY = currentSvgY + svgYAdjustment;
    const newCssTop = currentCssTop + svgYAdjustment + textYAdjustment;

    console.log('\nNew values:');
    console.log('  SVG containerY:', currentSvgY, '→', newSvgY);
    console.log('  CSS top:', currentCssTop, '→', newCssTop);

    // Apply fix to SVG
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

    // Apply fix to CSS position
    await page.evaluate((newTop) => {
        const container = document.querySelector('.new-filter-container');
        container.style.top = `${newTop}px`;
    }, newCssTop);

    await page.waitForTimeout(500);

    // Verify
    const verify = await page.evaluate(() => {
        const btn = document.querySelector('.new-filter-btn');
        const borderContainer = document.querySelector('.timeline-border-container');
        const filterSections = document.getElementById('filter-sections');

        const btnRect = btn.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();
        const svgRect = filterSections?.children[0]?.getBoundingClientRect();

        const borderGapY = borderRect.top + 35;
        const svgCenterY = svgRect ? svgRect.top + (svgRect.height / 2) : null;
        const btnCenterY = btnRect.top + (btnRect.height / 2);

        return {
            issue1Fixed: Math.abs(svgCenterY - borderGapY) < 2,
            issue2Fixed: Math.abs(btnCenterY - svgCenterY) < 2,
            svgVsGap: svgCenterY - borderGapY,
            textVsSvg: btnCenterY - svgCenterY
        };
    });

    console.log('\n=== VERIFICATION ===');
    console.log('Issue #1 (SVG vs border):', verify.issue1Fixed ? '✓ FIXED' : `✗ Still ${verify.svgVsGap.toFixed(1)}px off`);
    console.log('Issue #2 (text vs SVG):', verify.issue2Fixed ? '✓ FIXED' : `✗ Still ${verify.textVsSvg.toFixed(1)}px off`);

    // Screenshot after
    await page.locator('.timeline-border-container').screenshot({ path: 'comprehensive-after.png' });
    console.log('\n✓ Saved comprehensive-after.png');

    if (verify.issue1Fixed && verify.issue2Fixed) {
        console.log('\n✓✓✓ SUCCESS! ✓✓✓');
        console.log('\nApply these fixes:');
        console.log('\n1. timeline-dev.html - Line ~1830 & ~1919:');
        console.log(`   const containerY = ${newSvgY};`);
        console.log('\n2. timeline-dev.css - Line ~4137:');
        console.log(`   top: ${newCssTop}px;`);
        console.log('\n3. timeline-clean-test.css - Line ~4177:');
        console.log(`   top: ${newCssTop}px;`);
    }

    console.log('\nBrowser will stay open for 30 seconds. Review the visual result.');
    await page.waitForTimeout(30000);
    await browser.close();
})();
