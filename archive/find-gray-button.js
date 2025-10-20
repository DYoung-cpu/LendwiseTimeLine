const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    const allElements = await page.evaluate(() => {
        const filterContainer = document.getElementById('new-filter-container');
        if (!filterContainer) return [];

        // Get all elements in and around the filter container
        const elements = Array.from(filterContainer.querySelectorAll('*'));

        return elements.map(el => ({
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            html: el.outerHTML.substring(0, 150),
            rect: el.getBoundingClientRect(),
            bg: getComputedStyle(el).background,
            bgColor: getComputedStyle(el).backgroundColor,
            borderRadius: getComputedStyle(el).borderRadius,
            zIndex: getComputedStyle(el).zIndex
        })).filter(el => {
            // Filter for elements that might be the gray button
            const hasRoundedCorners = el.borderRadius && el.borderRadius !== '0px';
            const isNearTop = el.rect.top < 300;
            const hasBackground = el.bgColor !== 'rgba(0, 0, 0, 0)';
            return hasRoundedCorners && isNearTop && hasBackground;
        });
    });

    console.log('=== ELEMENTS WITH ROUNDED CORNERS NEAR FILTER BUTTON ===');
    allElements.forEach((el, i) => {
        console.log(`\n${i + 1}. ${el.tag} ${el.id ? `#${el.id}` : ''} .${el.classes}`);
        console.log(`   Position: (${el.rect.left}, ${el.rect.top})`);
        console.log(`   Size: ${el.rect.width} x ${el.rect.height}`);
        console.log(`   Background: ${el.bgColor}`);
        console.log(`   Border radius: ${el.borderRadius}`);
        console.log(`   HTML: ${el.html}`);
    });

    await browser.close();
})();
