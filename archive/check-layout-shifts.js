const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Get original positions
  const beforePositions = await page.evaluate(() => {
    const filterBtn = document.querySelector('.new-filter-container');
    const google = document.querySelector('[data-milestone="google"]');
    const inception = document.querySelector('[data-milestone="inception"]');
    const mainLine = document.querySelector('.timeline-main-line');
    
    return {
      filterBtn: filterBtn ? filterBtn.getBoundingClientRect().top : null,
      google: google ? google.getBoundingClientRect().top : null,
      inception: inception ? inception.getBoundingClientRect().top : null,
      mainLine: mainLine ? mainLine.getBoundingClientRect().top : null
    };
  });
  
  console.log('BEFORE alignment:', JSON.stringify(beforePositions, null, 2));
  
  // Apply the fix
  await page.evaluate(() => {
    const borderSvg = document.querySelector('.border-svg');
    borderSvg.style.top = '0';
    borderSvg.style.height = '100%';
  });
  
  await page.waitForTimeout(500);
  
  // Get new positions
  const afterPositions = await page.evaluate(() => {
    const filterBtn = document.querySelector('.new-filter-container');
    const google = document.querySelector('[data-milestone="google"]');
    const inception = document.querySelector('[data-milestone="inception"]');
    const mainLine = document.querySelector('.timeline-main-line');
    
    return {
      filterBtn: filterBtn ? filterBtn.getBoundingClientRect().top : null,
      google: google ? google.getBoundingClientRect().top : null,
      inception: inception ? inception.getBoundingClientRect().top : null,
      mainLine: mainLine ? mainLine.getBoundingClientRect().top : null
    };
  });
  
  console.log('\nAFTER alignment:', JSON.stringify(afterPositions, null, 2));
  
  // Calculate shifts
  const shifts = {
    filterBtn: afterPositions.filterBtn - beforePositions.filterBtn,
    google: afterPositions.google - beforePositions.google,
    inception: afterPositions.inception - beforePositions.inception,
    mainLine: afterPositions.mainLine - beforePositions.mainLine
  };
  
  console.log('\nSHIFTS (negative = moved up, positive = moved down):', JSON.stringify(shifts, null, 2));
  
  if (Math.abs(shifts.filterBtn) > 0.1) {
    console.log('\n⚠️  WARNING: Filter button position changed by', shifts.filterBtn, 'px');
  }
  if (Math.abs(shifts.google) > 0.1 || Math.abs(shifts.inception) > 0.1) {
    console.log('⚠️  WARNING: Timeline milestones moved!');
  }
  if (Math.abs(shifts.mainLine) > 0.1) {
    console.log('⚠️  WARNING: Timeline main line moved!');
  }
  
  if (Math.abs(shifts.filterBtn) < 0.1 && Math.abs(shifts.google) < 0.1 && Math.abs(shifts.mainLine) < 0.1) {
    console.log('\n✅ SUCCESS: Only border moved, no other elements shifted');
  }
  
  await browser.close();
})();
