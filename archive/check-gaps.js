const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://localhost:3005');
    await page.waitForTimeout(3000);

    const data = await page.evaluate(() => {
        const buttons = {
            filter: document.querySelector('.filter-container'),
            wisr: document.querySelector('.wisr-button-container'),
            feed: document.querySelector('.feed-button-container'),
            marketing: document.querySelector('.marketing-button-container')
        };
        
        const results = {};
        for (const [name, btn] of Object.entries(buttons)) {
            if (btn) {
                const rect = btn.getBoundingClientRect();
                results[name] = { x: rect.x, right: rect.right, width: rect.width };
            }
        }
        return results;
    });

    const gap1 = data.wisr.x - data.filter.right;
    const gap2 = data.feed.x - data.wisr.right;
    const gap3 = data.marketing.x - data.feed.right;

    console.log('FILTER -> WISR gap: ' + gap1.toFixed(2) + 'px');
    console.log('WISR -> FEED gap: ' + gap2.toFixed(2) + 'px');
    console.log('FEED -> MARKETING gap: ' + gap3.toFixed(2) + 'px');
    
    const avgGap = (gap1 + gap2 + gap3) / 3;
    console.log('\nAverage gap: ' + avgGap.toFixed(2) + 'px');
    console.log('Target uniform gap: ' + avgGap.toFixed(2) + 'px');
    
    const leftmost = data.filter.x;
    const rightmost = data.marketing.right;
    const totalWidth = rightmost - leftmost;
    const centerX = leftmost + (totalWidth / 2);
    const viewportCenter = 1280 / 2;
    const offset = centerX - viewportCenter;
    
    console.log('\nCentering: offset = ' + offset.toFixed(2) + 'px (positive = too far right)');

    await browser.close();
})();
