const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3005/timeline-dev.html');
    await page.waitForLoadState('networkidle');
    
    // Click The Feed button
    await page.click('#feedToggle');
    await page.waitForTimeout(1000);
    
    const audit = await page.evaluate(() => {
        const feedContent = document.getElementById('feedContent');
        const feedView = document.getElementById('feedView');
        
        return {
            feedViewDisplay: feedView ? window.getComputedStyle(feedView).display : null,
            feedViewOpacity: feedView ? window.getComputedStyle(feedView).opacity : null,
            feedContentExists: !!feedContent,
            feedContentHTML: feedContent ? feedContent.innerHTML.substring(0, 300) : null,
            feedContentChildrenCount: feedContent ? feedContent.children.length : 0,
            feedScrollContainer: document.querySelector('.feed-scroll-container') ? 'exists' : 'missing'
        };
    });
    
    console.log(JSON.stringify(audit, null, 2));
    
    await browser.close();
})();
