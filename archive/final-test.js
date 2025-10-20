const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    
    console.log('=== FINAL FILTER BUTTON TEST ===\n');
    
    // Test 1: Check initial state
    const initial = await page.evaluate(() => {
        const btn = document.getElementById('main-filter-btn');
        const container = document.getElementById('new-filter-container');
        return {
            cursor: window.getComputedStyle(btn).cursor,
            hasGradient: window.getComputedStyle(btn).background.includes('radial-gradient'),
            isExpanded: container.classList.contains('filter-expanded')
        };
    });
    
    console.log('1. Initial State:');
    console.log('   Cursor:', initial.cursor, initial.cursor === 'pointer' ? '✅' : '❌');
    console.log('   Has gradient:', initial.hasGradient ? '✅' : '❌');
    console.log('   Initially collapsed:', !initial.isExpanded ? '✅' : '❌');
    
    // Screenshot before
    await page.screenshot({ path: 'final-before-click.png', fullPage: true });
    
    // Test 2: Click to expand
    console.log('\n2. Testing Click to Expand:');
    await page.click('#main-filter-btn');
    await page.waitForTimeout(600);
    
    const afterClick = await page.evaluate(() => {
        const container = document.getElementById('new-filter-container');
        const leftOptions = document.getElementById('filter-options-left');
        const rightOptions = document.getElementById('filter-options-right');
        return {
            isExpanded: container.classList.contains('filter-expanded'),
            leftVisible: leftOptions.classList.contains('visible'),
            rightVisible: rightOptions.classList.contains('visible')
        };
    });
    
    console.log('   Filter expanded:', afterClick.isExpanded ? '✅ SUCCESS!' : '❌ FAILED');
    console.log('   Left options visible:', afterClick.leftVisible ? '✅' : '❌');
    console.log('   Right options visible:', afterClick.rightVisible ? '✅' : '❌');
    
    if (afterClick.isExpanded) {
        await page.screenshot({ path: 'final-expanded.png', fullPage: true });
        console.log('   ✓ Saved final-expanded.png');
        
        // Test 3: Check option buttons have gradients
        const optionGradients = await page.evaluate(() => {
            const btns = document.querySelectorAll('.filter-option-btn');
            let gradientCount = 0;
            btns.forEach(btn => {
                if (window.getComputedStyle(btn).background.includes('radial-gradient')) {
                    gradientCount++;
                }
            });
            return { total: btns.length, withGradient: gradientCount };
        });
        
        console.log('\n3. Option Button Gradients:');
        console.log('   Buttons with gradient:', optionGradients.withGradient, '/', optionGradients.total);
        console.log('   All have gradients:', optionGradients.withGradient === optionGradients.total ? '✅' : '❌');
        
        // Test 4: Click again to collapse
        console.log('\n4. Testing Click to Collapse:');
        await page.click('#main-filter-btn');
        await page.waitForTimeout(600);
        
        const afterSecondClick = await page.evaluate(() => {
            return document.getElementById('new-filter-container').classList.contains('filter-expanded');
        });
        
        console.log('   Filter collapsed:', !afterSecondClick ? '✅' : '❌');
    } else {
        await page.screenshot({ path: 'final-click-failed.png', fullPage: true });
        console.log('   ✓ Saved final-click-failed.png (click did not expand filter)');
    }
    
    console.log('\n=== TEST COMPLETE ===');
    
    await browser.close();
})();
