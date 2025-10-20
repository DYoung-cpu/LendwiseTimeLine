const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('Opening page with updated CSS...');
    await page.goto('http://localhost:8000/timeline-dev.html?v=' + Date.now());

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const svgInfo = await page.evaluate(() => {
        const path = document.getElementById('border-path');
        if (!path) return null;

        const computed = window.getComputedStyle(path);
        return {
            stroke: computed.stroke,
            strokeWidth: computed.strokeWidth,
            isVisible: computed.stroke !== 'none' &&
                       computed.strokeWidth !== '0px' &&
                       computed.display !== 'none' &&
                       computed.visibility === 'visible'
        };
    });

    console.log('\n=== SVG BORDER STATUS ===');
    console.log(`Stroke color: ${svgInfo.stroke}`);
    console.log(`Stroke width: ${svgInfo.strokeWidth}`);
    console.log(`Is visible: ${svgInfo.isVisible ? '✓ YES' : '✗ NO'}`);

    await page.screenshot({
        path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/svg-fixed.png',
        fullPage: true
    });
    console.log('\nScreenshot saved to: svg-fixed.png');

    console.log('\nBrowser will stay open for 5 seconds...');
    await page.waitForTimeout(5000);

    await browser.close();
    console.log('Done!');
})();
