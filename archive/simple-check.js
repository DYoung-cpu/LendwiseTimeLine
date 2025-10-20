const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    const logs = [];
    page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(7000);

    const data = await page.evaluate(() => {
        const borderPath = document.getElementById('border-path');
        return borderPath?.getAttribute('d') || 'none';
    });

    console.log('Border path D attribute:', data.substring(0, 100));
    console.log('\nRelevant logs:');
    logs.filter(l => l.includes('createMain') || l.includes('borderContainer')).forEach(l => console.log(l));

    await browser.close();
})();
