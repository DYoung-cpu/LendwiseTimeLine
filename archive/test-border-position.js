const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // First, get the current measurements to calculate exact adjustment
  const original = await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    const borderSvg = document.querySelector('.border-svg');
    const mainLine = document.querySelector('.timeline-main-line');
    
    const borderRect = borderContainer.getBoundingClientRect();
    const svgRect = borderSvg.getBoundingClientRect();
    const lineRect = mainLine.getBoundingClientRect();
    
    return {
      borderHeight: borderRect.height,
      svgHeight: svgRect.height,
      svgCenterY: svgRect.top + svgRect.height / 2,
      lineCenterY: lineRect.top + lineRect.height / 2,
      gap: (lineRect.top + lineRect.height / 2) - (svgRect.top + svgRect.height / 2)
    };
  });
  
  console.log('Original measurements:', JSON.stringify(original, null, 2));
  
  // The border needs to move DOWN so its center aligns with the line center
  // Current gap is 17.5px (SVG center is ABOVE line center)
  // We need to shift the entire SVG down by this gap
  // Current top: -35px, New top should be: -35px + 17.5px = -17.5px
  
  // Test the exact centering
  await page.evaluate(() => {
    const borderSvg = document.querySelector('.border-svg');
    if (borderSvg) {
      // Move SVG so its CENTER aligns with line CENTER
      // If borderContainer is already centered on the line,
      // then SVG should have top: 0 to be centered too
      borderSvg.style.top = '0';
      borderSvg.style.height = '100%';
    }
  });
  
  await page.waitForTimeout(500);
  
  const centered = await page.evaluate(() => {
    const borderSvg = document.querySelector('.border-svg');
    const mainLine = document.querySelector('.timeline-main-line');
    
    const svgRect = borderSvg.getBoundingClientRect();
    const lineRect = mainLine.getBoundingClientRect();
    
    return {
      svgCenterY: svgRect.top + svgRect.height / 2,
      lineCenterY: lineRect.top + lineRect.height / 2,
      gap: (lineRect.top + lineRect.height / 2) - (svgRect.top + svgRect.height / 2)
    };
  });
  
  console.log('\nWith top: 0:', JSON.stringify(centered, null, 2));
  
  // Scroll to timeline and take screenshot
  await page.evaluate(() => {
    const mainLine = document.querySelector('.timeline-main-line');
    if (mainLine) {
      mainLine.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'border-centered-on-line.png', fullPage: false });
  console.log('\nScreenshot saved: border-centered-on-line.png');
  
  await browser.close();
})();
