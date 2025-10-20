
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    
    let toggleCount = 0;
    await page.evaluate(() => {
        window.toggleCallCount = 0;
        const originalToggle = toggleOptions;
        window.toggleOptions = function() {
            window.toggleCallCount++;
            console.log('toggleOptions called, count:', window.toggleCallCount);
            return originalToggle.apply(this, arguments);
        };
    });
    
    await page.click('#main-filter-btn');
    await page.waitForTimeout(500);
    
    const result = await page.evaluate(() => {
        return {
            toggleCount: window.toggleCallCount,
            isExpanded: document.getElementById('new-filter-container').classList.contains('filter-expanded')
        };
    });
    
    console.log('Toggle called', result.toggleCount, 'times');
    console.log('Is expanded:', result.isExpanded ? 'YES' : 'NO');
    console.log('Result:', result.toggleCount === 1 && result.isExpanded ? 'CORRECT ✅' : 'DOUBLE TOGGLE BUG ❌');
    
    await browser.close();
})();
