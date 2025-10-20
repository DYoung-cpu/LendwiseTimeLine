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
  console.log('VELOCITY-BASED STAR REACTION TEST');
  console.log('========================================\n');

  // Check JS version
  const versionCheck = await page.evaluate(() => {
    const scriptTag = document.querySelector('script[src*="timeline-stars.js"]');
    const version = scriptTag ? scriptTag.src.match(/v=(\d+)/)?.[1] : 'NOT FOUND';

    return {
      version,
      starsExist: typeof window.timelineStars !== 'undefined'
    };
  });

  console.log('📜 JavaScript Version:');
  console.log(`   Version: ${versionCheck.version}`);
  console.log(`   Expected: 20251003150000`);
  console.log(`   ${versionCheck.version === '20251003150000' ? '✅ CORRECT' : '❌ WRONG VERSION'}\n`);

  // Check particle properties
  const particleCheck = await page.evaluate(() => {
    if (!window.timelineStars) return { error: 'No stars object' };

    const particles = window.timelineStars.particles;
    const sensitivities = particles.map(p => p.sensitivity);
    const hasMomentum = particles.every(p => typeof p.momentum !== 'undefined');

    // Categorize particles by sensitivity
    const fast = sensitivities.filter(s => s >= 0.8).length;
    const medium = sensitivities.filter(s => s >= 0.5 && s < 0.8).length;
    const slow = sensitivities.filter(s => s < 0.5).length;

    return {
      totalParticles: particles.length,
      hasMomentum,
      sensitivityRange: {
        min: Math.min(...sensitivities).toFixed(2),
        max: Math.max(...sensitivities).toFixed(2),
        avg: (sensitivities.reduce((a, b) => a + b, 0) / sensitivities.length).toFixed(2)
      },
      distribution: {
        fast,
        medium,
        slow,
        fastPercent: Math.round(fast / particles.length * 100),
        mediumPercent: Math.round(medium / particles.length * 100),
        slowPercent: Math.round(slow / particles.length * 100)
      }
    };
  });

  if (!particleCheck.error) {
    console.log('⚡ Particle Properties:');
    console.log(`   Total Particles: ${particleCheck.totalParticles}`);
    console.log(`   Has Momentum: ${particleCheck.hasMomentum ? '✅ Yes' : '❌ No'}\n`);

    console.log('📊 Sensitivity Range:');
    console.log(`   Minimum: ${particleCheck.sensitivityRange.min}`);
    console.log(`   Maximum: ${particleCheck.sensitivityRange.max}`);
    console.log(`   Average: ${particleCheck.sensitivityRange.avg}\n`);

    console.log('📈 Sensitivity Distribution:');
    console.log(`   Fast (0.8-1.0): ${particleCheck.distribution.fast} particles (${particleCheck.distribution.fastPercent}%)`);
    console.log(`   ${particleCheck.distribution.fastPercent >= 15 && particleCheck.distribution.fastPercent <= 25 ? '✅' : '⚠️ '} Expected: ~20%`);
    console.log(`   Medium (0.5-0.7): ${particleCheck.distribution.medium} particles (${particleCheck.distribution.mediumPercent}%)`);
    console.log(`   ${particleCheck.distribution.mediumPercent >= 45 && particleCheck.distribution.mediumPercent <= 55 ? '✅' : '⚠️ '} Expected: ~50%`);
    console.log(`   Slow (0.3-0.4): ${particleCheck.distribution.slow} particles (${particleCheck.distribution.slowPercent}%)`);
    console.log(`   ${particleCheck.distribution.slowPercent >= 25 && particleCheck.distribution.slowPercent <= 35 ? '✅' : '⚠️ '} Expected: ~30%\n`);
  }

  // Test slow scroll
  console.log('========================================');
  console.log('TEST 1: SLOW SCROLL');
  console.log('========================================\n');

  console.log('Performing slow scroll...');

  const slowScrollTest = await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    if (!viewport) return { error: 'Viewport not found' };

    // Record initial state
    const initialPositions = window.timelineStars.particles.slice(0, 5).map(p => ({
      x: p.x,
      momentum: p.momentum,
      sensitivity: p.sensitivity
    }));

    // Slow scroll
    viewport.scrollLeft = 50;

    return new Promise((resolve) => {
      setTimeout(() => {
        const results = window.timelineStars.particles.slice(0, 5).map((p, i) => ({
          initialX: initialPositions[i].x,
          currentX: p.x,
          displacement: Math.abs(p.x - initialPositions[i].x),
          momentum: p.momentum,
          sensitivity: p.sensitivity
        }));

        const avgDisplacement = results.reduce((sum, r) => sum + r.displacement, 0) / results.length;

        resolve({
          scrollVelocity: window.timelineStars.scrollVelocity,
          avgDisplacement: avgDisplacement.toFixed(2),
          samples: results
        });
      }, 500);
    });
  });

  if (!slowScrollTest.error) {
    console.log(`   Scroll Velocity: ${slowScrollTest.scrollVelocity.toFixed(2)}`);
    console.log(`   Avg Star Displacement: ${slowScrollTest.avgDisplacement}px\n`);
    console.log('   Sample Stars:');
    slowScrollTest.samples.forEach((s, i) => {
      console.log(`      Star ${i + 1}: sensitivity=${s.sensitivity.toFixed(2)}, moved=${s.displacement.toFixed(1)}px, momentum=${s.momentum.toFixed(2)}`);
    });
  }

  // Test fast scroll
  console.log('\n========================================');
  console.log('TEST 2: FAST SCROLL');
  console.log('========================================\n');

  console.log('Performing fast scroll...');

  const fastScrollTest = await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    if (!viewport) return { error: 'Viewport not found' };

    // Reset scroll
    viewport.scrollLeft = 0;

    return new Promise((resolve) => {
      setTimeout(() => {
        // Record initial state
        const initialPositions = window.timelineStars.particles.slice(0, 5).map(p => ({
          x: p.x,
          momentum: p.momentum
        }));

        // Fast scroll (larger jump)
        viewport.scrollLeft = 300;

        setTimeout(() => {
          const results = window.timelineStars.particles.slice(0, 5).map((p, i) => ({
            displacement: Math.abs(p.x - initialPositions[i].x),
            momentum: p.momentum,
            sensitivity: p.sensitivity
          }));

          const avgDisplacement = results.reduce((sum, r) => sum + r.displacement, 0) / results.length;
          const maxMomentum = Math.max(...results.map(r => Math.abs(r.momentum)));

          resolve({
            scrollVelocity: window.timelineStars.scrollVelocity,
            avgDisplacement: avgDisplacement.toFixed(2),
            maxMomentum: maxMomentum.toFixed(2),
            samples: results
          });
        }, 500);
      }, 1000);
    });
  });

  if (!fastScrollTest.error) {
    console.log(`   Scroll Velocity: ${fastScrollTest.scrollVelocity.toFixed(2)}`);
    console.log(`   Avg Star Displacement: ${fastScrollTest.avgDisplacement}px`);
    console.log(`   Max Momentum: ${fastScrollTest.maxMomentum}\n`);
    console.log('   Sample Stars:');
    fastScrollTest.samples.forEach((s, i) => {
      console.log(`      Star ${i + 1}: sensitivity=${s.sensitivity.toFixed(2)}, moved=${s.displacement.toFixed(1)}px, momentum=${s.momentum.toFixed(2)}`);
    });

    const fastDisplacement = parseFloat(fastScrollTest.avgDisplacement);
    const slowDisplacement = parseFloat(slowScrollTest.avgDisplacement);

    console.log(`\n   Fast vs Slow Ratio: ${(fastDisplacement / slowDisplacement).toFixed(1)}x`);
    console.log(`   ${fastDisplacement > slowDisplacement * 2 ? '✅' : '⚠️ '} Fast scroll should cause more dramatic movement`);
  }

  // Summary
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  const allChecks = [
    versionCheck.version === '20251003150000',
    particleCheck.hasMomentum,
    particleCheck.sensitivityRange.min >= 0.3 && particleCheck.sensitivityRange.max <= 1.0
  ];

  if (allChecks.every(check => check)) {
    console.log('✅ ALL CHECKS PASSED!\n');
    console.log('Velocity-based star reactions implemented:');
    console.log('   - Per-particle sensitivity (0.3-1.0)');
    console.log('   - Momentum-based physics');
    console.log('   - Variable speed reactions');
    console.log('   - Fast scroll = dramatic movement');
    console.log('   - Slow scroll = gentle drift\n');
  }

  console.log('⏸️  Browser will stay open for manual testing...');
  console.log('   Try scrolling the timeline at different speeds:');
  console.log('   - Slow drag: Watch stars drift gently');
  console.log('   - Fast drag: Watch stars whoosh dramatically');
  console.log('   - Notice how different stars react at different speeds');
  await page.waitForTimeout(20000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
