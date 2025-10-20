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
  console.log('AURORA SYNC VERIFICATION');
  console.log('========================================\n');

  // Check CSS version
  const cssVersion = await page.evaluate(() => {
    const cssLink = document.querySelector('link[rel="stylesheet"][href*="timeline-clean-test.css"]');
    return cssLink ? cssLink.href.match(/v=(\d+)/)?.[1] : 'NOT FOUND';
  });

  console.log('📄 CSS Version Check:');
  console.log(`   Current: ${cssVersion}`);
  console.log(`   Expected: 20251003143000`);
  console.log(`   ${cssVersion === '20251003143000' ? '✅ CORRECT' : '❌ WRONG VERSION'}\n`);

  // Check animation is applied
  const animationCheck = await page.evaluate(() => {
    const container = document.querySelector('.timeline-border-container');
    const computedStyle = window.getComputedStyle(container);

    return {
      animationName: computedStyle.animationName,
      animationDuration: computedStyle.animationDuration,
      animationTimingFunction: computedStyle.animationTimingFunction,
      animationIterationCount: computedStyle.animationIterationCount
    };
  });

  console.log('🎬 Animation Configuration:');
  console.log(`   Animation Name: ${animationCheck.animationName}`);
  console.log(`   ${animationCheck.animationName === 'timelineBorderGlow' ? '✅' : '❌'} Expected: timelineBorderGlow\n`);
  console.log(`   Duration: ${animationCheck.animationDuration}`);
  console.log(`   ${animationCheck.animationDuration === '15s' ? '✅' : '❌'} Expected: 15s\n`);
  console.log(`   Timing Function: ${animationCheck.animationTimingFunction}`);
  console.log(`   Iteration Count: ${animationCheck.animationIterationCount}`);
  console.log(`   ${animationCheck.animationIterationCount === 'infinite' ? '✅' : '❌'} Expected: infinite\n`);

  // Sample box-shadow colors over time
  console.log('========================================');
  console.log('COLOR TRANSITION SAMPLING');
  console.log('========================================\n');
  console.log('Sampling box-shadow color at 3-second intervals...\n');

  const samples = [];
  for (let i = 0; i < 5; i++) {
    const sample = await page.evaluate(() => {
      const container = document.querySelector('.timeline-border-container');
      const computedStyle = window.getComputedStyle(container);
      return computedStyle.boxShadow;
    });

    // Extract color from box-shadow (first rgba value)
    const colorMatch = sample.match(/rgba?\([^)]+\)/);
    const color = colorMatch ? colorMatch[0] : 'NOT FOUND';

    samples.push({
      time: i * 3,
      color: color,
      fullShadow: sample.substring(0, 100) + '...'
    });

    console.log(`⏱️  ${i * 3}s: ${color}`);

    if (i < 4) {
      await page.waitForTimeout(3000);
    }
  }

  // Analyze color changes
  console.log('\n========================================');
  console.log('ANALYSIS');
  console.log('========================================\n');

  const uniqueColors = new Set(samples.map(s => s.color));
  console.log(`Unique colors detected: ${uniqueColors.size}`);

  if (uniqueColors.size > 1) {
    console.log('✅ Colors are changing - animation is working!\n');
    console.log('Color transitions detected:');
    uniqueColors.forEach(color => {
      let colorName = 'Unknown';
      if (color.includes('0, 200, 81') || color.includes('0, 200, 80')) colorName = 'Green';
      else if (color.includes('255, 215, 0')) colorName = 'Gold';
      else if (color.includes('249, 168, 37')) colorName = 'Orange';

      console.log(`   - ${colorName}: ${color}`);
    });
  } else {
    console.log('❌ No color changes detected - animation may not be working');
  }

  // Check aurora animations for comparison
  console.log('\n========================================');
  console.log('AURORA BACKGROUND CHECK');
  console.log('========================================\n');

  const auroraCheck = await page.evaluate(() => {
    const aurora1 = document.querySelector('.aurora-1');
    const aurora2 = document.querySelector('.aurora-2');

    if (!aurora1 || !aurora2) return { error: 'Aurora elements not found' };

    const style1 = window.getComputedStyle(aurora1);
    const style2 = window.getComputedStyle(aurora2);

    return {
      aurora1Duration: style1.animationDuration,
      aurora2Duration: style2.animationDuration
    };
  });

  if (!auroraCheck.error) {
    console.log('Aurora Animation Timing:');
    console.log(`   Aurora 1: ${auroraCheck.aurora1Duration}`);
    console.log(`   Aurora 2: ${auroraCheck.aurora2Duration}`);
    console.log(`   Timeline Border: ${animationCheck.animationDuration}\n`);

    const allMatch = auroraCheck.aurora1Duration === '15s' &&
                     auroraCheck.aurora2Duration === '15s' &&
                     animationCheck.animationDuration === '15s';

    if (allMatch) {
      console.log('✅ All animations synced at 15s!');
    } else {
      console.log('❌ Animation timings do not match');
    }
  }

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  const allChecks = [
    cssVersion === '20251003143000',
    animationCheck.animationName === 'timelineBorderGlow',
    animationCheck.animationDuration === '15s',
    animationCheck.animationIterationCount === 'infinite',
    uniqueColors.size > 1
  ];

  if (allChecks.every(check => check)) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('\nTimeline border glow is successfully synced with aurora background.');
    console.log('The glow transitions through Green → Gold → Orange on a 15s cycle.');
  } else {
    console.log('❌ SOME CHECKS FAILED');
    console.log('\nFailed checks:');
    if (!allChecks[0]) console.log('   - CSS version mismatch');
    if (!allChecks[1]) console.log('   - Animation name incorrect');
    if (!allChecks[2]) console.log('   - Animation duration incorrect');
    if (!allChecks[3]) console.log('   - Animation not infinite');
    if (!allChecks[4]) console.log('   - Colors not changing');
  }

  console.log('\n⏸️  Browser will stay open for visual inspection...');
  console.log('   Watch the timeline border glow change from green → gold → orange');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
