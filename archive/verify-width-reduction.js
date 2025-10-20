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
  console.log('STEP 1: VERIFY CLOSED STATE');
  console.log('========================================\n');

  const closedState = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterSections = document.getElementById('filter-sections');
    const section = filterSections.querySelector('path');

    const containerRect = container.getBoundingClientRect();
    const btnRect = filterBtn.getBoundingClientRect();
    const sectionBBox = section ? section.getBBox() : null;

    return {
      container: {
        width: Math.round(containerRect.width),
        left: Math.round(containerRect.left),
        right: Math.round(containerRect.right)
      },
      button: {
        width: Math.round(btnRect.width),
        left: Math.round(btnRect.left),
        centerX: Math.round(btnRect.left + btnRect.width / 2)
      },
      section: sectionBBox ? {
        width: Math.round(sectionBBox.width),
        x: Math.round(sectionBBox.x)
      } : null
    };
  });

  console.log('📊 CLOSED STATE MEASUREMENTS:\n');
  console.log('Container:');
  console.log(`   Width: ${closedState.container.width}px (expected: 110px)`);
  console.log(`\nButton:`);
  console.log(`   Width: ${closedState.button.width}px (expected: 85px → 74px after change)`);
  console.log(`   Center: ${closedState.button.centerX}px`);
  console.log(`\nSVG Section:`);
  if (closedState.section) {
    console.log(`   Width: ${closedState.section.width}px (expected: 110px → 96px after change)`);
  }

  // Open filter
  console.log('\n========================================');
  console.log('STEP 2: VERIFY EXPANDED STATE');
  console.log('========================================\n');

  await page.click('.new-filter-btn');
  await page.waitForTimeout(500);

  const expandedState = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterSections = document.getElementById('filter-sections');
    const sections = Array.from(filterSections.querySelectorAll('path'));

    const containerRect = container.getBoundingClientRect();
    const btnRect = filterBtn.getBoundingClientRect();

    return {
      container: {
        width: Math.round(containerRect.width)
      },
      button: {
        width: Math.round(btnRect.width),
        centerX: Math.round(btnRect.left + btnRect.width / 2)
      },
      sections: sections.map((s, i) => ({
        index: i,
        width: Math.round(s.getBBox().width)
      }))
    };
  });

  console.log('📊 EXPANDED STATE MEASUREMENTS:\n');
  console.log('Container:');
  console.log(`   Width: ${expandedState.container.width}px (expected: 510px → 444px after change)`);
  console.log(`\nButton:`);
  console.log(`   Width: ${expandedState.button.width}px (expected: 120px → 104px after change)`);
  console.log(`   Center: ${expandedState.button.centerX}px`);
  console.log(`\nSections:`);
  expandedState.sections.forEach(s => {
    console.log(`   Section ${s.index}: ${s.width}px (expected: 85-89px → 74-78px after change)`);
  });

  // Test close animation
  console.log('\n========================================');
  console.log('STEP 3: TEST CLOSE ANIMATION');
  console.log('========================================\n');

  await page.click('.new-filter-btn');
  await page.waitForTimeout(100);

  // Track text position during close
  const textTracking = await page.evaluate(() => {
    return new Promise((resolve) => {
      const positions = [];
      const filterText = document.querySelector('.new-filter-btn span');

      const interval = setInterval(() => {
        const rect = filterText.getBoundingClientRect();
        const style = window.getComputedStyle(filterText);
        positions.push({
          left: Math.round(rect.left),
          opacity: style.opacity,
          visible: style.opacity !== '0'
        });

        if (positions.length >= 8) {
          clearInterval(interval);
          resolve(positions);
        }
      }, 50);
    });
  });

  const visibleDuringClose = textTracking.some(p => p.visible && p.left > 1100);

  console.log('Text visibility during close:');
  textTracking.forEach((p, i) => {
    const status = p.visible ? '👁️ ' : '🔒';
    console.log(`   Frame ${i + 1}: ${status} opacity=${p.opacity}, left=${p.left}px`);
  });

  if (visibleDuringClose) {
    console.log('\n❌ WARNING: Text visible during position jumps');
  } else {
    console.log('\n✅ Text properly hidden during animation');
  }

  await page.waitForTimeout(500);

  // Check final state
  console.log('\n========================================');
  console.log('STEP 4: VERIFY FINAL STATE');
  console.log('========================================\n');

  const finalState = await page.evaluate(() => {
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterText = filterBtn.querySelector('span');
    const btnRect = filterBtn.getBoundingClientRect();
    const textRect = filterText.getBoundingClientRect();

    return {
      button: {
        width: Math.round(btnRect.width),
        centerX: Math.round(btnRect.left + btnRect.width / 2)
      },
      text: {
        left: Math.round(textRect.left),
        opacity: window.getComputedStyle(filterText).opacity
      }
    };
  });

  console.log('Final button state:');
  console.log(`   Width: ${finalState.button.width}px`);
  console.log(`   Center: ${finalState.button.centerX}px`);
  console.log(`\nFinal text state:`);
  console.log(`   Position: ${finalState.text.left}px`);
  console.log(`   Opacity: ${finalState.text.opacity}`);
  console.log(`   Status: ${finalState.text.opacity === '1' ? '✅ Visible' : '❌ Hidden'}`);

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  console.log('Current dimensions (before 13% reduction):');
  console.log(`   Button width: 85px`);
  console.log(`   Container closed: 110px`);
  console.log(`   Container expanded: 510px`);
  console.log(`   Section width: 85px`);
  console.log('\nTarget dimensions (after 13% reduction):');
  console.log(`   Button width: 74px (85 × 0.87)`);
  console.log(`   Container closed: 96px (110 × 0.87)`);
  console.log(`   Container expanded: 444px (510 × 0.87)`);
  console.log(`   Section width: 74px (85 × 0.87)`);

  console.log('\n⏸️  Pausing for visual inspection...');
  await page.waitForTimeout(3000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
