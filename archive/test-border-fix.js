const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('http://localhost:3005/timeline-dev.html');
    await page.waitForTimeout(2000);

    // Measure positions after fix
    const borderContainerBox = await page.locator('.timeline-border-container').boundingBox();
    const svgBox = await page.locator('.border-svg').boundingBox();
    const timelineLineBox = await page.locator('.timeline-main-line').boundingBox();

    const borderCenterY = borderContainerBox.y + (borderContainerBox.height / 2);

    console.log('=== AFTER FIX MEASUREMENTS ===');
    console.log(`Border Container Top: ${borderContainerBox.y}px`);
    console.log(`Border Container Center: ${borderCenterY}px`);
    console.log(`SVG Border Top: ${svgBox.y}px`);
    console.log(`SVG Border Center: ${svgBox.y + (svgBox.height / 2)}px`);
    console.log(`Timeline Line Top: ${timelineLineBox.y}px`);
    console.log(`\nAlignment Check:`);
    console.log(`  SVG Top vs Timeline Line: ${Math.abs(svgBox.y - timelineLineBox.y).toFixed(2)}px difference`);
    console.log(`  SVG Center vs Timeline Line: ${Math.abs(svgBox.y + (svgBox.height / 2) - timelineLineBox.y).toFixed(2)}px difference`);
    console.log(`  Border Center vs Timeline Line: ${Math.abs(borderCenterY - timelineLineBox.y).toFixed(2)}px difference`);

    await browser.close();
})();
