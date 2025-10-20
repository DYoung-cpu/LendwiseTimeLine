const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser with cache disabled...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Disable cache
  await page.route('**/*', (route) => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  });

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('\n========================================');
  console.log('VERIFYING 10px PADDING REDUCTION');
  console.log('========================================\n');

  const verification = await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    const filterContainer = document.querySelector('.new-filter-container');
    const timeline = document.querySelector('.timeline-viewport');

    const containerStyle = window.getComputedStyle(borderContainer);
    const containerRect = borderContainer.getBoundingClientRect();
    const filterRect = filterContainer.getBoundingClientRect();
    const timelineRect = timeline.getBoundingClientRect();

    // Get CSS version
    const cssLink = document.querySelector('link[rel="stylesheet"][href*="timeline-clean-test.css"]');
    const cssVersion = cssLink ? cssLink.href.match(/v=(\d+)/)?.[1] : 'NOT FOUND';

    return {
      cssVersion,
      padding: containerStyle.paddingTop,
      containerHeight: Math.round(containerRect.height),
      gap: Math.round(timelineRect.top - filterRect.bottom),
      filterBottom: Math.round(filterRect.bottom),
      timelineTop: Math.round(timelineRect.top)
    };
  });

  console.log('CSS Version: ' + verification.cssVersion);
  console.log('Expected: 20251003141500');
  console.log(verification.cssVersion === '20251003141500' ? '✅ CORRECT\n' : '❌ WRONG VERSION\n');

  console.log('Padding: ' + verification.padding);
  console.log('Expected: 10px');
  console.log(verification.padding === '10px' ? '✅ CORRECT\n' : '❌ WRONG PADDING\n');

  console.log('Container Height: ' + verification.containerHeight + 'px');
  console.log('Gap (Filter → Timeline): ' + verification.gap + 'px');
  console.log('Filter Bottom: ' + verification.filterBottom + 'px');
  console.log('Timeline Top: ' + verification.timelineTop + 'px');

  console.log('\n========================================');
  console.log('BEFORE vs AFTER COMPARISON');
  console.log('========================================\n');

  console.log('OLD (19px padding):');
  console.log('   Container Height: 268px');
  console.log('   Gap: 16px\n');

  console.log('NEW (10px padding):');
  console.log('   Container Height: ' + verification.containerHeight + 'px');
  console.log('   Gap: ' + verification.gap + 'px\n');

  const heightReduction = 268 - verification.containerHeight;
  const gapReduction = 16 - verification.gap;

  console.log('CHANGE:');
  console.log('   Height reduced by: ' + heightReduction + 'px');
  console.log('   Gap reduced by: ' + gapReduction + 'px');

  if (verification.padding === '10px' && verification.cssVersion === '20251003141500') {
    console.log('\n✅ SUCCESS! Changes applied correctly.');
    console.log('   Padding is now 10px (was 19px)');
    console.log('   This creates minimal space between timeline buttons and border');
  } else {
    console.log('\n❌ VERIFICATION FAILED!');
    if (verification.padding !== '10px') {
      console.log('   Padding is ' + verification.padding + ' but should be 10px');
    }
    if (verification.cssVersion !== '20251003141500') {
      console.log('   CSS version is ' + verification.cssVersion + ' but should be 20251003141500');
    }
  }

  console.log('\n⏸️  Visual inspection (browser stays open)...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
