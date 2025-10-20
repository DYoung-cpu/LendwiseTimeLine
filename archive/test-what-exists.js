const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const pageInfo = await page.evaluate(() => {
        return {
            hasMainBtn: !!document.getElementById('main-filter-btn'),
            hasContainer: !!document.getElementById('new-filter-container'),
            hasToggleOptions: typeof toggleOptions !== 'undefined',
            globalFunctions: Object.keys(window).filter(key => typeof window[key] === 'function' && key.includes('toggle')),
            allFilterRelated: Object.keys(window).filter(key => key.toLowerCase().includes('filter'))
        };
    });

    console.log('Page state:');
    console.log('  Main button exists:', pageInfo.hasMainBtn ? 'YES ✅' : 'NO ❌');
    console.log('  Filter container exists:', pageInfo.hasContainer ? 'YES ✅' : 'NO ❌');
    console.log('  toggleOptions function exists:', pageInfo.hasToggleOptions ? 'YES ✅' : 'NO ❌');
    console.log('  Toggle-related functions:', pageInfo.globalFunctions.length > 0 ? pageInfo.globalFunctions.join(', ') : 'NONE');
    console.log('  Filter-related globals:', pageInfo.allFilterRelated.length > 0 ? pageInfo.allFilterRelated.join(', ') : 'NONE');

    await browser.close();
})();
