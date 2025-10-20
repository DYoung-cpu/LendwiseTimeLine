const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('http://localhost:3005/timeline-dev.html');
    await page.waitForTimeout(2000);

    // Measure border container position
    const borderContainerBox = await page.locator('.timeline-border-container').boundingBox();
    console.log('Border Container:', borderContainerBox);

    // Measure SVG border position
    const svgBox = await page.locator('.border-svg').boundingBox();
    console.log('SVG Border:', svgBox);

    // Measure timeline main line position
    const timelineLineBox = await page.locator('.timeline-main-line').boundingBox();
    console.log('Timeline Main Line:', timelineLineBox);

    // Calculate the center of the border container
    const borderCenterY = borderContainerBox.y + (borderContainerBox.height / 2);
    console.log('\n=== MEASUREMENTS ===');
    console.log(`Border Container Top: ${borderContainerBox.y}px`);
    console.log(`Border Container Center: ${borderCenterY}px`);
    console.log(`SVG Border Top: ${svgBox.y}px`);
    console.log(`Timeline Line Top: ${timelineLineBox.y}px`);
    console.log(`\nGap between SVG top and Timeline Line: ${timelineLineBox.y - svgBox.y}px`);
    console.log(`Gap between SVG top and Border Center: ${borderCenterY - svgBox.y}px`);

    // Take screenshot with annotations
    await page.evaluate(() => {
        const borderContainer = document.querySelector('.timeline-border-container');
        const svg = document.querySelector('.border-svg');
        const timeline = document.querySelector('.timeline-main-line');

        // Create measurement overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
        `;

        const borderBox = borderContainer.getBoundingClientRect();
        const svgBox = svg.getBoundingClientRect();
        const timelineBox = timeline.getBoundingClientRect();
        const borderCenterY = borderBox.top + (borderBox.height / 2);

        // Draw horizontal lines
        const lines = [
            { y: svgBox.top, color: 'red', label: `SVG Top: ${svgBox.top.toFixed(1)}px` },
            { y: borderCenterY, color: 'blue', label: `Border Center: ${borderCenterY.toFixed(1)}px` },
            { y: timelineBox.top, color: 'green', label: `Timeline Line: ${timelineBox.top.toFixed(1)}px` }
        ];

        lines.forEach(line => {
            const div = document.createElement('div');
            div.style.cssText = `
                position: absolute;
                top: ${line.y}px;
                left: 0;
                width: 100%;
                height: 2px;
                background: ${line.color};
            `;
            overlay.appendChild(div);

            const label = document.createElement('div');
            label.textContent = line.label;
            label.style.cssText = `
                position: absolute;
                top: ${line.y + 5}px;
                left: 10px;
                background: ${line.color};
                color: white;
                padding: 4px 8px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 4px;
            `;
            overlay.appendChild(label);
        });

        document.body.appendChild(overlay);
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'border-position-before.png', fullPage: false });
    console.log('\nScreenshot saved: border-position-before.png');

    await browser.close();
})();
