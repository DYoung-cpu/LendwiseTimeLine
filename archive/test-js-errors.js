const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const errors = [];
    page.on('pageerror', error => {
        errors.push(error.message);
        console.log('❌ JAVASCRIPT ERROR:', error.message);
    });

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('FILTER') || text.includes('DOM LOADED')) {
            console.log('✅ FOUND:', text);
        }
    });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log('\n=== RESULTS ===');
    console.log('Total JS errors:', errors.length);
    if (errors.length > 0) {
        console.log('Errors:');
        errors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
    } else {
        console.log('No JavaScript errors detected');
    }

    await browser.close();
})();
