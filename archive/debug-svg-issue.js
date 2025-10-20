const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 200 });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('Debugging SVG rendering issue...\n');
    await page.goto('http://localhost:8000/timeline-dev.html');
    await page.waitForTimeout(6000);

    // Check SVG rendering and function execution
    const debug = await page.evaluate(() => {
        const filterSections = document.getElementById('filter-sections');
        const filterBorder = document.getElementById('filter-border');
        const borderPath = document.getElementById('border-path');

        // Check if functions exist
        const hasCreateFilterSections = typeof window.createFilterSections !== 'undefined';
        const hasCreateFilterBorder = typeof window.createFilterBorder !== 'undefined';
        const hasCreateMainBorderPath = typeof window.createMainBorderPath !== 'undefined';

        // Try to manually call the functions if they exist
        let manualCallError = null;
        try {
            if (typeof createFilterSections === 'function') {
                createFilterSections(false);
            }
            if (typeof createFilterBorder === 'function') {
                createFilterBorder(false);
            }
            if (typeof createMainBorderPath === 'function') {
                const path = createMainBorderPath(false);
                if (borderPath) {
                    borderPath.setAttribute('d', path);
                }
            }
        } catch (e) {
            manualCallError = e.message;
        }

        return {
            filterSectionsHTML: filterSections?.outerHTML.substring(0, 200),
            filterBorderHTML: filterBorder?.outerHTML.substring(0, 200),
            borderPathD: borderPath?.getAttribute('d'),
            borderPathExists: !!borderPath,
            hasCreateFilterSections,
            hasCreateFilterBorder,
            hasCreateMainBorderPath,
            manualCallError,
            childrenAfterCall: filterSections?.children.length || 0
        };
    });

    console.log('=== DEBUG INFO ===');
    console.log('Border path exists:', debug.borderPathExists);
    console.log('Border path D attribute:', debug.borderPathD ? 'Has value' : 'undefined/null');
    console.log('\n=== FUNCTION AVAILABILITY ===');
    console.log('createFilterSections exists:', debug.hasCreateFilterSections);
    console.log('createFilterBorder exists:', debug.hasCreateFilterBorder);
    console.log('createMainBorderPath exists:', debug.hasCreateMainBorderPath);
    console.log('\n=== MANUAL CALL RESULT ===');
    console.log('Error:', debug.manualCallError || 'None');
    console.log('Children after manual call:', debug.childrenAfterCall);
    console.log('\n=== SVG HTML ===');
    console.log('Filter sections:', debug.filterSectionsHTML);
    console.log('Filter border:', debug.filterBorderHTML);

    // Screenshot after manual call
    await page.locator('.timeline-border-container').screenshot({ path: 'debug-after-manual-call.png' });
    console.log('\n✓ Saved debug-after-manual-call.png');

    console.log('\nBrowser will stay open for 30 seconds.');
    await page.waitForTimeout(30000);
    await browser.close();
})();
