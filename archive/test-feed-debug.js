const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    await page.goto('http://localhost:3005/timeline-dev.html');
    await page.waitForTimeout(3000);
    
    // Click The Feed button
    await page.click('#feedToggle');
    await page.waitForTimeout(2000);
    
    // Check if feed items exist
    const feedContent = await page.evaluate(() => {
        const feedElement = document.getElementById('feedContent');
        return {
            exists: !!feedElement,
            innerHTML: feedElement ? feedElement.innerHTML.substring(0, 500) : null,
            childCount: feedElement ? feedElement.children.length : 0
        };
    });
    
    console.log('Feed Content:', feedContent);
    
    await page.waitForTimeout(5000);
    await browser.close();
})();
