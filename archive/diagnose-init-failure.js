const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console and errors
    const logs = [];
    page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    console.log('=== FILTER INITIALIZATION DIAGNOSTIC ===\n');

    const diagnostic = await page.evaluate(() => {
        // Check if elements exist
        const container = document.getElementById('new-filter-container');
        const mainBtn = document.getElementById('main-filter-btn');
        const borderContainer = document.querySelector('.timeline-border-container');
        const borderSvg = document.getElementById('border-svg');
        const borderPath = document.getElementById('border-path');
        const filterSections = document.getElementById('filter-sections');

        if (!borderContainer) return { error: 'Border container not found' };

        // Check border container dimensions
        const containerRect = borderContainer.getBoundingClientRect();

        // Check if init functions are defined
        const hasInitBorder = typeof window.initBorder !== 'undefined';
        const hasCreateMainBorderPath = typeof window.createMainBorderPath !== 'undefined';
        const hasCreateFilterSections = typeof window.createFilterSections !== 'undefined';

        // Try to manually call init to see what happens
        let initError = null;
        try {
            // Check if the functions exist in scope
            const scripts = Array.from(document.scripts);
            const filterScript = scripts.find(s => s.textContent.includes('initBorder'));
            const hasScript = !!filterScript;

            return {
                elements: {
                    container: !!container,
                    mainBtn: !!mainBtn,
                    borderContainer: !!borderContainer,
                    borderSvg: !!borderSvg,
                    borderPath: !!borderPath,
                    filterSections: !!filterSections
                },
                dimensions: {
                    offsetWidth: borderContainer.offsetWidth,
                    offsetHeight: borderContainer.offsetHeight,
                    clientWidth: borderContainer.clientWidth,
                    clientHeight: borderContainer.clientHeight,
                    boundingWidth: containerRect.width,
                    boundingHeight: containerRect.height
                },
                svg: {
                    exists: !!borderPath,
                    dAttribute: borderPath?.getAttribute('d'),
                    dAttributeLength: borderPath?.getAttribute('d')?.length || 0,
                    viewBox: borderSvg?.getAttribute('viewBox')
                },
                filterSections: {
                    exists: !!filterSections,
                    childCount: filterSections?.children.length || 0,
                    innerHTML: filterSections?.innerHTML.substring(0, 100)
                },
                script: {
                    hasFilterScript: hasScript,
                    scriptCount: scripts.length
                }
            };
        } catch (e) {
            return { error: e.message };
        }
    });

    if (diagnostic.error) {
        console.log(`❌ Error: ${diagnostic.error}`);
    } else {
        console.log('ELEMENTS:');
        console.log(`  Container: ${diagnostic.elements.container ? '✅' : '❌'}`);
        console.log(`  Main Button: ${diagnostic.elements.mainBtn ? '✅' : '❌'}`);
        console.log(`  Border Container: ${diagnostic.elements.borderContainer ? '✅' : '❌'}`);
        console.log(`  Border SVG: ${diagnostic.elements.borderSvg ? '✅' : '❌'}`);
        console.log(`  Border Path: ${diagnostic.elements.borderPath ? '✅' : '❌'}`);
        console.log(`  Filter Sections: ${diagnostic.elements.filterSections ? '✅' : '❌'}`);

        console.log('\nDIMENSIONS (border container):');
        console.log(`  offsetWidth: ${diagnostic.dimensions.offsetWidth}px`);
        console.log(`  offsetHeight: ${diagnostic.dimensions.offsetHeight}px`);
        console.log(`  clientWidth: ${diagnostic.dimensions.clientWidth}px`);
        console.log(`  clientHeight: ${diagnostic.dimensions.clientHeight}px`);

        console.log('\nSVG STATE:');
        console.log(`  Border Path exists: ${diagnostic.svg.exists ? '✅' : '❌'}`);
        console.log(`  D attribute: ${diagnostic.svg.dAttribute ? diagnostic.svg.dAttribute.substring(0, 50) + '...' : 'NULL'}`);
        console.log(`  D attribute length: ${diagnostic.svg.dAttributeLength} chars`);
        console.log(`  ViewBox: ${diagnostic.svg.viewBox || 'NULL'}`);

        console.log('\nFILTER SECTIONS:');
        console.log(`  Exists: ${diagnostic.filterSections.exists ? '✅' : '❌'}`);
        console.log(`  Children count: ${diagnostic.filterSections.childCount}`);
        console.log(`  innerHTML: ${diagnostic.filterSections.innerHTML || '(empty)'}`);

        console.log('\nSCRIPT:');
        console.log(`  Has filter script: ${diagnostic.script.hasFilterScript ? '✅' : '❌'}`);
        console.log(`  Total scripts: ${diagnostic.script.scriptCount}`);

        console.log('\n=== DIAGNOSIS ===');
        if (diagnostic.dimensions.offsetWidth === 0 || diagnostic.dimensions.offsetHeight === 0) {
            console.log('🔴 Border container has 0 dimensions - init will fail!');
        } else if (diagnostic.svg.dAttributeLength === 0 || !diagnostic.svg.dAttribute) {
            console.log('🔴 Border path not initialized - initBorder() not running');
        } else if (diagnostic.filterSections.childCount === 0) {
            console.log('🔴 Filter sections not created - createFilterSections() not running');
        } else {
            console.log('✅ SVG appears initialized');
        }
    }

    console.log('\n=== CONSOLE LOGS ===');
    logs.forEach(log => console.log(`  ${log}`));

    await browser.close();
})();
