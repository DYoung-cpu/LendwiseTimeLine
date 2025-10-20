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
  await page.waitForTimeout(3000);

  console.log('\n========================================');
  console.log('TIMELINE SCROLL LIMIT VERIFICATION');
  console.log('========================================\n');

  // Check CSS version
  const cssVersion = await page.evaluate(() => {
    const cssLink = document.querySelector('link[rel="stylesheet"][href*="timeline-clean-test.css"]');
    return cssLink ? cssLink.href.match(/v=(\d+)/)?.[1] : 'NOT FOUND';
  });

  console.log('📄 CSS Version:');
  console.log(`   Current: ${cssVersion}`);
  console.log(`   Expected: 20251003154000`);
  console.log(`   ${cssVersion === '20251003154000' ? '✅ CORRECT' : '❌ WRONG VERSION'}\n`);

  // Check timeline dimensions
  const dimensionsCheck = await page.evaluate(() => {
    const lineContainer = document.querySelector('.timeline-line-container');
    const mainLine = document.querySelector('.timeline-main-line');
    const milestones = document.querySelector('.timeline-milestones');
    const viewport = document.querySelector('.timeline-viewport');

    const lineContainerStyle = window.getComputedStyle(lineContainer);
    const mainLineStyle = window.getComputedStyle(mainLine);
    const milestonesStyle = window.getComputedStyle(milestones);

    return {
      lineContainer: {
        width: lineContainerStyle.width,
        widthPx: parseInt(lineContainerStyle.width)
      },
      mainLine: {
        width: mainLineStyle.width,
        widthPx: parseInt(mainLineStyle.width)
      },
      milestones: {
        width: milestonesStyle.width,
        widthPx: parseInt(milestonesStyle.width)
      },
      viewport: {
        clientWidth: viewport.clientWidth,
        scrollWidth: viewport.scrollWidth
      }
    };
  });

  console.log('📊 Timeline Dimensions:');
  console.log(`   Line Container: ${dimensionsCheck.lineContainer.width}`);
  console.log(`   ${dimensionsCheck.lineContainer.widthPx === 1160 ? '✅' : '❌'} Expected: 1160px\n`);

  console.log(`   Main Line: ${dimensionsCheck.mainLine.width}`);
  console.log(`   ${dimensionsCheck.mainLine.widthPx === 2000 ? '✅' : '❌'} Expected: 2000px (extends to cover all milestones)\n`);

  console.log(`   Milestones Container: ${dimensionsCheck.milestones.width}`);
  console.log(`   ${dimensionsCheck.milestones.widthPx === 2000 ? '✅' : '❌'} Expected: 2000px (contains all milestone positions)\n`);

  console.log(`   Viewport Client Width: ${dimensionsCheck.viewport.clientWidth}px`);
  console.log(`   Viewport Scroll Width: ${dimensionsCheck.viewport.scrollWidth}px`);

  const maxScrollDistance = dimensionsCheck.viewport.scrollWidth - dimensionsCheck.viewport.clientWidth;
  console.log(`   Max Scroll Distance: ${maxScrollDistance}px\n`);

  // Test scrolling to the end
  console.log('========================================');
  console.log('SCROLL TO END TEST');
  console.log('========================================\n');

  console.log('Scrolling to the far right...\n');

  const scrollTest = await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');

    // Scroll to the very end
    viewport.scrollLeft = 999999; // Scroll as far as possible

    // Get last milestone position
    const lastMilestone = document.querySelector('[data-milestone="wisr"]');
    const lastMilestoneRect = lastMilestone.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();

    return {
      maxScrollLeft: viewport.scrollLeft,
      scrollWidth: viewport.scrollWidth,
      clientWidth: viewport.clientWidth,
      lastMilestone: {
        left: Math.round(lastMilestoneRect.left),
        right: Math.round(lastMilestoneRect.right),
        centerX: Math.round(lastMilestoneRect.left + lastMilestoneRect.width / 2)
      },
      viewport: {
        left: Math.round(viewportRect.left),
        right: Math.round(viewportRect.right),
        centerX: Math.round(viewportRect.left + viewportRect.width / 2)
      }
    };
  });

  console.log(`Max Scroll Position: ${scrollTest.maxScrollLeft}px`);
  console.log(`Scroll Width: ${scrollTest.scrollWidth}px`);
  console.log(`Client Width: ${scrollTest.clientWidth}px\n`);

  console.log('Last Milestone (WISR):');
  console.log(`   Position: ${scrollTest.lastMilestone.left}px - ${scrollTest.lastMilestone.right}px`);
  console.log(`   Center: ${scrollTest.lastMilestone.centerX}px\n`);

  console.log('Viewport:');
  console.log(`   Position: ${scrollTest.viewport.left}px - ${scrollTest.viewport.right}px`);
  console.log(`   Center: ${scrollTest.viewport.centerX}px\n`);

  const deadSpace = scrollTest.viewport.right - scrollTest.lastMilestone.right;
  console.log(`Dead Space After Last Item: ${deadSpace}px`);

  if (deadSpace > 300) {
    console.log(`   ❌ TOO MUCH dead space (${deadSpace}px)\n`);
  } else if (deadSpace < 50) {
    console.log(`   ⚠️  Too little padding (${deadSpace}px) - last item might be cut off\n`);
  } else {
    console.log(`   ✅ Good amount of padding (${deadSpace}px)\n`);
  }

  // Summary
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  const allChecks = [
    cssVersion === '20251003154000',
    dimensionsCheck.lineContainer.widthPx === 1160,
    dimensionsCheck.mainLine.widthPx === 2000,
    dimensionsCheck.milestones.widthPx === 2000,
    deadSpace >= 50 && deadSpace <= 300
  ];

  if (allChecks.every(check => check)) {
    console.log('✅ ALL CHECKS PASSED!\n');
    console.log('Timeline scroll limit fixed:');
    console.log('   - Container width: 1160px (controls scroll limit)');
    console.log('   - Main line width: 2000px (extends to cover all milestones)');
    console.log('   - Timeline line visible across entire scroll range');
    console.log('   - No excessive dead space when scrolled to the right');
    console.log('   - Last milestone (WISR) has appropriate padding');
    console.log('   - Scroll stops at the right place\n');
  } else {
    console.log('❌ SOME CHECKS FAILED\n');
    console.log('Failed checks:');
    if (!allChecks[0]) console.log('   - CSS version mismatch');
    if (!allChecks[1]) console.log('   - Line container width incorrect');
    if (!allChecks[2]) console.log('   - Main line width incorrect');
    if (!allChecks[3]) console.log('   - Milestones container width incorrect');
    if (!allChecks[4]) console.log('   - Dead space issue');
  }

  console.log('\n⏸️  Browser will stay open for visual inspection...');
  console.log('   - Timeline is scrolled to the far right');
  console.log('   - Check that there is minimal dead space');
  console.log('   - Last item (WISR) should be clearly visible');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
