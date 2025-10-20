const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Verifying glow effect wraps around filter button...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    // Screenshot the result
    await page.locator('.timeline-border-container').screenshot({ path: 'glow-final.png' });
    console.log('✓ Saved glow-final.png');

    // Analyze the border path
    const pathData = await page.evaluate(() => {
        const borderPath = document.getElementById('border-path');
        return borderPath?.getAttribute('d');
    });

    console.log('\n=== BORDER PATH ===');
    console.log(pathData.substring(0, 200) + '...');

    // Check if the path includes negative Y values (wrapping around filter)
    const hasNegativeY = pathData.includes('-');
    console.log('\n=== VERIFICATION ===');
    console.log('Border wraps around filter:', hasNegativeY ? '✓ YES' : '✗ NO');

    console.log('\nBrowser will stay open for 30 seconds for review.');
    await page.waitForTimeout(30000);
    await browser.close();
})();
