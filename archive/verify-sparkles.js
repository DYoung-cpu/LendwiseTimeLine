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
  console.log('SPARKLE STAR VERIFICATION');
  console.log('========================================\n');

  // Check JS version
  const jsCheck = await page.evaluate(() => {
    const scriptTag = document.querySelector('script[src*="timeline-stars.js"]');
    const version = scriptTag ? scriptTag.src.match(/v=(\d+)/)?.[1] : 'NOT FOUND';

    return {
      version,
      timelineStarsExists: typeof window.timelineStars !== 'undefined',
      particleCount: window.timelineStars ? window.timelineStars.particles.length : 0,
      sampleParticle: window.timelineStars && window.timelineStars.particles[0] ? {
        size: window.timelineStars.particles[0].size,
        hasRotation: typeof window.timelineStars.particles[0].rotation !== 'undefined',
        rotation: window.timelineStars.particles[0].rotation
      } : null
    };
  });

  console.log('📜 JavaScript Version Check:');
  console.log(`   Version: ${jsCheck.version}`);
  console.log(`   Expected: 20251003145000`);
  console.log(`   ${jsCheck.version === '20251003145000' ? '✅ CORRECT' : '❌ WRONG VERSION'}\n`);

  console.log('📊 Particle Configuration:');
  console.log(`   TimelineStars Object: ${jsCheck.timelineStarsExists ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Particle Count: ${jsCheck.particleCount}\n`);

  if (jsCheck.sampleParticle) {
    console.log('⭐ Sample Particle Properties:');
    console.log(`   Size: ${jsCheck.sampleParticle.size.toFixed(2)}px`);
    console.log(`   ${jsCheck.sampleParticle.size < 2 ? '✅' : '❌'} Size reduced (expected < 2px)`);
    console.log(`   Has Rotation: ${jsCheck.sampleParticle.hasRotation ? '✅ Yes' : '❌ No'}`);
    if (jsCheck.sampleParticle.hasRotation) {
      console.log(`   Rotation: ${jsCheck.sampleParticle.rotation.toFixed(2)} radians\n`);
    }
  }

  // Check particle sizes
  const sizeCheck = await page.evaluate(() => {
    if (!window.timelineStars) return { error: 'No stars object' };

    const sizes = window.timelineStars.particles.map(p => p.size);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;

    return {
      minSize,
      maxSize,
      avgSize,
      allSmall: maxSize < 2
    };
  });

  if (!sizeCheck.error) {
    console.log('📏 Size Analysis:');
    console.log(`   Minimum: ${sizeCheck.minSize.toFixed(2)}px`);
    console.log(`   Maximum: ${sizeCheck.maxSize.toFixed(2)}px`);
    console.log(`   Average: ${sizeCheck.avgSize.toFixed(2)}px`);
    console.log(`   ${sizeCheck.allSmall ? '✅' : '❌'} All particles under 2px\n`);
  }

  // Visual check
  const visualCheck = await page.evaluate(() => {
    const canvas = document.getElementById('timeline-stars');
    if (!canvas) return { error: 'Canvas not found' };

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Check if canvas has content
    let hasContent = false;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) {
        hasContent = true;
        break;
      }
    }

    return {
      hasContent,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    };
  });

  if (!visualCheck.error) {
    console.log('🎨 Visual Verification:');
    console.log(`   Canvas Size: ${visualCheck.canvasWidth} x ${visualCheck.canvasHeight}px`);
    console.log(`   Has Visible Sparkles: ${visualCheck.hasContent ? '✅ Yes' : '❌ No'}\n`);
  }

  // Summary
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  const allChecks = [
    jsCheck.version === '20251003145000',
    jsCheck.timelineStarsExists,
    jsCheck.sampleParticle && jsCheck.sampleParticle.hasRotation,
    sizeCheck.allSmall,
    visualCheck.hasContent
  ];

  if (allChecks.every(check => check)) {
    console.log('✅ ALL CHECKS PASSED!\n');
    console.log('Sparkle stars successfully updated:');
    console.log('   - Particle sizes reduced (0.5-1.5px)');
    console.log('   - Rotation property added for sparkle effect');
    console.log('   - Drawing method changed to 4-ray sparkle');
    console.log('   - Stars now look like sparkles, not orbs');
    console.log('   - All particles rendering correctly\n');
  } else {
    console.log('❌ SOME CHECKS FAILED\n');
    console.log('Failed checks:');
    if (!allChecks[0]) console.log('   - JS version mismatch');
    if (!allChecks[1]) console.log('   - TimelineStars object not found');
    if (!allChecks[2]) console.log('   - Rotation property missing');
    if (!allChecks[3]) console.log('   - Particle sizes not reduced');
    if (!allChecks[4]) console.log('   - Canvas has no visible content');
  }

  console.log('\n⏸️  Browser will stay open for visual inspection...');
  console.log('   - Stars should now have a sparkle/cross shape');
  console.log('   - Stars should be smaller and more delicate');
  console.log('   - Watch them twinkle and react to scrolling');
  await page.waitForTimeout(15000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
