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
  console.log('Z-INDEX LAYERING VERIFICATION');
  console.log('========================================\n');

  // Check CSS version
  const cssVersion = await page.evaluate(() => {
    const cssLink = document.querySelector('link[rel="stylesheet"][href*="timeline-clean-test.css"]');
    return cssLink ? cssLink.href.match(/v=(\d+)/)?.[1] : 'NOT FOUND';
  });

  console.log('📄 CSS Version Check:');
  console.log(`   Current: ${cssVersion}`);
  console.log(`   Expected: 20251003145500`);
  console.log(`   ${cssVersion === '20251003145500' ? '✅ CORRECT' : '❌ WRONG VERSION'}\n`);

  // Check z-index hierarchy
  const zIndexCheck = await page.evaluate(() => {
    const starsCanvas = document.getElementById('timeline-stars');
    const viewport = document.querySelector('.timeline-viewport');
    const borderSvg = document.querySelector('.border-svg');
    const sampleCard = document.querySelector('.gallery-card');
    const sampleMilestone = document.querySelector('.timeline-milestone');

    const getZIndex = (el) => {
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return style.zIndex;
    };

    return {
      stars: getZIndex(starsCanvas),
      viewport: getZIndex(viewport),
      borderSvg: getZIndex(borderSvg),
      card: getZIndex(sampleCard),
      milestone: getZIndex(sampleMilestone)
    };
  });

  console.log('📊 Z-Index Hierarchy:');
  console.log(`   Stars Canvas: ${zIndexCheck.stars}`);
  console.log(`   ${zIndexCheck.stars === '3' ? '✅' : '❌'} Expected: 3\n`);

  console.log(`   Timeline Viewport: ${zIndexCheck.viewport}`);
  console.log(`   ${zIndexCheck.viewport === '4' ? '✅' : '❌'} Expected: 4 (above stars)\n`);

  console.log(`   Border SVG: ${zIndexCheck.borderSvg}`);
  console.log(`   ${zIndexCheck.borderSvg === '5' ? '✅' : '❌'} Expected: 5\n`);

  if (zIndexCheck.card) {
    console.log(`   Gallery Card: ${zIndexCheck.card}`);
    console.log(`   ${zIndexCheck.card === '50' ? '✅' : '❌'} Expected: 50\n`);
  }

  if (zIndexCheck.milestone) {
    console.log(`   Timeline Milestone: ${zIndexCheck.milestone}`);
    console.log(`   ${zIndexCheck.milestone === '10' ? '✅' : '❌'} Expected: 10\n`);
  }

  // Verify stacking order
  console.log('========================================');
  console.log('STACKING ORDER ANALYSIS');
  console.log('========================================\n');

  const starsAboveViewport = parseInt(zIndexCheck.stars) < parseInt(zIndexCheck.viewport);
  const viewportBelowBorder = parseInt(zIndexCheck.viewport) < parseInt(zIndexCheck.borderSvg);

  console.log('Layer Order (bottom to top):');
  console.log('   1. Aurora background (z-index: 1)');
  console.log('   2. Stars canvas (z-index: 3)');
  console.log(`   3. Timeline viewport (z-index: ${zIndexCheck.viewport}) ${starsAboveViewport ? '✅' : '❌'}`);
  console.log(`   4. Border SVG (z-index: ${zIndexCheck.borderSvg}) ${viewportBelowBorder ? '✅' : '❌'}`);
  console.log('');

  if (starsAboveViewport) {
    console.log('✅ Stars are BELOW timeline viewport');
    console.log('   All timeline content (cards, milestones, buttons) will be above stars');
  } else {
    console.log('❌ Stars are ABOVE timeline viewport');
    console.log('   Timeline content may be obscured by stars');
  }

  // Summary
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  const allChecks = [
    cssVersion === '20251003145500',
    zIndexCheck.stars === '3',
    zIndexCheck.viewport === '4',
    zIndexCheck.borderSvg === '5',
    starsAboveViewport
  ];

  if (allChecks.every(check => check)) {
    console.log('✅ ALL CHECKS PASSED!\n');
    console.log('Z-index layering is correct:');
    console.log('   - Stars canvas at z-index: 3');
    console.log('   - Timeline viewport at z-index: 4');
    console.log('   - All timeline content above stars');
    console.log('   - Border SVG at z-index: 5 (topmost)\n');
    console.log('Stars will NOT pass over buttons/cards/milestones!');
  } else {
    console.log('❌ SOME CHECKS FAILED\n');
    console.log('Failed checks:');
    if (!allChecks[0]) console.log('   - CSS version mismatch');
    if (!allChecks[1]) console.log('   - Stars z-index incorrect');
    if (!allChecks[2]) console.log('   - Viewport z-index incorrect');
    if (!allChecks[3]) console.log('   - Border SVG z-index incorrect');
    if (!allChecks[4]) console.log('   - Stars not below viewport');
  }

  console.log('\n⏸️  Browser will stay open for visual inspection...');
  console.log('   - Move cursor over timeline buttons/cards');
  console.log('   - Stars should stay BEHIND all content');
  console.log('   - Sparkles should not obscure any interactive elements');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
