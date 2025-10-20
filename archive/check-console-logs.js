const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Collect all console messages
    const logs = [];
    page.on('console', msg => {
        logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    console.log('Checking console logs...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    // Check border path
    const check = await page.evaluate(() => {
        const borderPath = document.getElementById('border-path');
        return {
            pathD: borderPath?.getAttribute('d'),
            pathLength: borderPath?.getAttribute('d')?.length || 0
        };
    });

    console.log('=== CONSOLE LOGS (filter-related) ===');
    const filterLogs = logs.filter(log => log.includes('border') || log.includes('filter') || log.includes('Main') || log.includes('ERROR'));
    filterLogs.forEach(log => console.log(log));

    console.log('\n=== BORDER PATH ===');
    console.log('Length:', check.pathLength);
    if (check.pathLength > 0) {
        console.log('First 100 chars:', check.pathD.substring(0, 100));
    }

    await page.screenshot({ path: 'console-check.png' });
    console.log('\n✓ Saved console-check.png');

    await browser.close();
})();
