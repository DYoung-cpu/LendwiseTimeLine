const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    console.log('=== FILTER BUTTON VERIFICATION ===\n');

    const verification = await page.evaluate(() => {
        const btn = document.getElementById('main-filter-btn');
        const container = document.getElementById('new-filter-container');

        if (!btn || !container) return { error: 'Elements not found' };

        const btnStyles = window.getComputedStyle(btn);
        const containerStyles = window.getComputedStyle(container);
        const rect = btn.getBoundingClientRect();

        return {
            visible: {
                opacity: containerStyles.opacity,
                display: btnStyles.display,
                visibility: btnStyles.visibility
            },
            background: btnStyles.backgroundColor,
            pointerEvents: {
                container: containerStyles.pointerEvents,
                button: btnStyles.pointerEvents
            },
            position: {
                top: containerStyles.top,
                left: containerStyles.left,
                zIndex: containerStyles.zIndex
            },
            dimensions: {
                width: btnStyles.width,
                height: btnStyles.height
            },
            boundingRect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            }
        };
    });

    if (verification.error) {
        console.log(`❌ ${verification.error}`);
    } else {
        console.log('VISIBILITY:');
        console.log(`  Opacity: ${verification.visible.opacity} ${verification.visible.opacity === '1' ? '✅' : '❌'}`);
        console.log(`  Display: ${verification.visible.display} ${verification.visible.display !== 'none' ? '✅' : '❌'}`);
        console.log(`  Visibility: ${verification.visible.visibility} ${verification.visible.visibility === 'visible' ? '✅' : '❌'}`);

        console.log('\nSTYLING:');
        console.log(`  Background: ${verification.background}`);
        const hasBackground = verification.background !== 'rgba(0, 0, 0, 0)' && verification.background !== 'transparent';
        console.log(`  Has visible background: ${hasBackground ? '✅' : '❌'}`);

        console.log('\nPOINTER EVENTS:');
        console.log(`  Container: ${verification.pointerEvents.container} ${verification.pointerEvents.container === 'auto' ? '✅' : '❌'}`);
        console.log(`  Button: ${verification.pointerEvents.button} ${verification.pointerEvents.button === 'auto' ? '✅' : '❌'}`);

        console.log('\nPOSITION:');
        console.log(`  Top: ${verification.position.top}`);
        console.log(`  Left: ${verification.position.left}`);
        console.log(`  Z-Index: ${verification.position.zIndex} ${parseInt(verification.position.zIndex) >= 1000 ? '✅' : '❌'}`);

        console.log('\nDIMENSIONS:');
        console.log(`  Width: ${verification.dimensions.width}`);
        console.log(`  Height: ${verification.dimensions.height}`);

        console.log('\nBOUNDING RECT (actual position on screen):');
        console.log(`  X: ${verification.boundingRect.x}px`);
        console.log(`  Y: ${verification.boundingRect.y}px`);
        console.log(`  Width: ${verification.boundingRect.width}px`);
        console.log(`  Height: ${verification.boundingRect.height}px`);

        console.log('\n=== CLICK TEST ===');
        try {
            await page.click('#main-filter-btn', { timeout: 2000 });
            await page.waitForTimeout(500);

            const isExpanded = await page.evaluate(() => {
                return document.getElementById('new-filter-container').classList.contains('filter-expanded');
            });

            console.log(`Click successful: ✅`);
            console.log(`Filter expanded: ${isExpanded ? '✅' : '❌'}`);
        } catch (error) {
            console.log(`Click failed: ❌ ${error.message}`);
        }
    }

    await page.screenshot({ path: 'filter-verification.png', fullPage: true });
    console.log('\n✓ Screenshot saved: filter-verification.png');

    await browser.close();
})();
