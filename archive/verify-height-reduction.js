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
  console.log('STEP 1: VERIFY CLOSED STATE HEIGHT');
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
        height: Math.round(containerRect.height)
      },
      button: {
        height: Math.round(btnRect.height)
      },
      section: sectionBBox ? {
        height: Math.round(sectionBBox.height)
      } : null
    };
  });

  console.log('📊 CLOSED STATE HEIGHT:\n');
  console.log('Container:');
  console.log(`   Height: ${closedState.container.height}px (expected: 26px → 23px after change)`);
  console.log(`\nButton:`);
  console.log(`   Height: ${closedState.button.height}px (expected: 26px → 23px after change)`);
  console.log(`\nSVG Section:`);
  if (closedState.section) {
    console.log(`   Height: ${closedState.section.height}px (expected: 26px → 23px after change)`);
  }

  // Open filter
  console.log('\n========================================');
  console.log('STEP 2: VERIFY EXPANDED STATE HEIGHT');
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
        height: Math.round(containerRect.height)
      },
      button: {
        height: Math.round(btnRect.height)
      },
      sections: sections.map((s, i) => ({
        index: i,
        height: Math.round(s.getBBox().height)
      }))
    };
  });

  console.log('📊 EXPANDED STATE HEIGHT:\n');
  console.log('Container:');
  console.log(`   Height: ${expandedState.container.height}px (expected: 26px → 23px after change)`);
  console.log(`\nButton:`);
  console.log(`   Height: ${expandedState.button.height}px (expected: 26px → 23px after change)`);
  console.log(`\nSections:`);
  expandedState.sections.forEach(s => {
    console.log(`   Section ${s.index}: ${s.height}px (expected: 26px → 23px after change)`);
  });

  // Test text alignment
  console.log('\n========================================');
  console.log('STEP 3: VERIFY TEXT ALIGNMENT');
  console.log('========================================\n');

  const textAlignment = await page.evaluate(() => {
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterText = filterBtn.querySelector('span');
    const btnRect = filterBtn.getBoundingClientRect();
    const textRect = filterText.getBoundingClientRect();

    const btnCenterY = btnRect.top + btnRect.height / 2;
    const textCenterY = textRect.top + textRect.height / 2;
    const verticalOffset = Math.round(textCenterY - btnCenterY);

    return {
      button: {
        height: Math.round(btnRect.height),
        centerY: Math.round(btnCenterY)
      },
      text: {
        height: Math.round(textRect.height),
        centerY: Math.round(textCenterY)
      },
      verticalOffset
    };
  });

  console.log('Button:');
  console.log(`   Height: ${textAlignment.button.height}px`);
  console.log(`   Center Y: ${textAlignment.button.centerY}px`);
  console.log(`\nText:`);
  console.log(`   Height: ${textAlignment.text.height}px`);
  console.log(`   Center Y: ${textAlignment.text.centerY}px`);
  console.log(`\nVertical alignment:`);
  console.log(`   Offset: ${textAlignment.verticalOffset}px ${Math.abs(textAlignment.verticalOffset) <= 1 ? '✅ Centered' : '❌ Off-center'}`);

  // Test close animation
  console.log('\n========================================');
  console.log('STEP 4: TEST CLOSE ANIMATION');
  console.log('========================================\n');

  await page.click('.new-filter-btn');
  await page.waitForTimeout(500);

  const finalState = await page.evaluate(() => {
    const filterBtn = document.querySelector('.new-filter-btn');
    const btnRect = filterBtn.getBoundingClientRect();

    return {
      height: Math.round(btnRect.height)
    };
  });

  console.log('Final button height:');
  console.log(`   ${finalState.height}px ${finalState.height === closedState.button.height ? '✅ Matches closed state' : '❌ Different from closed state'}`);

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  console.log('Current height (before 10% reduction): 26px');
  console.log('Target height (after 10% reduction): 23px (26 × 0.9)');
  console.log('\nAffected elements:');
  console.log('  - .new-filter-container height');
  console.log('  - .new-filter-btn height');
  console.log('  - containerHeight in JavaScript (SVG sections)');
  console.log('  - containerY position (may need adjustment)');

  console.log('\n⏸️  Pausing for visual inspection...');
  await page.waitForTimeout(3000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
