const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  // Open filter
  console.log('🖱️ Opening filter...');
  await page.click('.new-filter-btn');
  await page.waitForTimeout(500);

  console.log('\n========================================');
  console.log('BUTTON POSITION DURING CLOSE');
  console.log('========================================\n');

  // Track button and text position during close animation
  const trackingPromise = page.evaluate(() => {
    return new Promise((resolve) => {
      const positions = [];
      const filterBtn = document.querySelector('.new-filter-btn');
      const filterText = filterBtn.querySelector('span');
      const container = document.querySelector('.new-filter-container');

      const interval = setInterval(() => {
        const btnRect = filterBtn.getBoundingClientRect();
        const textRect = filterText.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const btnStyle = window.getComputedStyle(filterBtn);

        positions.push({
          time: Date.now(),
          button: {
            left: Math.round(btnRect.left),
            cssLeft: btnStyle.left,
            transform: btnStyle.transform
          },
          text: {
            left: Math.round(textRect.left)
          },
          container: {
            width: Math.round(containerRect.width),
            hasClass: container.classList.contains('filter-expanded')
          }
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

  console.log('📊 TRACKING (every 50ms):\n');
  positions.forEach((pos, index) => {
    console.log(`Frame ${index + 1} (${index * 50}ms):`);
    console.log(`   Button left: ${pos.button.left}px (CSS: ${pos.button.cssLeft})`);
    console.log(`   Button transform: ${pos.button.transform}`);
    console.log(`   Text left: ${pos.text.left}px`);
    console.log(`   Container width: ${pos.container.width}px`);
    console.log(`   Container expanded class: ${pos.container.hasClass ? 'YES' : 'NO'}`);
    console.log('');
  });

  console.log('========================================');
  console.log('ANALYSIS');
  console.log('========================================\n');

  // Check for button position jumps
  const buttonJumps = [];
  for (let i = 1; i < positions.length; i++) {
    const jump = positions[i].button.left - positions[i - 1].button.left;
    if (Math.abs(jump) > 10) {
      buttonJumps.push({
        frame: i + 1,
        from: positions[i - 1].button.left,
        to: positions[i].button.left,
        jump: jump
      });
    }
  }

  if (buttonJumps.length > 0) {
    console.log('❌ BUTTON POSITION JUMPS DETECTED:\n');
    buttonJumps.forEach(jump => {
      console.log(`   Frame ${jump.frame}: ${jump.from}px → ${jump.to}px (${jump.jump > 0 ? '+' : ''}${jump.jump}px)`);
    });
    console.log('\nLikely cause: CSS left property changing before/after transform');
  } else {
    console.log('✅ No significant button position jumps');
  }

  await page.waitForTimeout(1000);
  await browser.close();
  console.log('\n✅ Diagnosis complete!');
})();
