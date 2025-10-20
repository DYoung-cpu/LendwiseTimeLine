const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,  // Run headless for quick results
    slowMo: 0
  });

  const page = await browser.newPage();

  // Disable cache
  await page.route('**/*', (route) => route.continue({
    headers: { ...route.request().headers(), 'Cache-Control': 'no-cache' }
  }));

  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(3000); // Wait for page and stars to load

  console.log('\n=== STAR PARTICLE SYSTEM AUDIT ===\n');

  // 1. CHECK CANVAS ELEMENT
  console.log('1. CANVAS ELEMENT:');
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.getElementById('timeline-stars');
    if (!canvas) return { exists: false };

    const rect = canvas.getBoundingClientRect();
    const styles = window.getComputedStyle(canvas);

    return {
      exists: true,
      dimensions: {
        width: canvas.width,
        height: canvas.height,
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height
      },
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      },
      styles: {
        position: styles.position,
        zIndex: styles.zIndex,
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        pointerEvents: styles.pointerEvents
      },
      hasContext: !!canvas.getContext('2d')
    };
  });

  console.log(JSON.stringify(canvasInfo, null, 2));

  if (!canvasInfo.exists) {
    console.log('\n❌ FAIL: Canvas element not found');
  } else if (canvasInfo.dimensions.width === 0 || canvasInfo.dimensions.height === 0) {
    console.log('\n❌ FAIL: Canvas has zero dimensions');
  } else {
    console.log('\n✅ PASS: Canvas element exists with dimensions');
  }

  // 2. CHECK TIMELINE STARS CLASS
  console.log('\n2. TIMELINE STARS CLASS:');
  const classInfo = await page.evaluate(() => {
    return {
      classExists: typeof TimelineStars !== 'undefined',
      instanceExists: typeof window.timelineStars !== 'undefined',
      instanceType: window.timelineStars ? window.timelineStars.constructor.name : null
    };
  });

  console.log(JSON.stringify(classInfo, null, 2));

  if (!classInfo.classExists) {
    console.log('\n❌ FAIL: TimelineStars class not defined');
  } else if (!classInfo.instanceExists) {
    console.log('\n❌ FAIL: TimelineStars instance not created');
  } else {
    console.log('\n✅ PASS: TimelineStars class and instance exist');
  }

  // 3. CHECK PARTICLES
  console.log('\n3. PARTICLES:');
  const particleInfo = await page.evaluate(() => {
    if (!window.timelineStars) return { error: 'No instance' };

    return {
      particleCount: window.timelineStars.particles?.length || 0,
      expectedCount: window.timelineStars.particleCount || 0,
      particles: window.timelineStars.particles?.slice(0, 3).map(p => ({
        x: p.x,
        y: p.y,
        size: p.size,
        color: p.color,
        opacity: p.opacity
      })) || []
    };
  });

  console.log(JSON.stringify(particleInfo, null, 2));

  if (particleInfo.error) {
    console.log('\n❌ FAIL: Cannot access particles - no instance');
  } else if (particleInfo.particleCount === 0) {
    console.log('\n❌ FAIL: No particles created');
  } else {
    console.log('\n✅ PASS: Particles created');
  }

  // 4. CHECK Z-INDEX LAYERING
  console.log('\n4. Z-INDEX LAYERING:');
  const zIndexInfo = await page.evaluate(() => {
    const canvas = document.getElementById('timeline-stars');
    const borderContainer = document.querySelector('.timeline-border-container');
    const borderSvg = document.getElementById('border-svg');
    const viewport = document.querySelector('.timeline-viewport');

    const getZIndex = (el) => el ? window.getComputedStyle(el).zIndex : 'N/A';

    return {
      canvas: getZIndex(canvas),
      borderContainer: getZIndex(borderContainer),
      borderSvg: getZIndex(borderSvg),
      viewport: getZIndex(viewport)
    };
  });

  console.log(JSON.stringify(zIndexInfo, null, 2));

  // 5. CHECK CONSOLE ERRORS
  console.log('\n5. CONSOLE ERRORS:');
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.reload();
  await page.waitForTimeout(2000);

  if (errors.length > 0) {
    console.log('Errors found:');
    errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('✅ No JavaScript errors found');
  }

  // 6. CHECK ANIMATION
  console.log('\n6. ANIMATION:');
  const animationInfo = await page.evaluate(() => {
    if (!window.timelineStars) return { error: 'No instance' };

    return {
      animationIdExists: window.timelineStars.animationId !== null,
      animationId: window.timelineStars.animationId
    };
  });

  console.log(JSON.stringify(animationInfo, null, 2));

  if (animationInfo.error) {
    console.log('\n❌ FAIL: Cannot check animation - no instance');
  } else if (!animationInfo.animationIdExists) {
    console.log('\n❌ FAIL: Animation not running');
  } else {
    console.log('\n✅ PASS: Animation running');
  }

  // 7. VISUAL CANVAS CHECK
  console.log('\n7. VISUAL CANVAS CHECK:');
  const canvasData = await page.evaluate(() => {
    const canvas = document.getElementById('timeline-stars');
    if (!canvas) return { error: 'No canvas' };

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Check if any pixels are non-transparent
    let nonTransparentPixels = 0;
    for (let i = 3; i < data.length; i += 4) { // Check alpha channel
      if (data[i] > 0) nonTransparentPixels++;
    }

    return {
      totalPixels: canvas.width * canvas.height,
      nonTransparentPixels: nonTransparentPixels,
      hasDrawing: nonTransparentPixels > 0
    };
  });

  console.log(JSON.stringify(canvasData, null, 2));

  if (canvasData.error) {
    console.log('\n❌ FAIL: Cannot check canvas drawing');
  } else if (!canvasData.hasDrawing) {
    console.log('\n❌ FAIL: Canvas is blank - no drawing detected');
  } else {
    console.log('\n✅ PASS: Canvas has drawing');
  }

  // 8. SUMMARY
  console.log('\n=== AUDIT SUMMARY ===\n');

  const checks = {
    canvasExists: canvasInfo.exists && canvasInfo.dimensions.width > 0,
    classExists: classInfo.classExists && classInfo.instanceExists,
    particlesCreated: particleInfo.particleCount > 0,
    animationRunning: animationInfo.animationIdExists,
    canvasDrawing: canvasData.hasDrawing
  };

  const passedCount = Object.values(checks).filter(v => v).length;
  const totalCount = Object.keys(checks).length;

  console.log(`Passed: ${passedCount}/${totalCount} checks`);

  if (passedCount === totalCount) {
    console.log('\n🎉 ✅ ALL CHECKS PASSED - Stars should be visible!\n');
  } else {
    console.log('\n⚠️  Some checks failed\n');
    console.log('Failed checks:');
    Object.entries(checks).forEach(([key, passed]) => {
      if (!passed) console.log(`  - ${key}`);
    });
    console.log('');
  }

  await browser.close();
})();
