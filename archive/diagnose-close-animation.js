const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  console.log('\n========================================');
  console.log('FILTER CLOSE ANIMATION DIAGNOSIS');
  console.log('========================================\n');

  // Get initial state
  const initialState = await page.evaluate(() => {
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterText = filterBtn.querySelector('span');
    const rect = filterText.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(filterText);

    return {
      position: Math.round(rect.left),
      centerX: Math.round(rect.left + rect.width / 2),
      transform: computedStyle.transform,
      left: computedStyle.left,
      right: computedStyle.right,
      marginLeft: computedStyle.marginLeft,
      marginRight: computedStyle.marginRight
    };
  });

  console.log('📊 INITIAL STATE (CLOSED):');
  console.log(`   Text position: ${initialState.position}px`);
  console.log(`   Text center: ${initialState.centerX}px`);
  console.log(`   Transform: ${initialState.transform}`);
  console.log(`   Margins: left=${initialState.marginLeft}, right=${initialState.marginRight}\n`);

  // Open filter
  console.log('🖱️ OPENING filter...');
  await page.click('.new-filter-btn');
  await page.waitForTimeout(500);

  const openState = await page.evaluate(() => {
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterText = filterBtn.querySelector('span');
    const rect = filterText.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(filterText);

    return {
      position: Math.round(rect.left),
      centerX: Math.round(rect.left + rect.width / 2),
      transform: computedStyle.transform,
      inlineStyle: filterText.getAttribute('style')
    };
  });

  console.log('📊 OPEN STATE:');
  console.log(`   Text position: ${openState.position}px`);
  console.log(`   Text center: ${openState.centerX}px`);
  console.log(`   Transform: ${openState.transform}`);
  console.log(`   Inline style: ${openState.inlineStyle || 'none'}\n`);

  // Track position during close animation
  console.log('🖱️ CLOSING filter... (tracking position every 50ms)\n');

  const positionTracking = [];

  // Start tracking
  const trackingPromise = page.evaluate(() => {
    return new Promise((resolve) => {
      const positions = [];
      const filterText = document.querySelector('.new-filter-btn span');

      const interval = setInterval(() => {
        const rect = filterText.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(filterText);
        positions.push({
          time: Date.now(),
          left: Math.round(rect.left),
          transform: computedStyle.transform,
          inlineStyle: filterText.getAttribute('style')
        });

        if (positions.length >= 10) {
          clearInterval(interval);
          resolve(positions);
        }
      }, 50);
    });
  });

  // Click to close
  await page.click('.new-filter-btn');

  // Wait for tracking to complete
  const positions = await trackingPromise;

  console.log('📊 POSITION TRACKING DURING CLOSE:\n');
  positions.forEach((pos, index) => {
    console.log(`Frame ${index + 1} (${index * 50}ms):`);
    console.log(`   Left: ${pos.left}px`);
    console.log(`   Transform: ${pos.transform}`);
    console.log(`   Inline: ${pos.inlineStyle || 'none'}`);
  });

  // Get final state after close
  await page.waitForTimeout(500);

  const finalState = await page.evaluate(() => {
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterText = filterBtn.querySelector('span');
    const rect = filterText.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(filterText);

    return {
      position: Math.round(rect.left),
      centerX: Math.round(rect.left + rect.width / 2),
      transform: computedStyle.transform,
      inlineStyle: filterText.getAttribute('style'),
      marginLeft: computedStyle.marginLeft,
      marginRight: computedStyle.marginRight
    };
  });

  console.log('\n📊 FINAL STATE (CLOSED AGAIN):');
  console.log(`   Text position: ${finalState.position}px`);
  console.log(`   Text center: ${finalState.centerX}px`);
  console.log(`   Transform: ${finalState.transform}`);
  console.log(`   Inline style: ${finalState.inlineStyle || 'none'}`);
  console.log(`   Margins: left=${finalState.marginLeft}, right=${finalState.marginRight}\n`);

  console.log('========================================');
  console.log('DRIFT ANALYSIS');
  console.log('========================================\n');

  const drift = finalState.position - initialState.position;
  const centerDrift = finalState.centerX - initialState.centerX;

  console.log(`Initial position: ${initialState.position}px`);
  console.log(`Final position: ${finalState.position}px`);
  console.log(`Drift: ${drift}px ${drift === 0 ? '✅ NO DRIFT' : '❌ DRIFT DETECTED'}`);
  console.log(`\nInitial center: ${initialState.centerX}px`);
  console.log(`Final center: ${finalState.centerX}px`);
  console.log(`Center drift: ${centerDrift}px ${centerDrift === 0 ? '✅ CENTERED' : '❌ OFF CENTER'}`);

  if (drift !== 0 || centerDrift !== 0) {
    console.log('\n⚠️  TEXT POSITION CHANGED AFTER CLOSE');
    console.log('Likely causes:');
    console.log('1. Inline styles not cleared properly');
    console.log('2. Transform not reset');
    console.log('3. Margins changed');
    console.log('4. Button position changed but text didn\'t follow');
  }

  console.log('\n⏸️  Pausing for 3 seconds...');
  await page.waitForTimeout(3000);

  await browser.close();
  console.log('\n✅ Diagnosis complete!');
})();
