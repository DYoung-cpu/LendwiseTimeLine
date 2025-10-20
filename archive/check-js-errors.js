const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 200 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Collect page errors
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push(error.toString());
    });

    console.log('Checking for JavaScript errors...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    // Also check for the specific border path value
    const pathCheck = await page.evaluate(() => {
        const borderPath = document.getElementById('border-path');
        const pathD = borderPath?.getAttribute('d');

        return {
            pathD: pathD,
            pathDLength: pathD?.length || 0,
            pathDSubstring: pathD?.substring(0, 100) || 'null/undefined'
        };
    });

    console.log('=== JAVASCRIPT ERRORS ===');
    if (pageErrors.length > 0) {
        pageErrors.forEach(err => console.log(err));
    } else {
        console.log('No JavaScript errors detected');
    }

    console.log('\n=== CONSOLE MESSAGES (last 10) ===');
    consoleMessages.slice(-10).forEach(msg => console.log(msg));

    console.log('\n=== BORDER PATH CHECK ===');
    console.log('Path D value length:', pathCheck.pathDLength);
    console.log('Path D substring:', pathCheck.pathDSubstring);

    // Screenshot
    await page.locator('.timeline-border-container').screenshot({ path: 'error-check.png' });
    console.log('\n✓ Saved error-check.png');

    console.log('\nBrowser will stay open for 20 seconds.');
    await page.waitForTimeout(20000);
    await browser.close();
})();
