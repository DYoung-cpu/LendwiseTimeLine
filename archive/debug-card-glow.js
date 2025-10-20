const { chromium } = require('playwright');

(async () => {
  console.log('🔍 DEBUGGING CARD GLOW ISSUE\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log browser console
  page.on('console', msg => console.log('  [Browser]:', msg.text()));

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  console.log('✓ Page loaded\n');

  await page.waitForTimeout(4500);

  console.log('='.repeat(60));
  console.log('STEP 1: Verify JavaScript is loaded');
  console.log('='.repeat(60));

  const jsCheck = await page.evaluate(() => {
    return {
      updateCardOpacityExists: typeof updateCardOpacity !== 'undefined',
      updateCardOpacityCode: typeof updateCardOpacity !== 'undefined'
        ? updateCardOpacity.toString().substring(0, 200)
        : 'NOT FOUND',
      hasGlowCode: typeof updateCardOpacity !== 'undefined'
        ? updateCardOpacity.toString().includes('glowThreshold')
        : false
    };
  });

  console.log(`updateCardOpacity function exists: ${jsCheck.updateCardOpacityExists ? '✓' : '✗'}`);
  console.log(`Function includes glow code: ${jsCheck.hasGlowCode ? '✓' : '✗'}`);
  if (jsCheck.updateCardOpacityExists) {
    console.log(`Function preview: ${jsCheck.updateCardOpacityCode}...\n`);
  }

  console.log('='.repeat(60));
  console.log('STEP 2: Check current card styles');
  console.log('='.repeat(60));

  const cards = page.locator('.gallery-card');
  const cardCount = await cards.count();
  const galleryTrack = page.locator('#galleryTrack').first();

  const rotation = await galleryTrack.evaluate(el => {
    const transform = el.style.transform;
    const match = transform.match(/rotateY\(([-\d.]+)deg\)/);
    return match ? parseFloat(match[1]) : 0;
  });

  console.log(`\nCurrent rotation: ${rotation.toFixed(2)}°`);
  console.log(`Card count: ${cardCount}\n`);

  const anglePerCard = 360 / cardCount;

  // Check first 5 cards
  for (let i = 0; i < Math.min(5, cardCount); i++) {
    const card = cards.nth(i);
    const cardAngle = i * anglePerCard;
    let relativeAngle = cardAngle - rotation;

    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;

    const absAngle = Math.abs(relativeAngle);
    const shouldGlow = absAngle <= 45;

    const styles = await card.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderColor: computed.borderColor,
        boxShadow: computed.boxShadow,
        inlineBorder: el.style.borderColor || 'NOT SET',
        inlineShadow: el.style.boxShadow || 'NOT SET'
      };
    });

    const hasGoldBorder = styles.borderColor.includes('215, 0') || styles.borderColor.includes('gold');
    const hasGoldShadow = styles.boxShadow.includes('215, 0') || styles.boxShadow.includes('gold');

    const expected = shouldGlow ? '🌟' : '  ';
    const actual = (hasGoldBorder || hasGoldShadow) ? '✨' : '❌';

    console.log(`Card ${i} (${relativeAngle.toFixed(1)}°): ${expected} Expected | ${actual} Actual`);
    console.log(`  Computed border: ${styles.borderColor}`);
    console.log(`  Inline border:   ${styles.inlineBorder}`);
    console.log(`  Computed shadow: ${styles.boxShadow === 'none' ? 'none' : styles.boxShadow.substring(0, 60) + '...'}`);
    console.log(`  Inline shadow:   ${styles.inlineShadow}\n`);
  }

  console.log('='.repeat(60));
  console.log('STEP 3: Force update and check again');
  console.log('='.repeat(60));

  // Try to manually trigger the update
  await page.evaluate(() => {
    if (typeof updateAllCardOpacities === 'function') {
      const cards = document.querySelectorAll('.gallery-card');
      updateAllCardOpacities(cards);
      return 'Updated';
    }
    return 'Function not found';
  });

  await page.waitForTimeout(500);

  // Check one card in detail
  const centerCardStyles = await cards.nth(0).evaluate(el => ({
    borderColor: el.style.borderColor,
    boxShadow: el.style.boxShadow,
    computedBorder: window.getComputedStyle(el).borderColor,
    computedShadow: window.getComputedStyle(el).boxShadow
  }));

  console.log('\nCard 0 after manual update:');
  console.log(`  style.borderColor: ${centerCardStyles.borderColor || 'NOT SET'}`);
  console.log(`  style.boxShadow: ${centerCardStyles.boxShadow || 'NOT SET'}`);

  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Test during rotation');
  console.log('='.repeat(60));

  const carouselContainer = page.locator('.circular-gallery-container').first();
  const box = await carouselContainer.boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Drag to rotate
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 100, centerY, { steps: 10 });
  await page.mouse.up();

  await page.waitForTimeout(300);

  const newRotation = await galleryTrack.evaluate(el => {
    const transform = el.style.transform;
    const match = transform.match(/rotateY\(([-\d.]+)deg\)/);
    return match ? parseFloat(match[1]) : 0;
  });

  console.log(`\nRotation after drag: ${newRotation.toFixed(2)}°`);

  // Check if glow changed
  const afterDragStyles = await cards.nth(0).evaluate(el => ({
    borderColor: el.style.borderColor || 'NOT SET',
    boxShadow: el.style.boxShadow || 'NOT SET'
  }));

  console.log(`Card 0 border after drag: ${afterDragStyles.borderColor}`);
  console.log(`Card 0 shadow after drag: ${afterDragStyles.boxShadow}`);

  console.log('\n' + '='.repeat(60));
  console.log('DIAGNOSIS');
  console.log('='.repeat(60));

  if (!jsCheck.hasGlowCode) {
    console.log('❌ ISSUE: Glow code not found in updateCardOpacity function');
    console.log('   Solution: Browser cache issue - need hard refresh');
  } else if (afterDragStyles.borderColor === 'NOT SET') {
    console.log('❌ ISSUE: Glow styles not being applied');
    console.log('   Possible causes:');
    console.log('   - updateCardOpacity not being called');
    console.log('   - Angle calculation is wrong');
    console.log('   - CSS is overriding inline styles');
  } else {
    console.log('✓ Glow code appears to be working');
    console.log('  Check if CSS hover is overriding the glow');
  }

  console.log('='.repeat(60) + '\n');

  await browser.close();
})();
