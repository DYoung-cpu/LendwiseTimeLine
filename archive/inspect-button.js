const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('http://localhost:3005');
    await page.waitForTimeout(2000);

    // Get all button containers
    const buttons = {
        filter: await page.$('.filter-container'),
        wisr: await page.$('.wisr-button-container'),
        feed: await page.$('.feed-button-container'),
        marketing: await page.$('.marketing-button-container')
    };

    console.log('\n=== BUTTON POSITIONING DEBUG ===\n');

    for (const [name, button] of Object.entries(buttons)) {
        if (button) {
            const box = await button.boundingBox();
            const computed = await button.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    position: styles.position,
                    top: styles.top,
                    left: styles.left,
                    transform: styles.transform,
                    display: styles.display,
                    opacity: styles.opacity,
                    zIndex: styles.zIndex
                };
            });

            console.log(`${name.toUpperCase()}:`);
            console.log(`  BoundingBox: x=${box?.x.toFixed(1)}, y=${box?.y.toFixed(1)}, width=${box?.width.toFixed(1)}`);
            console.log(`  Position: ${computed.position}`);
            console.log(`  Top: ${computed.top}`);
            console.log(`  Left: ${computed.left}`);
            console.log(`  Transform: ${computed.transform}`);
            console.log(`  Display: ${computed.display}`);
            console.log(`  Opacity: ${computed.opacity}`);
            console.log(`  Z-index: ${computed.zIndex}`);
            console.log('');
        } else {
            console.log(`${name.toUpperCase()}: NOT FOUND`);
            console.log('');
        }
    }

    // Check parent container
    const parent = await page.$('.filter-container');
    if (parent) {
        const parentEl = await parent.evaluateHandle(el => el.parentElement);
        const parentComputed = await parentEl.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
                className: el.className,
                position: styles.position,
                display: styles.display
            };
        });
        console.log('PARENT CONTAINER:');
        console.log(`  Class: ${parentComputed.className}`);
        console.log(`  Position: ${parentComputed.position}`);
        console.log(`  Display: ${parentComputed.display}`);
    }

    await page.waitForTimeout(10000);
    await browser.close();
})();
