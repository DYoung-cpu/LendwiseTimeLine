const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 200 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Loading page and auditing spacing...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    // Comprehensive audit
    const audit = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        const btn = document.querySelector('.new-filter-btn');
        const borderContainer = document.querySelector('.timeline-border-container');
        const filterSections = document.getElementById('filter-sections');
        const mainBorderLine = document.querySelector('.timeline-main-line');

        // Get all positions
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const borderRect = borderContainer.getBoundingClientRect();
        const timelineLineRect = mainBorderLine ? mainBorderLine.getBoundingClientRect() : null;

        let svgRect = null;
        if (filterSections && filterSections.children.length > 0) {
            svgRect = filterSections.children[0].getBoundingClientRect();
        }

        // Get CSS values
        const containerStyle = window.getComputedStyle(container);
        const btnStyle = window.getComputedStyle(btn);

        // Calculate offsets from border container
        const htmlOffsetFromBorder = containerRect.top - borderRect.top;
        const svgOffsetFromBorder = svgRect ? svgRect.top - borderRect.top : null;
        const btnOffsetFromBorder = btnRect.top - borderRect.top;

        // Timeline line position
        const timelineLineOffset = timelineLineRect ? timelineLineRect.top - borderRect.top : null;

        return {
            // CSS values
            cssTop: containerStyle.top,
            cssPosition: containerStyle.position,
            btnHeight: btnRect.height,
            btnPaddingTop: btnStyle.paddingTop,
            btnPaddingBottom: btnStyle.paddingBottom,

            // Absolute positions
            borderTop: borderRect.top,
            containerTop: containerRect.top,
            btnTop: btnRect.top,
            btnBottom: btnRect.bottom,
            svgTop: svgRect?.top,
            svgBottom: svgRect?.bottom,
            svgHeight: svgRect?.height,
            timelineLineTop: timelineLineRect?.top,

            // Offsets from border container
            htmlOffset: htmlOffsetFromBorder,
            svgOffset: svgOffsetFromBorder,
            btnOffset: btnOffsetFromBorder,
            timelineLineOffset: timelineLineOffset,

            // Differences
            htmlVsSvgDiff: svgOffsetFromBorder ? (htmlOffsetFromBorder - svgOffsetFromBorder) : null,
            btnVsSvgDiff: svgRect ? (btnRect.top - svgRect.top) : null,

            // Center calculations
            btnCenter: btnRect.top + (btnRect.height / 2),
            svgCenter: svgRect ? svgRect.top + (svgRect.height / 2) : null,
            centerDiff: svgRect ? Math.abs((btnRect.top + btnRect.height/2) - (svgRect.top + svgRect.height/2)) : null
        };
    });

    console.log('=== COMPREHENSIVE SPACING AUDIT ===\n');
    console.log('CSS Configuration:');
    console.log('  Container top:', audit.cssTop);
    console.log('  Container position:', audit.cssPosition);
    console.log('  Button height:', audit.btnHeight, 'px');

    console.log('\nAbsolute Positions (from viewport top):');
    console.log('  Border container:', audit.borderTop.toFixed(2), 'px');
    console.log('  SVG background:', audit.svgTop?.toFixed(2), 'px');
    console.log('  HTML container:', audit.containerTop.toFixed(2), 'px');
    console.log('  Button (text):', audit.btnTop.toFixed(2), 'px');
    if (audit.timelineLineTop) {
        console.log('  Timeline line:', audit.timelineLineTop.toFixed(2), 'px');
    }

    console.log('\nOffsets from Border Container:');
    console.log('  SVG background offset:', audit.svgOffset?.toFixed(2), 'px');
    console.log('  HTML container offset:', audit.htmlOffset.toFixed(2), 'px');
    console.log('  Button offset:', audit.btnOffset.toFixed(2), 'px');
    if (audit.timelineLineOffset) {
        console.log('  Timeline line offset:', audit.timelineLineOffset.toFixed(2), 'px');
    }

    console.log('\n=== ALIGNMENT ANALYSIS ===');
    console.log('SVG background height:', audit.svgHeight?.toFixed(2), 'px');
    console.log('SVG center Y:', audit.svgCenter?.toFixed(2), 'px');
    console.log('Button center Y:', audit.btnCenter.toFixed(2), 'px');
    console.log('Center difference:', audit.centerDiff?.toFixed(2), 'px');

    console.log('\n=== PROBLEM IDENTIFIED ===');
    if (audit.btnVsSvgDiff > 2) {
        console.log('⚠ Button text is', audit.btnVsSvgDiff.toFixed(2), 'px BELOW the SVG background!');
        console.log('   SVG needs to move DOWN by:', audit.btnVsSvgDiff.toFixed(2), 'px');
    } else if (audit.btnVsSvgDiff < -2) {
        console.log('⚠ Button text is', Math.abs(audit.btnVsSvgDiff).toFixed(2), 'px ABOVE the SVG background!');
        console.log('   SVG needs to move UP by:', Math.abs(audit.btnVsSvgDiff).toFixed(2), 'px');
    } else {
        console.log('✓ Button and SVG are aligned!');
    }

    // Screenshot before fix
    await page.locator('.timeline-border-container').screenshot({ path: 'audit-before.png' });
    console.log('\n✓ Saved audit-before.png');

    // Calculate fix
    const currentSvgY = 62; // From JavaScript
    const adjustment = Math.round(audit.btnVsSvgDiff);
    const newSvgY = currentSvgY + adjustment;

    console.log('\n=== CALCULATED FIX ===');
    console.log('Current SVG containerY:', currentSvgY, 'px');
    console.log('Adjustment needed:', adjustment, 'px');
    console.log('New SVG containerY:', newSvgY, 'px');

    // Apply fix
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

        // Redraw SVG sections
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

    await page.waitForTimeout(500);

    // Verify fix
    const verify = await page.evaluate(() => {
        const btn = document.querySelector('.new-filter-btn');
        const filterSections = document.getElementById('filter-sections');
        const btnRect = btn.getBoundingClientRect();
        let svgRect = null;
        if (filterSections && filterSections.children.length > 0) {
            svgRect = filterSections.children[0].getBoundingClientRect();
        }

        return {
            btnTop: btnRect.top,
            svgTop: svgRect?.top,
            diff: svgRect ? Math.abs(btnRect.top - svgRect.top) : null,
            aligned: svgRect ? Math.abs(btnRect.top - svgRect.top) < 2 : false
        };
    });

    console.log('\n=== VERIFICATION ===');
    console.log('Button top:', verify.btnTop.toFixed(2), 'px');
    console.log('SVG top:', verify.svgTop?.toFixed(2), 'px');
    console.log('Difference:', verify.diff?.toFixed(2), 'px');
    console.log('Status:', verify.aligned ? '✓ PERFECTLY ALIGNED!' : '✗ Still misaligned');

    // Screenshot after fix
    await page.locator('.timeline-border-container').screenshot({ path: 'audit-after.png' });
    console.log('\n✓ Saved audit-after.png');

    if (verify.aligned) {
        console.log('\n✓✓✓ SUCCESS! ✓✓✓');
        console.log('\nApply this fix to timeline-dev.html:');
        console.log('\nLine ~1830 in createFilterSections():');
        console.log(`  Change: const containerY = 62;`);
        console.log(`  To:     const containerY = ${newSvgY};`);
        console.log('\nLine ~1919 in createFilterBorder():');
        console.log(`  Change: const containerY = 62;`);
        console.log(`  To:     const containerY = ${newSvgY};`);
    }

    console.log('\nBrowser will stay open for 30 seconds. Review the visual result.');
    await page.waitForTimeout(30000);
    await browser.close();
})();
