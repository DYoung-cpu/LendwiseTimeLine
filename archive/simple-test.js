const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    console.log('Opening page...');
    await page.goto('http://localhost:8000/timeline-dev.html');

    console.log('Waiting 5 seconds for initialization...');
    await page.waitForTimeout(5000);

    const card9Status = await page.evaluate(() => {
        const card9 = document.querySelectorAll('.gallery-card')[9];
        return {
            title: card9.querySelector('h3')?.textContent,
            borderColor: card9.style.borderColor,
            boxShadow: card9.style.boxShadow,
            hasGold: card9.style.borderColor?.includes('255, 215, 0') || false
        };
    });

    console.log('\nCard 9 status:', card9Status);
    console.log(`\nCard 9 is ${card9Status.hasGold ? '✅ GLOWING' : '❌ NOT GLOWING'}`);

    await page.screenshot({ path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/simple-test.png' });
    console.log('\nScreenshot saved. Browser will stay open for manual inspection...');

    await page.waitForTimeout(60000);
    await browser.close();
})();
