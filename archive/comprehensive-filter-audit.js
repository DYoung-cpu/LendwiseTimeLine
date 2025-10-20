const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('=== COMPREHENSIVE FILTER BUTTON AUDIT ===\n');

    // Capture console messages and errors
    const consoleMessages = [];
    const jsErrors = [];

    page.on('console', msg => {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', error => {
        jsErrors.push(error.message);
    });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    console.log('Page loaded. Waiting 3 seconds for animations...\n');
    await page.waitForTimeout(3000);

    // Phase 1: Check DOM Elements
    console.log('=== PHASE 1: DOM ELEMENT CHECK ===');
    const domCheck = await page.evaluate(() => {
        const container = document.getElementById('new-filter-container');
        const mainBtn = document.getElementById('main-filter-btn');
        const leftOptions = document.getElementById('filter-options-left');
        const rightOptions = document.getElementById('filter-options-right');
        const filterSections = document.getElementById('filter-sections');
        const borderPath = document.getElementById('border-path');

        return {
            container: !!container,
            mainBtn: !!mainBtn,
            leftOptions: !!leftOptions,
            rightOptions: !!rightOptions,
            filterSections: !!filterSections,
            borderPath: !!borderPath,
            filterSectionsChildren: filterSections?.children.length || 0,
            borderPathD: borderPath?.getAttribute('d')?.substring(0, 50) + '...'
        };
    });

    console.log(`  Container: ${domCheck.container ? '✅' : '❌'}`);
    console.log(`  Main Button: ${domCheck.mainBtn ? '✅' : '❌'}`);
    console.log(`  Left Options: ${domCheck.leftOptions ? '✅' : '❌'}`);
    console.log(`  Right Options: ${domCheck.rightOptions ? '✅' : '❌'}`);
    console.log(`  Filter Sections: ${domCheck.filterSections ? '✅' : '❌'}`);
    console.log(`  Border Path: ${domCheck.borderPath ? '✅' : '❌'}`);
    console.log(`  SVG Sections Count: ${domCheck.filterSectionsChildren}`);
    console.log(`  Border Path D: ${domCheck.borderPathD}\n`);

    // Phase 2: Check Event Listeners
    console.log('=== PHASE 2: EVENT LISTENER CHECK ===');
    const listenerCheck = await page.evaluate(() => {
        const mainBtn = document.getElementById('main-filter-btn');

        // We can't directly check if listeners are attached, but we can check if the button accepts events
        return {
            hasMousedown: true, // We'll test this by actually triggering
            computedPointerEvents: window.getComputedStyle(mainBtn).pointerEvents,
            computedCursor: window.getComputedStyle(mainBtn).cursor,
            isDisabled: mainBtn.hasAttribute('disabled'),
            tabIndex: mainBtn.tabIndex
        };
    });

    console.log(`  Pointer Events: ${listenerCheck.computedPointerEvents}`);
    console.log(`  Cursor: ${listenerCheck.computedCursor}`);
    console.log(`  Disabled: ${listenerCheck.isDisabled}`);
    console.log(`  Tab Index: ${listenerCheck.tabIndex}\n`);

    // Phase 3: Check Computed Styles - Full Chain
    console.log('=== PHASE 3: POINTER-EVENTS CHAIN ===');
    const styleChain = await page.evaluate(() => {
        const mainBtn = document.getElementById('main-filter-btn');
        const chain = [];

        let element = mainBtn;
        while (element) {
            const styles = window.getComputedStyle(element);
            chain.push({
                tag: element.tagName,
                id: element.id || '',
                className: element.className || '',
                pointerEvents: styles.pointerEvents,
                zIndex: styles.zIndex,
                display: styles.display,
                visibility: styles.visibility
            });

            if (element === document.body) break;
            element = element.parentElement;
        }

        return chain;
    });

    styleChain.forEach((item, index) => {
        const blocking = item.pointerEvents === 'none' || item.display === 'none' || item.visibility === 'hidden';
        const indicator = blocking ? '❌' : '✅';
        console.log(`  ${indicator} ${item.tag}${item.id ? '#' + item.id : ''}${item.className ? '.' + item.className.split(' ')[0] : ''}`);
        console.log(`      pointer-events: ${item.pointerEvents}, display: ${item.display}, visibility: ${item.visibility}`);
    });

    // Phase 4: Test Click Functionality
    console.log('\n=== PHASE 4: CLICK TEST ===');

    // Set up click monitoring
    const clickTestResult = await page.evaluate(() => {
        return new Promise((resolve) => {
            const mainBtn = document.getElementById('main-filter-btn');
            let mousedownFired = false;
            let mouseupFired = false;
            let clickFired = false;
            let toggleCalled = false;

            // Monitor mousedown
            const mousedownHandler = () => {
                mousedownFired = true;
            };
            mainBtn.addEventListener('mousedown', mousedownHandler);

            // Monitor mouseup
            const mouseupHandler = () => {
                mouseupFired = true;
            };
            document.addEventListener('mouseup', mouseupHandler);

            // Monitor click
            const clickHandler = () => {
                clickFired = true;
            };
            mainBtn.addEventListener('click', clickHandler);

            // Check if toggle was called by monitoring DOM changes
            const container = document.getElementById('new-filter-container');
            const observer = new MutationObserver((mutations) => {
                if (container.classList.contains('filter-expanded')) {
                    toggleCalled = true;
                }
            });
            observer.observe(container, { attributes: true, attributeFilter: ['class'] });

            // Give it a moment, then resolve
            setTimeout(() => {
                observer.disconnect();
                mainBtn.removeEventListener('mousedown', mousedownHandler);
                document.removeEventListener('mouseup', mouseupHandler);
                mainBtn.removeEventListener('click', clickHandler);

                resolve({
                    mousedownFired,
                    mouseupFired,
                    clickFired,
                    toggleCalled,
                    isExpanded: container.classList.contains('filter-expanded')
                });
            }, 500);

            // Trigger the click
            mainBtn.click();
        });
    });

    console.log(`  Mousedown Event Fired: ${clickTestResult.mousedownFired ? '✅' : '❌'}`);
    console.log(`  Mouseup Event Fired: ${clickTestResult.mouseupFired ? '✅' : '❌'}`);
    console.log(`  Click Event Fired: ${clickTestResult.clickFired ? '✅' : '❌'}`);
    console.log(`  Toggle Function Called: ${clickTestResult.toggleCalled ? '✅' : '❌'}`);
    console.log(`  Filter Expanded State: ${clickTestResult.isExpanded ? 'OPEN' : 'CLOSED'}\n`);

    // Phase 5: Check JavaScript Errors
    console.log('=== PHASE 5: JAVASCRIPT ERRORS ===');
    if (jsErrors.length > 0) {
        console.log('❌ JavaScript Errors Found:');
        jsErrors.forEach(err => console.log(`  - ${err}`));
    } else {
        console.log('✅ No JavaScript errors detected');
    }

    // Phase 6: Check Console Messages (warnings, etc.)
    console.log('\n=== PHASE 6: CONSOLE MESSAGES ===');
    const relevantMessages = consoleMessages.filter(msg =>
        msg.includes('error') || msg.includes('warning') || msg.includes('filter')
    );
    if (relevantMessages.length > 0) {
        relevantMessages.forEach(msg => console.log(`  ${msg}`));
    } else {
        console.log('  No relevant console messages');
    }

    // Phase 7: Visual Verification
    console.log('\n=== PHASE 7: VISUAL STATE ===');
    await page.screenshot({ path: 'filter-audit-before-click.png', fullPage: true });
    console.log('✓ Saved filter-audit-before-click.png');

    // Try clicking with Playwright
    try {
        await page.click('#main-filter-btn');
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'filter-audit-after-click.png', fullPage: true });
        console.log('✓ Saved filter-audit-after-click.png');

        const afterClickState = await page.evaluate(() => {
            const container = document.getElementById('new-filter-container');
            return {
                isExpanded: container.classList.contains('filter-expanded'),
                leftVisible: document.getElementById('filter-options-left').classList.contains('visible'),
                rightVisible: document.getElementById('filter-options-right').classList.contains('visible')
            };
        });

        console.log(`  After Playwright Click - Expanded: ${afterClickState.isExpanded ? '✅' : '❌'}`);
        console.log(`  Left Options Visible: ${afterClickState.leftVisible ? '✅' : '❌'}`);
        console.log(`  Right Options Visible: ${afterClickState.rightVisible ? '✅' : '❌'}`);
    } catch (error) {
        console.log(`❌ Playwright click failed: ${error.message}`);
    }

    // Final Diagnosis
    console.log('\n=== FINAL DIAGNOSIS ===');

    if (!domCheck.mainBtn) {
        console.log('🔴 CRITICAL: Main filter button not found in DOM');
    } else if (listenerCheck.computedPointerEvents === 'none') {
        console.log('🔴 CRITICAL: Button has pointer-events: none');
    } else if (jsErrors.length > 0) {
        console.log('🔴 CRITICAL: JavaScript errors preventing functionality');
    } else if (domCheck.filterSectionsChildren === 0) {
        console.log('⚠️  WARNING: SVG filter sections not created - init may have failed');
    } else if (!clickTestResult.mousedownFired) {
        console.log('🔴 CRITICAL: Mousedown event not firing - event listeners not attached');
    } else if (!clickTestResult.toggleCalled) {
        console.log('⚠️  WARNING: Events fire but toggleOptions() not called - check handleDragEnd logic');
    } else if (clickTestResult.toggleCalled && !clickTestResult.isExpanded) {
        console.log('⚠️  WARNING: toggleOptions() called but expansion failed - check CSS/JS');
    } else {
        console.log('✅ Filter button appears functional!');
    }

    await browser.close();
})();
