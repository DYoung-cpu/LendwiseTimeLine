const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    console.log('=== ISSUE 1: DUPLICATE FILTER BUTTONS ===');
    const filterButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter(btn =>
            btn.textContent.includes('Filter') || btn.id.includes('filter')
        );
        return buttons.map(btn => ({
            id: btn.id,
            className: btn.className,
            text: btn.textContent.trim(),
            html: btn.outerHTML.substring(0, 100),
            rect: btn.getBoundingClientRect()
        }));
    });

    console.log('Found filter buttons:', filterButtons.length);
    filterButtons.forEach((btn, i) => {
        console.log(`\nButton ${i + 1}:`);
        console.log('  ID:', btn.id);
        console.log('  Class:', btn.className);
        console.log(`  Position: top=${btn.rect.top}, left=${btn.rect.left}`);
        console.log('  HTML:', btn.html);
    });

    console.log('\n=== ISSUE 2: BORDER POSITION ===');
    const borderInfo = await page.evaluate(() => {
        const svg = document.getElementById('border-svg');
        const container = document.querySelector('.timeline-border-container');
        const timelineSection = document.getElementById('timeline-section');

        return {
            svgRect: svg ? svg.getBoundingClientRect() : null,
            containerRect: container ? container.getBoundingClientRect() : null,
            timelineRect: timelineSection ? timelineSection.getBoundingClientRect() : null,
            svgStyle: svg ? {
                top: getComputedStyle(svg).top,
                position: getComputedStyle(svg).position,
                transform: getComputedStyle(svg).transform
            } : null
        };
    });

    console.log('Border SVG position:', borderInfo.svgRect);
    console.log('Border container position:', borderInfo.containerRect);
    console.log('Timeline section position:', borderInfo.timelineRect);
    console.log('SVG styles:', borderInfo.svgStyle);

    if (borderInfo.svgRect && borderInfo.timelineRect) {
        const overflow = borderInfo.timelineRect.top - borderInfo.svgRect.top;
        console.log(`\n⚠️ Border extends ${overflow}px above timeline`);
    }

    await page.screenshot({ path: 'diagnose-issues.png', fullPage: true });
    console.log('\nScreenshot saved: diagnose-issues.png');

    await browser.close();
})();
