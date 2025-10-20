const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    console.log('=== FINDING ALL ELEMENTS IN FILTER CONTAINER ===');
    const elements = await page.evaluate(() => {
        const container = document.getElementById('new-filter-container');
        if (!container) return [];

        const all = Array.from(container.querySelectorAll('*'));
        return all.map(el => ({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            text: el.textContent?.trim().substring(0, 20),
            zIndex: getComputedStyle(el).zIndex,
            display: getComputedStyle(el).display,
            position: getComputedStyle(el).position,
            rect: el.getBoundingClientRect()
        }));
    });

    console.log(`\nFound ${elements.length} elements in filter container`);
    const buttons = elements.filter(el => el.tag === 'BUTTON');
    console.log(`\nButtons (${buttons.length}):`);
    buttons.forEach((btn, i) => {
        console.log(`  ${i+1}. ${btn.id} - "${btn.text}" at (${btn.rect.left}, ${btn.rect.top})`);
    });

    // Now fix both issues
    console.log('\n=== APPLYING FIXES ===');

    const fixes = await page.evaluate(() => {
        const results = [];

        // Fix 1: Remove any duplicate main filter button (if exists)
        const allButtons = Array.from(document.querySelectorAll('button'));
        const filterButtons = allButtons.filter(btn =>
            btn.textContent.includes('Filter') &&
            btn.id !== 'main-filter-btn' &&
            btn.id !== 'filter-clear-btn'
        );

        filterButtons.forEach(btn => {
            results.push(`Removed duplicate filter button: ${btn.id || 'no-id'}`);
            btn.remove();
        });

        // Fix 2: Adjust border SVG top position
        const svg = document.getElementById('border-svg');
        if (svg) {
            const oldTop = getComputedStyle(svg).top;
            svg.style.top = '0px';  // Change from -35px to 0px
            results.push(`Changed border-svg top from ${oldTop} to 0px`);
        }

        return results;
    });

    console.log('\nFixes applied:');
    fixes.forEach(fix => console.log(`  ✅ ${fix}`));

    await page.screenshot({ path: 'after-fix.png', fullPage: true });
    console.log('\nScreenshot saved: after-fix.png');

    // Test if border still looks good
    const borderCheck = await page.evaluate(() => {
        const svg = document.getElementById('border-svg');
        const container = document.querySelector('.timeline-border-container');
        return {
            svgTop: svg ? getComputedStyle(svg).top : null,
            svgRect: svg ? svg.getBoundingClientRect() : null,
            containerRect: container ? container.getBoundingClientRect() : null
        };
    });

    console.log('\n=== VERIFICATION ===');
    console.log('SVG top style:', borderCheck.svgTop);
    console.log('SVG position:', borderCheck.svgRect);
    console.log('Container position:', borderCheck.containerRect);

    if (borderCheck.svgRect && borderCheck.containerRect) {
        if (borderCheck.svgRect.top >= borderCheck.containerRect.top) {
            console.log('✅ Border is now aligned with container (no overflow)');
        } else {
            console.log('⚠️ Border still extends above container');
        }
    }

    await browser.close();
})();
