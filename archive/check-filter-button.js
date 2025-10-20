const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });

    // Wait for animation to complete (3.5s delay + 0.5s animation = 4s)
    await page.waitForTimeout(5000);

    const filterCheck = await page.evaluate(() => {
        const filterContainer = document.querySelector('.new-filter-container');
        const filterButton = document.getElementById('main-filter-btn');
        const filterSections = document.getElementById('filter-sections');
        const filterBorder = document.getElementById('filter-border');

        if (!filterContainer) return { error: 'Filter container not found' };

        const rect = filterContainer.getBoundingClientRect();
        const styles = window.getComputedStyle(filterContainer);

        return {
            exists: !!filterContainer,
            display: styles.display,
            opacity: styles.opacity,
            visibility: styles.visibility,
            zIndex: styles.zIndex,
            top: styles.top,
            left: styles.left,
            position: styles.position,
            rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
            },
            buttonExists: !!filterButton,
            buttonText: filterButton?.textContent,
            svgExists: !!filterSections,
            borderExists: !!filterBorder
        };
    });

    console.log('=== FILTER BUTTON CHECK ===\n');

    if (filterCheck.error) {
        console.log('❌ ERROR:', filterCheck.error);
    } else {
        console.log('Filter Container:');
        console.log('  Exists:', filterCheck.exists);
        console.log('  Display:', filterCheck.display);
        console.log('  Opacity:', filterCheck.opacity);
        console.log('  Visibility:', filterCheck.visibility);
        console.log('  Z-Index:', filterCheck.zIndex);
        console.log('  Position:', filterCheck.position);
        console.log('  Top:', filterCheck.top);
        console.log('  Left:', filterCheck.left);
        console.log('\nBounding Box:');
        console.log('  X:', filterCheck.rect.x);
        console.log('  Y:', filterCheck.rect.y);
        console.log('  Width:', filterCheck.rect.width);
        console.log('  Height:', filterCheck.rect.height);
        console.log('\nElements:');
        console.log('  Button exists:', filterCheck.buttonExists);
        console.log('  Button text:', filterCheck.buttonText);
        console.log('  SVG sections exists:', filterCheck.svgExists);
        console.log('  SVG border exists:', filterCheck.borderExists);

        if (filterCheck.opacity === '1' && filterCheck.display !== 'none') {
            console.log('\n✅ Filter button is visible!');
        } else {
            console.log('\n⚠️  Filter button is NOT visible!');
            console.log('   Opacity:', filterCheck.opacity, '(should be 1)');
            console.log('   Display:', filterCheck.display, '(should not be none)');
        }
    }

    await browser.close();
})();
