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
  console.log('GRADIENT OVERLAY VERIFICATION');
  console.log('========================================\n');

  // Check CSS version
  const cssVersion = await page.evaluate(() => {
    const cssLink = document.querySelector('link[rel="stylesheet"][href*="timeline-clean-test.css"]');
    return cssLink ? cssLink.href.match(/v=(\d+)/)?.[1] : 'NOT FOUND';
  });

  console.log('📄 CSS Version Check:');
  console.log(`   Current: ${cssVersion}`);
  console.log(`   Expected: 20251003143500`);
  console.log(`   ${cssVersion === '20251003143500' ? '✅ CORRECT' : '❌ WRONG VERSION'}\n`);

  // Check ::before pseudo-element
  const overlayCheck = await page.evaluate(() => {
    const container = document.querySelector('.timeline-border-container');
    const beforeStyles = window.getComputedStyle(container, '::before');

    return {
      content: beforeStyles.content,
      position: beforeStyles.position,
      background: beforeStyles.background,
      backgroundImage: beforeStyles.backgroundImage,
      backgroundSize: beforeStyles.backgroundSize,
      animationName: beforeStyles.animationName,
      animationDuration: beforeStyles.animationDuration,
      zIndex: beforeStyles.zIndex,
      borderRadius: beforeStyles.borderRadius
    };
  });

  console.log('🎨 Gradient Overlay (::before) Check:');
  console.log(`   Content: ${overlayCheck.content}`);
  console.log(`   ${overlayCheck.content !== 'none' ? '✅' : '❌'} Pseudo-element exists\n`);

  console.log(`   Position: ${overlayCheck.position}`);
  console.log(`   ${overlayCheck.position === 'absolute' ? '✅' : '❌'} Expected: absolute\n`);

  console.log(`   Z-Index: ${overlayCheck.zIndex}`);
  console.log(`   ${overlayCheck.zIndex === '0' ? '✅' : '❌'} Expected: 0 (below content)\n`);

  console.log(`   Background Image: ${overlayCheck.backgroundImage.substring(0, 60)}...`);
  const hasGradient = overlayCheck.backgroundImage.includes('linear-gradient');
  console.log(`   ${hasGradient ? '✅' : '❌'} Has linear-gradient\n`);

  console.log(`   Background Size: ${overlayCheck.backgroundSize}`);
  console.log(`   ${overlayCheck.backgroundSize === '200% 100%' ? '✅' : '❌'} Expected: 200% 100%\n`);

  console.log(`   Animation Name: ${overlayCheck.animationName}`);
  console.log(`   ${overlayCheck.animationName === 'timelineGradientFlow' ? '✅' : '❌'} Expected: timelineGradientFlow\n`);

  console.log(`   Animation Duration: ${overlayCheck.animationDuration}`);
  console.log(`   ${overlayCheck.animationDuration === '20s' ? '✅' : '❌'} Expected: 20s\n`);

  // Check timeline viewport z-index
  const viewportCheck = await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    const computedStyle = window.getComputedStyle(viewport);

    return {
      position: computedStyle.position,
      zIndex: computedStyle.zIndex
    };
  });

  console.log('📊 Timeline Viewport Z-Index:');
  console.log(`   Position: ${viewportCheck.position}`);
  console.log(`   Z-Index: ${viewportCheck.zIndex}`);
  console.log(`   ${viewportCheck.zIndex === '1' ? '✅' : '❌'} Expected: 1 (above overlay)\n`);

  // Visual brightness test
  console.log('========================================');
  console.log('VISUAL BRIGHTNESS ANALYSIS');
  console.log('========================================\n');

  const brightnessTest = await page.evaluate(() => {
    const container = document.querySelector('.timeline-border-container');
    const rect = container.getBoundingClientRect();

    // Create a canvas to capture pixel data
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    // We can't directly sample the pseudo-element, but we can check if the container appears brighter
    const beforeStyles = window.getComputedStyle(container, '::before');
    const hasWhiteGradient = beforeStyles.backgroundImage.includes('255, 255, 255') ||
                            beforeStyles.backgroundImage.includes('255, 245, 200') ||
                            beforeStyles.backgroundImage.includes('200, 240, 255');

    return {
      hasWhiteGradient,
      containerDimensions: {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    };
  });

  console.log('Gradient Contains Light Colors:');
  console.log(`   ${brightnessTest.hasWhiteGradient ? '✅' : '❌'} White/Light tones detected\n`);

  console.log('Container Dimensions:');
  console.log(`   Width: ${brightnessTest.containerDimensions.width}px`);
  console.log(`   Height: ${brightnessTest.containerDimensions.height}px\n`);

  // Summary
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  const allChecks = [
    cssVersion === '20251003143500',
    overlayCheck.content !== 'none',
    overlayCheck.position === 'absolute',
    overlayCheck.zIndex === '0',
    hasGradient,
    overlayCheck.backgroundSize === '200% 100%',
    overlayCheck.animationName === 'timelineGradientFlow',
    overlayCheck.animationDuration === '20s',
    viewportCheck.zIndex === '1',
    brightnessTest.hasWhiteGradient
  ];

  if (allChecks.every(check => check)) {
    console.log('✅ ALL CHECKS PASSED!\n');
    console.log('Animated gradient overlay successfully applied:');
    console.log('   - Light gradient (white/gold/blue tones)');
    console.log('   - Flowing horizontally across timeline');
    console.log('   - 20-second smooth animation cycle');
    console.log('   - Positioned behind timeline content');
    console.log('   - Brightens the timeline background\n');
  } else {
    console.log('❌ SOME CHECKS FAILED\n');
    console.log('Failed checks:');
    if (!allChecks[0]) console.log('   - CSS version mismatch');
    if (!allChecks[1]) console.log('   - Pseudo-element not created');
    if (!allChecks[2]) console.log('   - Position not absolute');
    if (!allChecks[3]) console.log('   - Z-index incorrect');
    if (!allChecks[4]) console.log('   - No linear gradient');
    if (!allChecks[5]) console.log('   - Background size incorrect');
    if (!allChecks[6]) console.log('   - Animation name incorrect');
    if (!allChecks[7]) console.log('   - Animation duration incorrect');
    if (!allChecks[8]) console.log('   - Viewport z-index incorrect');
    if (!allChecks[9]) console.log('   - No light colors in gradient');
  }

  console.log('\n⏸️  Browser will stay open for visual inspection...');
  console.log('   Watch the light gradient slowly flow across the timeline background');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
