const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    
    console.log('Testing filter button click...');
    
    await page.click('#main-filter-btn');
    await page.waitForTimeout(600);
    
    const result = await page.evaluate(() => {
        const container = document.getElementById('new-filter-container');
        const btn = document.getElementById('main-filter-btn');
        return {
            expanded: container.classList.contains('filter-expanded'),
            cursor: window.getComputedStyle(btn).cursor,
            hasGradient: window.getComputedStyle(btn).background.includes('radial-gradient')
        };
    });
    
    console.log('Expanded:', result.expanded ? '✅' : '❌');
    console.log('Cursor:', result.cursor, result.cursor === 'pointer' ? '✅' : '❌');
    console.log('Has gradient:', result.hasGradient ? '✅' : '❌');
    
    if (result.expanded) {
        await page.screenshot({ path: 'test-expanded-success.png', fullPage: true });
        console.log('✓ Saved test-expanded-success.png');
    }
    
    await browser.close();
})();
