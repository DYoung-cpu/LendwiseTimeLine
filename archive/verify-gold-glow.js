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
  console.log('VERIFYING GOLD GLOW EFFECT');
  console.log('========================================\n');

  const verification = await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    const containerStyle = window.getComputedStyle(borderContainer);

    // Get CSS version
    const cssLink = document.querySelector('link[rel="stylesheet"][href*="timeline-clean-test.css"]');
    const cssVersion = cssLink ? cssLink.href.match(/v=(\d+)/)?.[1] : 'NOT FOUND';

    return {
      cssVersion,
      boxShadow: containerStyle.boxShadow
    };
  });

  console.log('CSS Version: ' + verification.cssVersion);
  console.log('Expected: 20251003142200');
  console.log(verification.cssVersion === '20251003142200' ? '✅ CORRECT\n' : '❌ WRONG VERSION\n');

  console.log('Box Shadow (glow effect):');
  console.log(verification.boxShadow + '\n');

  const hasGoldGlow = verification.boxShadow.includes('rgb(255, 215, 0)') ||
                      verification.boxShadow.includes('rgba(255, 215, 0');

  if (hasGoldGlow) {
    console.log('✅ GOLD GLOW DETECTED in box-shadow');
    console.log('   The timeline border now has a gold glow (rgb(255, 215, 0))');
  } else {
    console.log('❌ NO GOLD GLOW FOUND');
    console.log('   Check if CSS was properly loaded');
  }

  const hasGreenGlow = verification.boxShadow.includes('rgb(0, 255, 150)') ||
                       verification.boxShadow.includes('rgba(0, 255, 150');

  if (hasGreenGlow) {
    console.log('⚠️  WARNING: Green glow still present - cache issue');
  }

  console.log('\n========================================');
  console.log('VISUAL INSPECTION');
  console.log('========================================\n');

  console.log('Look for:');
  console.log('   ✓ Gold glow around the timeline border container');
  console.log('   ✓ Glow should be subtle and soft (30px + 20px blur)');
  console.log('   ✓ Color: bright gold (rgb(255, 215, 0))');

  console.log('\n⏸️  Browser will stay open for visual inspection...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
