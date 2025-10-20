const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Scroll to timeline
  await page.evaluate(() => {
    const mainLine = document.querySelector('.timeline-main-line');
    if (mainLine) {
      mainLine.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await page.waitForTimeout(1000);
  
  // Add visual markers to show border position relative to line
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = `
      .position-marker {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        border-top: 3px solid red;
        z-index: 1000;
        pointer-events: none;
      }
      .position-label {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1001;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    
    // Mark the timeline main line
    const mainLine = document.querySelector('.timeline-main-line');
    const lineRect = mainLine.getBoundingClientRect();
    const lineMarker = document.createElement('div');
    lineMarker.className = 'position-label';
    lineMarker.textContent = 'TIMELINE LINE CENTER';
    lineMarker.style.top = (lineRect.top + lineRect.height / 2 - 12) + 'px';
    lineMarker.style.left = '10%';
    lineMarker.style.transform = 'none';
    document.body.appendChild(lineMarker);
    
    // Mark the border SVG center
    const borderSvg = document.querySelector('.border-svg');
    const svgRect = borderSvg.getBoundingClientRect();
    const svgMarker = document.createElement('div');
    svgMarker.className = 'position-label';
    svgMarker.textContent = 'BORDER CENTER (CURRENT)';
    svgMarker.style.top = (svgRect.top + svgRect.height / 2 - 12) + 'px';
    svgMarker.style.left = '60%';
    svgMarker.style.transform = 'none';
    svgMarker.style.background = 'rgba(255, 165, 0, 0.8)';
    document.body.appendChild(svgMarker);
  });
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'border-current-with-markers.png', fullPage: false });
  console.log('Current state screenshot saved with markers');
  
  // Now apply the fix
  await page.evaluate(() => {
    // Remove old markers
    document.querySelectorAll('.position-label').forEach(el => el.remove());
    
    // Apply the fix
    const borderSvg = document.querySelector('.border-svg');
    borderSvg.style.top = '0';
    borderSvg.style.height = '100%';
  });
  
  await page.waitForTimeout(500);
  
  // Add new markers
  await page.evaluate(() => {
    const mainLine = document.querySelector('.timeline-main-line');
    const lineRect = mainLine.getBoundingClientRect();
    const lineMarker = document.createElement('div');
    lineMarker.className = 'position-label';
    lineMarker.textContent = 'TIMELINE LINE CENTER';
    lineMarker.style.top = (lineRect.top + lineRect.height / 2 - 12) + 'px';
    lineMarker.style.left = '10%';
    lineMarker.style.transform = 'none';
    document.body.appendChild(lineMarker);
    
    const borderSvg = document.querySelector('.border-svg');
    const svgRect = borderSvg.getBoundingClientRect();
    const svgMarker = document.createElement('div');
    svgMarker.className = 'position-label';
    svgMarker.textContent = 'BORDER CENTER (ALIGNED)';
    svgMarker.style.top = (svgRect.top + svgRect.height / 2 - 12) + 'px';
    svgMarker.style.left = '60%';
    svgMarker.style.transform = 'none';
    svgMarker.style.background = 'rgba(0, 255, 0, 0.8)';
    document.body.appendChild(svgMarker);
  });
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'border-aligned-with-markers.png', fullPage: false });
  console.log('Aligned state screenshot saved with markers');
  
  await browser.close();
})();
