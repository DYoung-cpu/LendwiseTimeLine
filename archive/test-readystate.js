const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });

    // Inject a script right before the filter script would run
    const state = await page.evaluate(() => {
        return document.readyState;
    });

    console.log('Document ready state when page finishes loading:', state);
    console.log('');
    console.log('If this is "complete" or "interactive", DOMContentLoaded has ALREADY fired!');
    console.log('This means the event listener is added AFTER the event happened.');

    await browser.close();
})();
