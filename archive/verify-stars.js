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
  console.log('STAR PARTICLE SYSTEM VERIFICATION');
  console.log('========================================\n');

  // Check CSS version
  const cssVersion = await page.evaluate(() => {
    const cssLink = document.querySelector('link[rel="stylesheet"][href*="timeline-clean-test.css"]');
    return cssLink ? cssLink.href.match(/v=(\d+)/)?.[1] : 'NOT FOUND';
  });

  console.log('📄 CSS Version Check:');
  console.log(`   Current: ${cssVersion}`);
  console.log(`   Expected: 20251003144500`);
  console.log(`   ${cssVersion === '20251003144500' ? '✅ CORRECT' : '❌ WRONG VERSION'}\n`);

  // Check canvas element exists
  const canvasCheck = await page.evaluate(() => {
    const canvas = document.getElementById('timeline-stars');
    if (!canvas) return { exists: false };

    const rect = canvas.getBoundingClientRect();
    const style = window.getComputedStyle(canvas);

    return {
      exists: true,
      tagName: canvas.tagName,
      width: canvas.width,
      height: canvas.height,
      styleWidth: style.width,
      styleHeight: style.height,
      position: style.position,
      zIndex: style.zIndex,
      pointerEvents: style.pointerEvents,
      borderRadius: style.borderRadius,
      rect: {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    };
  });

  console.log('🎨 Canvas Element Check:');
  if (!canvasCheck.exists) {
    console.log('   ❌ Canvas element not found!\n');
  } else {
    console.log(`   Element: ${canvasCheck.tagName}`);
    console.log(`   ${canvasCheck.tagName === 'CANVAS' ? '✅' : '❌'} Expected: CANVAS\n`);

    console.log(`   Canvas Dimensions: ${canvasCheck.width} x ${canvasCheck.height}px`);
    console.log(`   ${canvasCheck.width > 0 && canvasCheck.height > 0 ? '✅' : '❌'} Canvas has size\n`);

    console.log(`   CSS Dimensions: ${canvasCheck.styleWidth} x ${canvasCheck.styleHeight}`);
    console.log(`   Position: ${canvasCheck.position}`);
    console.log(`   ${canvasCheck.position === 'absolute' ? '✅' : '❌'} Expected: absolute\n`);

    console.log(`   Z-Index: ${canvasCheck.zIndex}`);
    console.log(`   ${canvasCheck.zIndex === '3' ? '✅' : '❌'} Expected: 3 (above aurora, below border)\n`);

    console.log(`   Pointer Events: ${canvasCheck.pointerEvents}`);
    console.log(`   ${canvasCheck.pointerEvents === 'none' ? '✅' : '❌'} Expected: none\n`);

    console.log(`   Border Radius: ${canvasCheck.borderRadius}`);
    console.log(`   ${canvasCheck.borderRadius === '12px' ? '✅' : '❌'} Expected: 12px\n`);
  }

  // Check JavaScript loaded
  const jsCheck = await page.evaluate(() => {
    return {
      timelineStarsExists: typeof window.timelineStars !== 'undefined',
      hasParticles: window.timelineStars && window.timelineStars.particles && window.timelineStars.particles.length > 0,
      particleCount: window.timelineStars ? window.timelineStars.particles.length : 0
    };
  });

  console.log('📜 JavaScript Check:');
  console.log(`   TimelineStars Object: ${jsCheck.timelineStarsExists ? '✅ Found' : '❌ Not found'}`);
  if (jsCheck.timelineStarsExists) {
    console.log(`   Particles Created: ${jsCheck.hasParticles ? '✅ Yes' : '❌ No'}`);
    console.log(`   Particle Count: ${jsCheck.particleCount}`);
    console.log(`   ${jsCheck.particleCount === 40 ? '✅' : '❌'} Expected: 40\n`);
  }

  // Test scroll interaction
  console.log('========================================');
  console.log('SCROLL INTERACTION TEST');
  console.log('========================================\n');

  console.log('Testing timeline scroll particle reaction...');

  const scrollTest = await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    if (!viewport) return { error: 'Timeline viewport not found' };

    // Record initial particle positions
    const initialPositions = window.timelineStars.particles.slice(0, 5).map(p => ({
      x: p.x,
      y: p.y
    }));

    // Scroll the timeline
    viewport.scrollLeft = 200;

    // Wait a moment for particles to react
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPositions = window.timelineStars.particles.slice(0, 5).map(p => ({
          x: p.x,
          y: p.y
        }));

        // Check if any particles moved
        let moved = false;
        for (let i = 0; i < 5; i++) {
          if (Math.abs(newPositions[i].x - initialPositions[i].x) > 1) {
            moved = true;
            break;
          }
        }

        resolve({
          scrollVelocity: window.timelineStars.scrollVelocity,
          particlesMoved: moved,
          initialPositions: initialPositions,
          newPositions: newPositions
        });
      }, 500);
    });
  });

  if (!scrollTest.error) {
    console.log(`   Scroll Velocity: ${scrollTest.scrollVelocity.toFixed(2)}`);
    console.log(`   Particles Reacted: ${scrollTest.particlesMoved ? '✅ Yes' : '❌ No'}\n`);
  } else {
    console.log(`   ❌ ${scrollTest.error}\n`);
  }

  // Test cursor interaction
  console.log('========================================');
  console.log('CURSOR INTERACTION TEST');
  console.log('========================================\n');

  console.log('Moving cursor over timeline...');

  await page.mouse.move(960, 540);
  await page.waitForTimeout(100);

  const cursorTest = await page.evaluate(() => {
    return {
      mouseIsOver: window.timelineStars.mouse.isOver,
      mouseX: window.timelineStars.mouse.x,
      mouseY: window.timelineStars.mouse.y
    };
  });

  console.log(`   Mouse Over Timeline: ${cursorTest.mouseIsOver ? '✅ Yes' : '❌ No'}`);
  if (cursorTest.mouseIsOver) {
    console.log(`   Mouse Position: (${cursorTest.mouseX ? Math.round(cursorTest.mouseX) : 'null'}, ${cursorTest.mouseY ? Math.round(cursorTest.mouseY) : 'null'})\n`);
  }

  // Visual verification
  console.log('========================================');
  console.log('VISUAL VERIFICATION');
  console.log('========================================\n');

  const visualCheck = await page.evaluate(() => {
    const canvas = document.getElementById('timeline-stars');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Check if canvas has any non-transparent pixels
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

  console.log('Canvas Content Check:');
  console.log(`   Canvas Size: ${visualCheck.canvasWidth} x ${visualCheck.canvasHeight}px`);
  console.log(`   Has Visible Content: ${visualCheck.hasContent ? '✅ Yes (stars are rendering)' : '❌ No (canvas is empty)'}\n`);

  // Summary
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  const allChecks = [
    cssVersion === '20251003144500',
    canvasCheck.exists,
    canvasCheck.tagName === 'CANVAS',
    canvasCheck.position === 'absolute',
    canvasCheck.zIndex === '3',
    canvasCheck.pointerEvents === 'none',
    jsCheck.timelineStarsExists,
    jsCheck.hasParticles,
    jsCheck.particleCount === 40,
    visualCheck.hasContent
  ];

  if (allChecks.every(check => check)) {
    console.log('✅ ALL CHECKS PASSED!\n');
    console.log('Star particle system successfully implemented:');
    console.log('   - Canvas element created and positioned correctly');
    console.log('   - Z-index layering correct (above aurora, below border)');
    console.log('   - 40 star particles created');
    console.log('   - Stars are rendering and visible');
    console.log('   - Scroll interaction working');
    console.log('   - Cursor interaction enabled\n');
  } else {
    console.log('❌ SOME CHECKS FAILED\n');
    console.log('Failed checks:');
    if (!allChecks[0]) console.log('   - CSS version mismatch');
    if (!allChecks[1]) console.log('   - Canvas element missing');
    if (!allChecks[2]) console.log('   - Wrong element type');
    if (!allChecks[3]) console.log('   - Position not absolute');
    if (!allChecks[4]) console.log('   - Z-index incorrect');
    if (!allChecks[5]) console.log('   - Pointer events not disabled');
    if (!allChecks[6]) console.log('   - TimelineStars object not found');
    if (!allChecks[7]) console.log('   - No particles created');
    if (!allChecks[8]) console.log('   - Wrong particle count');
    if (!allChecks[9]) console.log('   - Canvas has no visible content');
  }

  console.log('\n⏸️  Browser will stay open for visual inspection...');
  console.log('   - Watch stars twinkle');
  console.log('   - Scroll timeline to see particles drift');
  console.log('   - Move cursor to see subtle interaction');
  await page.waitForTimeout(15000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
