const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    const logs = [];
    page.on('console', msg => logs.push(`CONSOLE: ${msg.text()}`));
    page.on('pageerror', err => logs.push(`ERROR: ${err.message}`));

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    
    console.log('=== CURRENT STATE DIAGNOSIS ===\n');
    
    const state = await page.evaluate(() => {
        const container = document.getElementById('new-filter-container');
        const btn = document.getElementById('main-filter-btn');
        
        return {
            elements: {
                containerExists: !!container,
                buttonExists: !!btn
            },
            beforeClick: {
                isExpanded: container?.classList.contains('filter-expanded') || false,
                containerClasses: container?.className || 'null'
            },
            styles: {
                cursor: btn ? window.getComputedStyle(btn).cursor : 'null',
                hasGradient: btn ? window.getComputedStyle(btn).background.includes('radial-gradient') : false
            }
        };
    });
    
    console.log('Elements:', state.elements.containerExists && state.elements.buttonExists ? '✅' : '❌');
    console.log('Cursor:', state.styles.cursor);
    console.log('Has gradient:', state.styles.hasGradient ? '✅' : '❌');
    console.log('Before click - Expanded:', state.beforeClick.isExpanded);
    
    console.log('\n--- Testing Click ---');
    await page.click('#main-filter-btn');
    await page.waitForTimeout(800);
    
    const afterClick = await page.evaluate(() => {
        const container = document.getElementById('new-filter-container');
        return {
            isExpanded: container.classList.contains('filter-expanded'),
            classes: container.className
        };
    });
    
    console.log('After click - Expanded:', afterClick.isExpanded ? '✅ WORKS' : '❌ BROKEN');
    console.log('Classes:', afterClick.classes);
    
    console.log('\n--- Console Logs ---');
    logs.forEach(log => console.log(log));
    
    await page.screenshot({ path: 'current-state-diagnosis.png', fullPage: true });
    console.log('\n✓ Screenshot: current-state-diagnosis.png');
    
    await browser.close();
})();
