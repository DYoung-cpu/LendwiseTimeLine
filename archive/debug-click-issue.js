const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    
    console.log('=== DEBUGGING FILTER BUTTON ===\n');
    
    // Wait for filter button to appear
    await page.waitForTimeout(4000);
    
    const debug = await page.evaluate(() => {
        const mainBtn = document.getElementById('main-filter-btn');
        const container = document.getElementById('new-filter-container');
        
        // Get all event listeners
        const listeners = [];
        
        // Check if variables are initialized
        return {
            buttonExists: !!mainBtn,
            containerExists: !!container,
            buttonHTML: mainBtn ? mainBtn.outerHTML.substring(0, 200) : 'null',
            containerClasses: container ? container.className : 'null',
            cursor: mainBtn ? window.getComputedStyle(mainBtn).cursor : 'null',
            background: mainBtn ? window.getComputedStyle(mainBtn).background.substring(0, 100) : 'null',
            hasClickListener: mainBtn ? true : false // Can't easily detect listeners
        };
    });
    
    console.log('Button exists:', debug.buttonExists ? '✅' : '❌');
    console.log('Container exists:', debug.containerExists ? '✅' : '❌');
    console.log('Cursor:', debug.cursor);
    console.log('Background:', debug.background);
    console.log('Container classes:', debug.containerClasses);
    
    console.log('\n--- Attempting click ---');
    
    try {
        // Try clicking
        await page.click('#main-filter-btn');
        await page.waitForTimeout(1000);
        
        const afterClick = await page.evaluate(() => {
            const container = document.getElementById('new-filter-container');
            return {
                hasExpandedClass: container.classList.contains('filter-expanded'),
                classes: container.className
            };
        });
        
        console.log('Expanded:', afterClick.hasExpandedClass ? '✅' : '❌');
        console.log('Classes after click:', afterClick.classes);
        
        if (afterClick.hasExpandedClass) {
            await page.screenshot({ path: 'debug-expanded.png' });
            console.log('✓ Saved debug-expanded.png');
        } else {
            await page.screenshot({ path: 'debug-no-expand.png' });
            console.log('✓ Saved debug-no-expand.png (button did NOT expand)');
        }
    } catch (error) {
        console.log('❌ Click failed:', error.message);
    }
    
    await page.waitForTimeout(3000);
    await browser.close();
})();
