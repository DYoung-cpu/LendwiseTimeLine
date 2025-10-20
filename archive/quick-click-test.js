const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000); // Wait for animation

    console.log('=== QUICK FILTER BUTTON CLICK TEST ===\n');

    // Check pointer-events
    const pointerEvents = await page.evaluate(() => {
        const container = document.getElementById('new-filter-container');
        const btn = document.getElementById('main-filter-btn');
        return {
            container: window.getComputedStyle(container).pointerEvents,
            button: window.getComputedStyle(btn).pointerEvents
        };
    });

    console.log('Pointer Events:');
    console.log(`  Container: ${pointerEvents.container} ${pointerEvents.container === 'auto' ? '✅' : '❌'}`);
    console.log(`  Button: ${pointerEvents.button} ${pointerEvents.button === 'auto' ? '✅' : '❌'}`);

    // Try clicking
    console.log('\nAttempting click...');
    try {
        await page.click('#main-filter-btn', { timeout: 2000 });
        await page.waitForTimeout(500);

        const isExpanded = await page.evaluate(() => {
            return document.getElementById('new-filter-container').classList.contains('filter-expanded');
        });

        console.log(`Filter expanded: ${isExpanded ? '✅ SUCCESS!' : '❌ FAILED'}`);

        if (isExpanded) {
            await page.screenshot({ path: 'filter-expanded-test.png', fullPage: true });
            console.log('✓ Saved filter-expanded-test.png');
        }
    } catch (error) {
        console.log(`❌ Click failed: ${error.message}`);
    }

    await browser.close();
})();
