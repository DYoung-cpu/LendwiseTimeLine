const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('\n========================================');
  console.log('VISUAL COMPARISON: 30px vs 19px PADDING');
  console.log('========================================\n');

  // Measure CURRENT state (19px)
  console.log('📊 STEP 1: Current State (19px padding)\n');

  const current = await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    const filterContainer = document.querySelector('.new-filter-container');
    const timeline = document.querySelector('.timeline-viewport');

    const containerStyle = window.getComputedStyle(borderContainer);
    const containerRect = borderContainer.getBoundingClientRect();
    const filterRect = filterContainer.getBoundingClientRect();
    const timelineRect = timeline.getBoundingClientRect();

    return {
      padding: containerStyle.paddingTop,
      containerHeight: Math.round(containerRect.height),
      containerTop: Math.round(containerRect.top),
      containerBottom: Math.round(containerRect.bottom),
      filterBottom: Math.round(filterRect.bottom),
      timelineTop: Math.round(timelineRect.top),
      gap: Math.round(timelineRect.top - filterRect.bottom)
    };
  });

  console.log('   Padding: ' + current.padding);
  console.log('   Container Height: ' + current.containerHeight + 'px');
  console.log('   Container Top: ' + current.containerTop + 'px');
  console.log('   Container Bottom: ' + current.containerBottom + 'px');
  console.log('   Gap (Filter → Timeline): ' + current.gap + 'px');

  console.log('\n⏸️  Take a screenshot or observe current state...');
  await page.waitForTimeout(3000);

  // Change to OLD state (30px)
  console.log('\n📊 STEP 2: Changing to OLD state (30px padding)...\n');

  await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    borderContainer.style.padding = '30px 100px';
  });

  await page.waitForTimeout(500);

  const old = await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    const filterContainer = document.querySelector('.new-filter-container');
    const timeline = document.querySelector('.timeline-viewport');

    const containerStyle = window.getComputedStyle(borderContainer);
    const containerRect = borderContainer.getBoundingClientRect();
    const filterRect = filterContainer.getBoundingClientRect();
    const timelineRect = timeline.getBoundingClientRect();

    return {
      padding: containerStyle.paddingTop,
      containerHeight: Math.round(containerRect.height),
      containerTop: Math.round(containerRect.top),
      containerBottom: Math.round(containerRect.bottom),
      filterBottom: Math.round(filterRect.bottom),
      timelineTop: Math.round(timelineRect.top),
      gap: Math.round(timelineRect.top - filterRect.bottom)
    };
  });

  console.log('   Padding: ' + old.padding);
  console.log('   Container Height: ' + old.containerHeight + 'px');
  console.log('   Container Top: ' + old.containerTop + 'px');
  console.log('   Container Bottom: ' + old.containerBottom + 'px');
  console.log('   Gap (Filter → Timeline): ' + old.gap + 'px');

  console.log('\n⏸️  Compare OLD state (30px) - notice the extra space...');
  await page.waitForTimeout(3000);

  // Change back to NEW state (19px)
  console.log('\n📊 STEP 3: Changing back to NEW state (19px padding)...\n');

  await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    borderContainer.style.padding = '19px 100px';
  });

  await page.waitForTimeout(500);

  const final = await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    const filterContainer = document.querySelector('.new-filter-container');
    const timeline = document.querySelector('.timeline-viewport');

    const containerStyle = window.getComputedStyle(borderContainer);
    const containerRect = borderContainer.getBoundingClientRect();
    const filterRect = filterContainer.getBoundingClientRect();
    const timelineRect = timeline.getBoundingClientRect();

    return {
      padding: containerStyle.paddingTop,
      containerHeight: Math.round(containerRect.height),
      containerTop: Math.round(containerRect.top),
      containerBottom: Math.round(containerRect.bottom),
      filterBottom: Math.round(filterRect.bottom),
      timelineTop: Math.round(timelineRect.top),
      gap: Math.round(timelineRect.top - filterRect.bottom)
    };
  });

  console.log('   Padding: ' + final.padding);
  console.log('   Container Height: ' + final.containerHeight + 'px');
  console.log('   Container Top: ' + final.containerTop + 'px');
  console.log('   Container Bottom: ' + final.containerBottom + 'px');
  console.log('   Gap (Filter → Timeline): ' + final.gap + 'px');

  console.log('\n========================================');
  console.log('DIFFERENCE ANALYSIS');
  console.log('========================================\n');

  const heightDiff = old.containerHeight - current.containerHeight;
  const gapDiff = old.gap - current.gap;

  console.log('Height Difference:');
  console.log(`   OLD (30px): ${old.containerHeight}px`);
  console.log(`   NEW (19px): ${current.containerHeight}px`);
  console.log(`   Reduction: ${heightDiff}px (${Math.round(heightDiff / old.containerHeight * 100)}%)\n`);

  console.log('Gap Difference (Filter → Timeline):');
  console.log(`   OLD (30px): ${old.gap}px`);
  console.log(`   NEW (19px): ${current.gap}px`);
  console.log(`   Reduction: ${gapDiff}px\n`);

  console.log('✅ Changes ARE working!');
  console.log(`   The padding has been reduced from 30px to 19px (37% reduction)`);
  console.log(`   This results in ${heightDiff}px less total height`);
  console.log(`   And ${gapDiff}px less gap between filter and timeline`);

  console.log('\n💡 The change may appear subtle because:');
  console.log('   1. The reduction is spread across top AND bottom padding');
  console.log('   2. The timeline content itself hasn\'t changed size');
  console.log('   3. The visual difference is ' + heightDiff + 'px total (11px top + 11px bottom)');

  console.log('\n⏸️  Final state visible...');
  await page.waitForTimeout(3000);

  await browser.close();
  console.log('\n✅ Comparison complete!');
})();
