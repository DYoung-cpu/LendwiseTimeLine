const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Listen to console
    page.on('console', msg => console.log('CONSOLE:', msg.text()));

    await page.goto('http://localhost:3005/timeline-dev.html');
    await page.waitForTimeout(4000); // Wait for intro animation

    // Take screenshot of filter area
    const filterArea = await page.locator('.new-filter-container');
    await filterArea.screenshot({ path: 'filter-duplicate-debug.png' });

    // Inspect what's actually in the DOM
    const filterHTML = await page.evaluate(() => {
        const container = document.querySelector('.new-filter-container');
        return container ? container.outerHTML : 'NOT FOUND';
    });

    console.log('\n=== FILTER HTML ===');
    console.log(filterHTML.substring(0, 1000));

    // Check computed styles on the button
    const buttonStyles = await page.evaluate(() => {
        const btn = document.querySelector('.new-filter-btn');
        if (!btn) return 'BUTTON NOT FOUND';

        const computed = window.getComputedStyle(btn);
        return {
            background: computed.background,
            position: computed.position,
            zIndex: computed.zIndex,
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity
        };
    });

    console.log('\n=== BUTTON COMPUTED STYLES ===');
    console.log(JSON.stringify(buttonStyles, null, 2));

    // Check if there are multiple elements overlapping
    const elementsAt = await page.evaluate(() => {
        const btn = document.querySelector('.new-filter-btn');
        if (!btn) return [];

        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const elements = document.elementsFromPoint(centerX, centerY);
        return elements.map(el => ({
            tag: el.tagName,
            classes: el.className,
            id: el.id,
            text: el.textContent?.substring(0, 50)
        }));
    });

    console.log('\n=== ELEMENTS AT BUTTON CENTER (top to bottom) ===');
    elementsAt.forEach((el, i) => {
        console.log(`${i}: <${el.tag}> class="${el.classes}" id="${el.id}" text="${el.text}"`);
    });

    console.log('\n✅ Screenshot saved to filter-duplicate-debug.png');
    console.log('Check the layers above to see what\'s covering the button');

    await browser.close();
})();
