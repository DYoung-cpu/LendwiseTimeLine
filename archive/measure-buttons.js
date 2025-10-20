const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('http://localhost:3005');
    await page.waitForTimeout(3000);

    const measurements = await page.evaluate(() => {
        const buttons = {
            filter: document.querySelector('.filter-container'),
            wisr: document.querySelector('.wisr-button-container'),
            feed: document.querySelector('.feed-button-container'),
            marketing: document.querySelector('.marketing-button-container')
        };

        const results = {};

        for (const [name, btn] of Object.entries(buttons)) {
            if (btn) {
                const rect = btn.getBoundingClientRect();
                const styles = window.getComputedStyle(btn);
                results[name] = {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    right: rect.right,
                    transform: styles.transform
                };
            }
        }

        return results;
    });

    console.log('BUTTON MEASUREMENTS');
    console.log('FILTER: x=' + measurements.filter.x.toFixed(2) + ', width=' + measurements.filter.width.toFixed(2) + ', right=' + measurements.filter.right.toFixed(2));
    const gap1 = measurements.wisr.x - measurements.filter.right;
    console.log('Gap to WISR: ' + gap1.toFixed(2) + 'px');
    console.log('WISR: x=' + measurements.wisr.x.toFixed(2) + ', width=' + measurements.wisr.width.toFixed(2) + ', right=' + measurements.wisr.right.toFixed(2));
    const gap2 = measurements.feed.x - measurements.wisr.right;
    console.log('Gap to FEED: ' + gap2.toFixed(2) + 'px');
    console.log('FEED: x=' + measurements.feed.x.toFixed(2) + ', width=' + measurements.feed.width.toFixed(2) + ', right=' + measurements.feed.right.toFixed(2));
    const gap3 = measurements.marketing.x - measurements.feed.right;
    console.log('Gap to MARKETING: ' + gap3.toFixed(2) + 'px');
    console.log('MARKETING: x=' + measurements.marketing.x.toFixed(2) + ', width=' + measurements.marketing.width.toFixed(2) + ', right=' + measurements.marketing.right.toFixed(2));

    const leftmost = measurements.filter.x;
    const rightmost = measurements.marketing.right;
    const totalWidth = rightmost - leftmost;
    const centerX = leftmost + (totalWidth / 2);
    const viewportCenterX = page.viewportSize().width / 2;
    const offset = centerX - viewportCenterX;

    console.log('Total width: ' + totalWidth.toFixed(2) + 'px');
    console.log('Offset from center: ' + offset.toFixed(2) + 'px');
    console.log('Shift needed: ' + (-offset).toFixed(2) + 'px');

    await page.waitForTimeout(5000);
    await browser.close();
})();