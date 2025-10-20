const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    
    console.log('=== FILTER BUTTON FUNCTIONALITY TEST ===\n');
    
    // Wait for filter button to appear (3.5s animation delay)
    await page.waitForTimeout(4000);
    
    // Take before screenshot
    await page.screenshot({ path: 'filter-before-click.png', fullPage: true });
    console.log('✓ Saved filter-before-click.png');

    // Test 1: Check gradient background exists
    const hasGradient = await page.evaluate(() => {
        const btn = document.getElementById('main-filter-btn');
        const styles = window.getComputedStyle(btn);
        const bg = styles.background;
        return bg.includes('radial-gradient');
    });
    console.log(`\n1. Main button has radial gradient: ${hasGradient ? '✅' : '❌'}`);

    // Test 2: Click the filter button
    console.log('\n2. Testing filter button click...');
    try {
        await page.click('#main-filter-btn', { timeout: 3000 });
        await page.waitForTimeout(500); // Wait for expand animation

        const isExpanded = await page.evaluate(() => {
            const container = document.getElementById('new-filter-container');
            return container.classList.contains('filter-expanded');
        });

        console.log(`   Filter expanded: ${isExpanded ? '✅ SUCCESS!' : '❌ FAILED'}`);

        if (isExpanded) {
            // Take after expansion screenshot
            await page.screenshot({ path: 'filter-expanded.png', fullPage: true });
            console.log('   ✓ Saved filter-expanded.png');

            // Test 3: Check if option buttons are visible
            const optionButtonsVisible = await page.evaluate(() => {
                const buttons = document.querySelectorAll('.filter-option-btn');
                let visibleCount = 0;
                buttons.forEach(btn => {
                    const opacity = window.getComputedStyle(btn).opacity;
                    if (parseFloat(opacity) > 0) visibleCount++;
                });
                return {
                    total: buttons.length,
                    visible: visibleCount
                };
            });
            console.log(`\n3. Option buttons visible: ${optionButtonsVisible.visible}/${optionButtonsVisible.total} ${optionButtonsVisible.visible === optionButtonsVisible.total ? '✅' : '❌'}`);

            // Test 4: Check option buttons have gradients
            const optionsHaveGradients = await page.evaluate(() => {
                const buttons = document.querySelectorAll('.filter-option-btn');
                const results = [];
                buttons.forEach(btn => {
                    const bg = window.getComputedStyle(btn).background;
                    results.push({
                        class: btn.className,
                        hasGradient: bg.includes('radial-gradient')
                    });
                });
                return results;
            });
            
            console.log('\n4. Option buttons gradient check:');
            optionsHaveGradients.forEach(result => {
                const name = result.class.split(' ').pop();
                console.log(`   ${name}: ${result.hasGradient ? '✅' : '❌'}`);
            });

            // Test 5: Hover simulation (check color variables)
            console.log('\n5. Testing hover color animations...');
            await page.hover('#main-filter-btn');
            await page.waitForTimeout(300);
            
            const hoverColors = await page.evaluate(() => {
                const btn = document.getElementById('main-filter-btn');
                const style = window.getComputedStyle(btn);
                return {
                    color1: style.getPropertyValue('--color-1'),
                    color2: style.getPropertyValue('--color-2'),
                    posX: style.getPropertyValue('--pos-x'),
                    posY: style.getPropertyValue('--pos-y')
                };
            });
            
            console.log(`   Main button hover colors: ${hoverColors.color1 ? '✅' : '❌'}`);
            console.log(`   Position shift (${hoverColors.posX}, ${hoverColors.posY})`);

            // Take hover screenshot
            await page.screenshot({ path: 'filter-hover.png', fullPage: true });
            console.log('   ✓ Saved filter-hover.png');
        }
    } catch (error) {
        console.log(`   ❌ Click test failed: ${error.message}`);
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Screenshots saved:');
    console.log('  - filter-before-click.png');
    console.log('  - filter-expanded.png (if click worked)');
    console.log('  - filter-hover.png (if hover worked)');

    await browser.close();
})();
