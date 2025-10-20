const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log('\n========================================');
  console.log('VISUAL PARALLAX DIRECTION TEST');
  console.log('========================================\n');

  console.log('🎯 INSTRUCTIONS:');
  console.log('   Watch the stars carefully while following the prompts\n');

  // Test RIGHT scroll
  console.log('📍 STEP 1: Scroll RIGHT (drag timeline to the RIGHT)');
  console.log('   ⏳ Performing automatic scroll to the RIGHT in 2 seconds...\n');

  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    viewport.scrollLeft = 0; // Reset
  });

  await page.waitForTimeout(500);

  console.log('   🔄 Scrolling RIGHT now... WATCH THE STARS!');

  await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    // Smooth scroll to the right
    const startScroll = viewport.scrollLeft;
    const targetScroll = startScroll + 400;
    const duration = 1000; // 1 second
    const startTime = Date.now();

    function smoothScroll() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      viewport.scrollLeft = startScroll + (targetScroll - startScroll) * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(smoothScroll);
      }
    }

    smoothScroll();
  });

  await page.waitForTimeout(1500);

  console.log('   ❓ Did the stars drift to the LEFT? (opposite of scroll)');
  console.log('   ✅ If YES → Parallax is working correctly');
  console.log('   ❌ If NO → Direction needs to be fixed\n');

  await page.waitForTimeout(3000);

  // Test LEFT scroll
  console.log('📍 STEP 2: Scroll LEFT (drag timeline to the LEFT)');
  console.log('   ⏳ Performing automatic scroll to the LEFT in 2 seconds...\n');

  await page.waitForTimeout(2000);

  console.log('   🔄 Scrolling LEFT now... WATCH THE STARS!');

  await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    // Smooth scroll to the left
    const startScroll = viewport.scrollLeft;
    const targetScroll = startScroll - 400;
    const duration = 1000;
    const startTime = Date.now();

    function smoothScroll() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      viewport.scrollLeft = startScroll + (targetScroll - startScroll) * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(smoothScroll);
      }
    }

    smoothScroll();
  });

  await page.waitForTimeout(1500);

  console.log('   ❓ Did the stars drift to the RIGHT? (opposite of scroll)');
  console.log('   ✅ If YES → Parallax is working correctly');
  console.log('   ❌ If NO → Direction needs to be fixed\n');

  await page.waitForTimeout(3000);

  // Manual testing
  console.log('========================================');
  console.log('MANUAL TESTING');
  console.log('========================================\n');

  console.log('🖱️  Now try scrolling manually:');
  console.log('   1. Drag the timeline to the RIGHT');
  console.log('      → Stars should drift LEFT');
  console.log('   2. Drag the timeline to the LEFT');
  console.log('      → Stars should drift RIGHT\n');

  console.log('💡 The parallax effect creates depth:');
  console.log('   - Stars move OPPOSITE to scroll direction');
  console.log('   - Different stars move at different speeds');
  console.log('   - Fast stars feel "closer", slow stars feel "farther"\n');

  console.log('⏸️  Browser will stay open for 30 seconds for testing...\n');
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('✅ Visual test complete!');
})();
