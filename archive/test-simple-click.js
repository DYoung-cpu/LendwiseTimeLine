const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    
    console.log('Testing simple click...');
    
    const before = await page.evaluate(() => {
        return document.getElementById('new-filter-container').classList.contains('filter-expanded');
    });
    console.log('Before click - Expanded:', before);
    
    await page.click('#main-filter-btn');
    await page.waitForTimeout(600);
    
    const after = await page.evaluate(() => {
        const container = document.getElementById('new-filter-container');
        const leftVis = document.getElementById('filter-options-left').classList.contains('visible');
        const rightVis = document.getElementById('filter-options-right').classList.contains('visible');
        return {
            expanded: container.classList.contains('filter-expanded'),
            leftVisible: leftVis,
            rightVisible: rightVis
        };
    });
    
    console.log('After click:');
    console.log('  Expanded:', after.expanded ? 'YES ✅' : 'NO ❌');
    console.log('  Left options visible:', after.leftVisible ? 'YES ✅' : 'NO ❌');
    console.log('  Right options visible:', after.rightVisible ? 'YES ✅' : 'NO ❌');
    console.log('');
    console.log('RESULT:', after.expanded && after.leftVisible && after.rightVisible ? 'SUCCESS ✅✅✅' : 'FAILED ❌');
    
    await page.screenshot({ path: 'test-simple-click.png', fullPage: true });
    console.log('Screenshot saved: test-simple-click.png');
    
    await browser.close();
})();
