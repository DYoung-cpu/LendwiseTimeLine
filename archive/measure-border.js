const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const measurements = await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    const borderSvg = document.querySelector('.border-svg');
    const mainLine = document.querySelector('.timeline-main-line');
    
    if (!borderContainer || !borderSvg || !mainLine) {
      return { error: 'Elements not found' };
    }
    
    const borderRect = borderContainer.getBoundingClientRect();
    const svgRect = borderSvg.getBoundingClientRect();
    const lineRect = mainLine.getBoundingClientRect();
    
    return {
      borderContainer: {
        top: borderRect.top,
        bottom: borderRect.bottom,
        height: borderRect.height,
        centerY: borderRect.top + borderRect.height / 2
      },
      borderSvg: {
        top: svgRect.top,
        bottom: svgRect.bottom,
        height: svgRect.height,
        centerY: svgRect.top + svgRect.height / 2
      },
      mainLine: {
        top: lineRect.top,
        bottom: lineRect.bottom,
        height: lineRect.height,
        centerY: lineRect.top + lineRect.height / 2
      },
      gaps: {
        svgCenterToLineCenter: (lineRect.top + lineRect.height / 2) - (svgRect.top + svgRect.height / 2),
        svgBottomToLineCenter: (lineRect.top + lineRect.height / 2) - svgRect.bottom,
        svgTopToBorderTop: svgRect.top - borderRect.top
      }
    };
  });
  
  console.log(JSON.stringify(measurements, null, 2));
  await browser.close();
})();
