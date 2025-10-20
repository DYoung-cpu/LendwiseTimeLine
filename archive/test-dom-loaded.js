const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Listen for console messages AND errors
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Check if mainBtn exists and if it has event listeners
    const debug = await page.evaluate(() => {
        const mainBtn = document.getElementById('main-filter-btn');
        return {
            buttonExists: !!mainBtn,
            buttonHTML: mainBtn ? mainBtn.outerHTML.substring(0, 200) : null,
            clickListenerCount: mainBtn ? getEventListeners(mainBtn).click?.length || 0 : 0
        };
    }).catch(e => {
        // getEventListeners might not work in all contexts
        return page.evaluate(() => {
            const mainBtn = document.getElementById('main-filter-btn');
            return {
                buttonExists: !!mainBtn,
                buttonHTML: mainBtn ? mainBtn.outerHTML.substring(0, 200) : null,
                clickListenerCount: 'Cannot check - getEventListeners not available'
            };
        });
    });

    console.log('\n=== DEBUG INFO ===');
    console.log('Button exists:', debug.buttonExists);
    console.log('Button HTML:', debug.buttonHTML);
    console.log('Click listeners:', debug.clickListenerCount);

    await browser.close();
})();
