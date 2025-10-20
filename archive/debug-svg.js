const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('Opening page...');
    await page.goto('http://localhost:8000/timeline-dev.html');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for animations

    console.log('\n=== SVG ELEMENT INSPECTION ===\n');

    // Check if SVG exists in DOM
    const svgExists = await page.locator('#border-svg').count();
    console.log(`SVG element exists: ${svgExists > 0 ? 'YES' : 'NO'}`);

    if (svgExists) {
        // Get SVG attributes
        const svgAttrs = await page.evaluate(() => {
            const svg = document.getElementById('border-svg');
            const path = document.getElementById('border-path');

            return {
                svg: {
                    width: svg.getAttribute('width'),
                    height: svg.getAttribute('height'),
                    viewBox: svg.getAttribute('viewBox'),
                    clientWidth: svg.clientWidth,
                    clientHeight: svg.clientHeight,
                    offsetWidth: svg.offsetWidth,
                    offsetHeight: svg.offsetHeight,
                    className: svg.className,
                    style: {
                        display: window.getComputedStyle(svg).display,
                        visibility: window.getComputedStyle(svg).visibility,
                        opacity: window.getComputedStyle(svg).opacity,
                        position: window.getComputedStyle(svg).position,
                        zIndex: window.getComputedStyle(svg).zIndex,
                        top: window.getComputedStyle(svg).top,
                        left: window.getComputedStyle(svg).left,
                        width: window.getComputedStyle(svg).width,
                        height: window.getComputedStyle(svg).height,
                        pointerEvents: window.getComputedStyle(svg).pointerEvents
                    },
                    boundingRect: svg.getBoundingClientRect()
                },
                path: path ? {
                    d: path.getAttribute('d'),
                    fill: path.getAttribute('fill'),
                    stroke: path.getAttribute('stroke'),
                    strokeWidth: path.getAttribute('stroke-width'),
                    style: {
                        stroke: window.getComputedStyle(path).stroke,
                        strokeWidth: window.getComputedStyle(path).strokeWidth,
                        fill: window.getComputedStyle(path).fill,
                        display: window.getComputedStyle(path).display,
                        visibility: window.getComputedStyle(path).visibility,
                        opacity: window.getComputedStyle(path).opacity
                    },
                    boundingRect: path.getBoundingClientRect()
                } : null
            };
        });

        console.log('SVG Attributes:');
        console.log(JSON.stringify(svgAttrs.svg, null, 2));

        console.log('\nPath Attributes:');
        console.log(JSON.stringify(svgAttrs.path, null, 2));

        // Check if path coordinates are valid
        if (svgAttrs.path && svgAttrs.path.d) {
            console.log('\n=== PATH ANALYSIS ===');
            console.log('Path "d" attribute:', svgAttrs.path.d.substring(0, 200) + '...');

            // Extract some coordinates to check if they're reasonable
            const coords = svgAttrs.path.d.match(/[-]?\d+(\.\d+)?/g);
            if (coords && coords.length > 0) {
                console.log(`Found ${coords.length} numeric values in path`);
                console.log('First 10 values:', coords.slice(0, 10).join(', '));
            }
        }

        // Check parent container
        const containerInfo = await page.evaluate(() => {
            const container = document.querySelector('.timeline-border-container');
            if (!container) return null;

            const style = window.getComputedStyle(container);
            return {
                width: container.offsetWidth,
                height: container.offsetHeight,
                style: {
                    position: style.position,
                    display: style.display,
                    visibility: style.visibility,
                    overflow: style.overflow
                },
                boundingRect: container.getBoundingClientRect()
            };
        });

        console.log('\n=== PARENT CONTAINER ===');
        console.log(JSON.stringify(containerInfo, null, 2));

        // Check if CSS file is loaded
        const cssLoaded = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            return links.map(link => ({
                href: link.href,
                loaded: link.sheet !== null
            }));
        });

        console.log('\n=== CSS FILES ===');
        cssLoaded.forEach(css => {
            console.log(`${css.loaded ? '✓' : '✗'} ${css.href}`);
        });

        // Get the actual computed styles from the CSS classes
        const cssRules = await page.evaluate(() => {
            const rules = [];
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if (rule.selectorText &&
                            (rule.selectorText.includes('.border-svg') ||
                             rule.selectorText.includes('.border-path'))) {
                            rules.push({
                                selector: rule.selectorText,
                                cssText: rule.style.cssText
                            });
                        }
                    }
                } catch (e) {
                    // Cross-origin stylesheets
                }
            }
            return rules;
        });

        console.log('\n=== CSS RULES FOR SVG ===');
        cssRules.forEach(rule => {
            console.log(`${rule.selector}:`);
            console.log(`  ${rule.cssText}`);
        });

        console.log('\n=== VISIBILITY TEST ===');

        // Now let's make it highly visible
        console.log('Applying high visibility styles...');
        await page.evaluate(() => {
            const path = document.getElementById('border-path');
            if (path) {
                path.setAttribute('stroke', '#00ff00');
                path.setAttribute('stroke-width', '5');
                path.style.stroke = '#00ff00';
                path.style.strokeWidth = '5px';
            }

            const svg = document.getElementById('border-svg');
            if (svg) {
                svg.style.zIndex = '10001';
            }
        });

        await page.waitForTimeout(1000);

        const afterChange = await page.evaluate(() => {
            const path = document.getElementById('border-path');
            const svg = document.getElementById('border-svg');
            return {
                pathStroke: path ? window.getComputedStyle(path).stroke : null,
                pathStrokeWidth: path ? window.getComputedStyle(path).strokeWidth : null,
                svgZIndex: svg ? window.getComputedStyle(svg).zIndex : null
            };
        });

        console.log('After applying green border:');
        console.log(JSON.stringify(afterChange, null, 2));

        console.log('\n=== SCREENSHOT SAVED ===');
        await page.screenshot({ path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/svg-debug.png', fullPage: true });

    } else {
        console.log('ERROR: SVG element not found in DOM!');
    }

    console.log('\nPress Enter to close browser...');
    await new Promise(resolve => {
        process.stdin.once('data', resolve);
    });

    await browser.close();
})();
