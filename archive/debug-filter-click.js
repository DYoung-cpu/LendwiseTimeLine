const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    const logs = [];
    page.on('console', msg => logs.push('CONSOLE: ' + msg.text()));
    page.on('pageerror', err => logs.push('ERROR: ' + err.message));

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    
    console.log('=== FILTER CLICK DEBUG ===\n');
    
    // Check initial state
    const initialState = await page.evaluate(() => {
        const container = document.getElementById('new-filter-container');
        const btn = document.getElementById('main-filter-btn');
        return {
            containerExists: !!container,
            buttonExists: !!btn,
            isExpanded: container ? container.classList.contains('filter-expanded') : false,
            containerClass: container ? container.className : 'null'
        };
    });
    
    console.log('Initial State:');
    console.log('  Container exists:', initialState.containerExists ? 'YES' : 'NO');
    console.log('  Button exists:', initialState.buttonExists ? 'YES' : 'NO');
    console.log('  Is expanded:', initialState.isExpanded ? 'YES' : 'NO');
    console.log('  Container class:', initialState.containerClass);
    
    // Try clicking
    console.log('\n--- Clicking Button ---');
    await page.click('#main-filter-btn');
    await page.waitForTimeout(800);
    
    // Check state after click
    const afterState = await page.evaluate(() => {
        const container = document.getElementById('new-filter-container');
        const leftOptions = document.getElementById('filter-options-left');
        const rightOptions = document.getElementById('filter-options-right');
        return {
            isExpanded: container.classList.contains('filter-expanded'),
            containerClass: container.className,
            leftVisible: leftOptions ? leftOptions.classList.contains('visible') : false,
            rightVisible: rightOptions ? rightOptions.classList.contains('visible') : false
        };
    });
    
    console.log('\nAfter Click:');
    console.log('  Is expanded:', afterState.isExpanded ? 'YES ✅' : 'NO ❌');
    console.log('  Container class:', afterState.containerClass);
    console.log('  Left options visible:', afterState.leftVisible ? 'YES' : 'NO');
    console.log('  Right options visible:', afterState.rightVisible ? 'YES' : 'NO');
    
    console.log('\n--- Page Logs ---');
    logs.forEach(log => console.log('  ' + log));
    
    if (!afterState.isExpanded) {
        console.log('\n❌ FILTER DID NOT EXPAND');
    } else {
        console.log('\n✅ FILTER EXPANDED SUCCESSFULLY');
    }
    
    await page.screenshot({ path: 'debug-filter-state.png', fullPage: true });
    console.log('\nScreenshot: debug-filter-state.png');
    
    await browser.close();
})();
