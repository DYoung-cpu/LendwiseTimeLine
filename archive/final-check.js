const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Clear any cache
    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    // Take screenshot of initial state (before clicking)
    await page.screenshot({ path: 'initial-state.png', fullPage: false });
    console.log('Screenshot 1: initial-state.png (filter closed)');

    // Click the filter button to expand it
    await page.click('#main-filter-btn');
    await page.waitForTimeout(600);

    await page.screenshot({ path: 'expanded-state.png', fullPage: false });
    console.log('Screenshot 2: expanded-state.png (filter open)');

    // Verify the fixes
    const check = await page.evaluate(() => {
        const svg = document.getElementById('border-svg');
        const container = document.getElementById('new-filter-container');

        return {
            borderTop: svg ? getComputedStyle(svg).top : null,
            borderExtends: svg ? svg.getBoundingClientRect().top : null,
            containerTop: container ? container.getBoundingClientRect().top : null,
            isExpanded: container ? container.classList.contains('filter-expanded') : false
        };
    });

    console.log('\n=== VERIFICATION ===');
    console.log('Border SVG top:', check.borderTop);
    console.log('Border Y position:', check.borderExtends);
    console.log('Container Y position:', check.containerTop);
    console.log('Border overflow:', check.borderExtends < check.containerTop ? `YES, by ${check.containerTop - check.borderExtends}px` : 'NO ✅');
    console.log('Filter expanded:', check.isExpanded ? 'YES ✅' : 'NO');

    await browser.close();
})();
