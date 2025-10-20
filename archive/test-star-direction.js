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
  console.log('STAR MOVEMENT DIRECTION TEST');
  console.log('========================================\n');

  console.log('Testing parallax effect: stars should move OPPOSITE to scroll direction\n');

  // Test 1: Scroll RIGHT (stars should move LEFT)
  console.log('========================================');
  console.log('TEST 1: SCROLL RIGHT → STARS MOVE LEFT');
  console.log('========================================\n');

  const rightScrollTest = await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    if (!viewport) return { error: 'Viewport not found' };

    // Reset scroll position
    viewport.scrollLeft = 100;

    return new Promise((resolve) => {
      setTimeout(() => {
        // Record initial positions
        const initialPositions = window.timelineStars.particles.slice(0, 10).map(p => p.x);
        const initialScroll = viewport.scrollLeft;

        // Scroll RIGHT (increase scrollLeft)
        viewport.scrollLeft = 300;

        setTimeout(() => {
          const finalPositions = window.timelineStars.particles.slice(0, 10).map((p, i) => ({
            index: i,
            initialX: initialPositions[i],
            finalX: p.x,
            delta: p.x - initialPositions[i],
            movedLeft: p.x < initialPositions[i],
            movedRight: p.x > initialPositions[i],
            momentum: p.momentum,
            sensitivity: p.sensitivity
          }));

          const scrollDirection = viewport.scrollLeft - initialScroll; // Positive = scrolled right
          const avgDelta = finalPositions.reduce((sum, p) => sum + p.delta, 0) / finalPositions.length;
          const movedLeftCount = finalPositions.filter(p => p.movedLeft).length;
          const movedRightCount = finalPositions.filter(p => p.movedRight).length;

          resolve({
            scrollDirection: scrollDirection > 0 ? 'RIGHT' : 'LEFT',
            scrollAmount: Math.abs(scrollDirection),
            avgStarDelta: avgDelta.toFixed(2),
            movedLeft: movedLeftCount,
            movedRight: movedRightCount,
            samples: finalPositions,
            scrollVelocity: window.timelineStars.scrollVelocity
          });
        }, 800);
      }, 500);
    });
  });

  if (!rightScrollTest.error) {
    console.log(`Scroll Direction: ${rightScrollTest.scrollDirection}`);
    console.log(`Scroll Amount: ${rightScrollTest.scrollAmount}px`);
    console.log(`Scroll Velocity: ${rightScrollTest.scrollVelocity.toFixed(2)}\n`);

    console.log(`Average Star Delta: ${rightScrollTest.avgStarDelta}px`);
    console.log(`  Stars Moved LEFT: ${rightScrollTest.movedLeft}/10`);
    console.log(`  Stars Moved RIGHT: ${rightScrollTest.movedRight}/10\n`);

    const isCorrect = parseFloat(rightScrollTest.avgStarDelta) < 0;
    console.log(`${isCorrect ? '✅' : '❌'} Stars ${isCorrect ? 'CORRECTLY' : 'INCORRECTLY'} moved LEFT when scrolling RIGHT\n`);

    console.log('Sample stars:');
    rightScrollTest.samples.slice(0, 5).forEach(s => {
      const direction = s.delta < 0 ? '←' : '→';
      console.log(`  Star ${s.index + 1}: ${direction} ${Math.abs(s.delta).toFixed(1)}px (sensitivity: ${s.sensitivity.toFixed(2)}, momentum: ${s.momentum.toFixed(2)})`);
    });
  }

  // Test 2: Scroll LEFT (stars should move RIGHT)
  console.log('\n========================================');
  console.log('TEST 2: SCROLL LEFT → STARS MOVE RIGHT');
  console.log('========================================\n');

  const leftScrollTest = await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    if (!viewport) return { error: 'Viewport not found' };

    // Set scroll position
    viewport.scrollLeft = 300;

    return new Promise((resolve) => {
      setTimeout(() => {
        // Record initial positions
        const initialPositions = window.timelineStars.particles.slice(0, 10).map(p => p.x);
        const initialScroll = viewport.scrollLeft;

        // Scroll LEFT (decrease scrollLeft)
        viewport.scrollLeft = 100;

        setTimeout(() => {
          const finalPositions = window.timelineStars.particles.slice(0, 10).map((p, i) => ({
            index: i,
            initialX: initialPositions[i],
            finalX: p.x,
            delta: p.x - initialPositions[i],
            movedLeft: p.x < initialPositions[i],
            movedRight: p.x > initialPositions[i],
            momentum: p.momentum,
            sensitivity: p.sensitivity
          }));

          const scrollDirection = viewport.scrollLeft - initialScroll; // Negative = scrolled left
          const avgDelta = finalPositions.reduce((sum, p) => sum + p.delta, 0) / finalPositions.length;
          const movedLeftCount = finalPositions.filter(p => p.movedLeft).length;
          const movedRightCount = finalPositions.filter(p => p.movedRight).length;

          resolve({
            scrollDirection: scrollDirection < 0 ? 'LEFT' : 'RIGHT',
            scrollAmount: Math.abs(scrollDirection),
            avgStarDelta: avgDelta.toFixed(2),
            movedLeft: movedLeftCount,
            movedRight: movedRightCount,
            samples: finalPositions,
            scrollVelocity: window.timelineStars.scrollVelocity
          });
        }, 800);
      }, 1500);
    });
  });

  if (!leftScrollTest.error) {
    console.log(`Scroll Direction: ${leftScrollTest.scrollDirection}`);
    console.log(`Scroll Amount: ${leftScrollTest.scrollAmount}px`);
    console.log(`Scroll Velocity: ${leftScrollTest.scrollVelocity.toFixed(2)}\n`);

    console.log(`Average Star Delta: ${leftScrollTest.avgStarDelta}px`);
    console.log(`  Stars Moved LEFT: ${leftScrollTest.movedLeft}/10`);
    console.log(`  Stars Moved RIGHT: ${leftScrollTest.movedRight}/10\n`);

    const isCorrect = parseFloat(leftScrollTest.avgStarDelta) > 0;
    console.log(`${isCorrect ? '✅' : '❌'} Stars ${isCorrect ? 'CORRECTLY' : 'INCORRECTLY'} moved RIGHT when scrolling LEFT\n`);

    console.log('Sample stars:');
    leftScrollTest.samples.slice(0, 5).forEach(s => {
      const direction = s.delta < 0 ? '←' : '→';
      console.log(`  Star ${s.index + 1}: ${direction} ${Math.abs(s.delta).toFixed(1)}px (sensitivity: ${s.sensitivity.toFixed(2)}, momentum: ${s.momentum.toFixed(2)})`);
    });
  }

  // Summary
  console.log('\n========================================');
  console.log('PARALLAX DIRECTION ANALYSIS');
  console.log('========================================\n');

  const rightScrollCorrect = parseFloat(rightScrollTest.avgStarDelta) < 0;
  const leftScrollCorrect = parseFloat(leftScrollTest.avgStarDelta) > 0;

  console.log('Expected Behavior (Parallax Effect):');
  console.log('  Scroll RIGHT → Stars move LEFT');
  console.log('  Scroll LEFT  → Stars move RIGHT\n');

  console.log('Actual Behavior:');
  console.log(`  Scroll RIGHT → Stars moved ${rightScrollCorrect ? 'LEFT ✅' : 'RIGHT ❌'}`);
  console.log(`  Scroll LEFT  → Stars moved ${leftScrollCorrect ? 'RIGHT ✅' : 'LEFT ❌'}\n`);

  if (rightScrollCorrect && leftScrollCorrect) {
    console.log('✅ PARALLAX EFFECT WORKING CORRECTLY!');
    console.log('   Stars move opposite to scroll direction');
    console.log('   Creates proper depth perception');
  } else {
    console.log('❌ PARALLAX EFFECT NOT WORKING AS EXPECTED');
    console.log('   Stars are moving in the wrong direction');
    console.log('   Need to reverse the scroll influence');
  }

  console.log('\n⏸️  Browser will stay open for manual testing...');
  console.log('   Try scrolling left and right:');
  console.log('   - Drag timeline RIGHT → Stars should drift LEFT');
  console.log('   - Drag timeline LEFT  → Stars should drift RIGHT');
  await page.waitForTimeout(15000);

  await browser.close();
  console.log('\n✅ Test complete!');
})();
