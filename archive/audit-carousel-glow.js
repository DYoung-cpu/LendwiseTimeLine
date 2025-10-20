const { chromium } = require('playwright');

(async () => {
  console.log('🔍 COMPREHENSIVE CAROUSEL GLOW AUDIT\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);

  console.log('='.repeat(80));
  console.log('INITIAL STATE - CHECKING ALL CARDS');
  console.log('='.repeat(80));

  const initialState = await page.evaluate(() => {
    const track = document.getElementById('galleryTrack');
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');

    if (!owlElement) return { error: 'Owl not found' };

    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterX = owlRect.left + owlRect.width / 2;
    const owlCenterY = owlRect.top + owlRect.height / 2;

    const transform = track.style.transform;
    const rotationMatch = transform.match(/rotateY\(([\d.-]+)deg\)/);
    const rotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
    const anglePerCard = 360 / cards.length;

    return {
      owlPosition: { x: Math.round(owlCenterX), y: Math.round(owlCenterY) },
      rotation: rotation.toFixed(2),
      cardCount: cards.length,
      anglePerCard: anglePerCard.toFixed(1),
      cards: cards.map((card, index) => {
        const cardAngle = index * anglePerCard;
        let relativeAngle = cardAngle - rotation;
        while (relativeAngle > 180) relativeAngle -= 360;
        while (relativeAngle < -180) relativeAngle += 360;
        const absAngle = Math.abs(relativeAngle);

        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;

        const distance = Math.sqrt(
          Math.pow(cardCenterX - owlCenterX, 2) +
          Math.pow(cardCenterY - owlCenterY, 2)
        );

        const hasGoldBorder = card.style.borderColor?.includes('215, 0');
        const isFrontFacing = absAngle <= 90;
        const isWithinDistance = distance <= 450;
        const shouldGlow = isFrontFacing && isWithinDistance;

        return {
          index,
          title: card.querySelector('h3')?.textContent || 'Unknown',
          angle: relativeAngle.toFixed(1),
          absAngle: absAngle.toFixed(1),
          distance: Math.round(distance),
          position: { x: Math.round(cardCenterX), y: Math.round(cardCenterY) },
          isFrontFacing,
          isWithinDistance,
          shouldGlow,
          hasGlow: hasGoldBorder,
          borderColor: card.style.borderColor || 'not set',
          zIndex: parseInt(window.getComputedStyle(card).zIndex) || 0
        };
      })
    };
  });

  if (initialState.error) {
    console.log(`❌ ${initialState.error}`);
    await browser.close();
    return;
  }

  console.log(`\nOwl Position: (${initialState.owlPosition.x}, ${initialState.owlPosition.y})`);
  console.log(`Carousel Rotation: ${initialState.rotation}°`);
  console.log(`Cards: ${initialState.cardCount}, Angle per card: ${initialState.anglePerCard}°`);
  console.log(`\nGlow Requirements: Front-facing (angle ≤ 90°) AND within 450px distance\n`);

  console.log('Card Analysis:');
  console.log('-'.repeat(80));

  initialState.cards.forEach(card => {
    const match = card.shouldGlow === card.hasGlow ? '✓' : '✗';
    const frontIcon = card.isFrontFacing ? 'FRONT' : 'BACK ';
    const distIcon = card.isWithinDistance ? 'NEAR' : 'FAR ';
    const glowIcon = card.hasGlow ? '✨' : '  ';
    const expectedIcon = card.shouldGlow ? '🌟' : '  ';

    console.log(`${match} ${expectedIcon}${glowIcon} Card ${card.index}: ${card.title}`);
    console.log(`   Angle: ${card.angle}° (abs: ${card.absAngle}°) | ${frontIcon} | ${distIcon} (${card.distance}px)`);
    console.log(`   Position: (${card.position.x}, ${card.position.y}) | z-index: ${card.zIndex}`);
    console.log(`   Border: ${card.borderColor}`);

    if (card.shouldGlow !== card.hasGlow) {
      if (card.shouldGlow && !card.hasGlow) {
        console.log(`   ❌ SHOULD GLOW BUT DOESN'T - Missing glow!`);
      } else {
        console.log(`   ❌ SHOULDN'T GLOW BUT DOES - Unexpected glow!`);
      }
    }
    console.log('');
  });

  // Summary
  const correctGlow = initialState.cards.filter(c => c.shouldGlow === c.hasGlow).length;
  const missingGlow = initialState.cards.filter(c => c.shouldGlow && !c.hasGlow);
  const unexpectedGlow = initialState.cards.filter(c => !c.shouldGlow && c.hasGlow);

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nCorrect: ${correctGlow}/${initialState.cardCount} cards`);
  console.log(`Missing glow: ${missingGlow.length} cards`);
  console.log(`Unexpected glow: ${unexpectedGlow.length} cards`);

  if (missingGlow.length > 0) {
    console.log('\n❌ Cards that SHOULD glow but DON\'T:');
    missingGlow.forEach(c => {
      console.log(`  - ${c.title} (Card ${c.index}): ${c.angle}°, ${c.distance}px`);
    });
  }

  if (unexpectedGlow.length > 0) {
    console.log('\n❌ Cards that SHOULDN\'T glow but DO:');
    unexpectedGlow.forEach(c => {
      console.log(`  - ${c.title} (Card ${c.index}): ${c.angle}°, ${c.distance}px`);
      if (!c.isFrontFacing) {
        console.log(`     Issue: Card is BEHIND carousel (angle ${c.absAngle}° > 90°)`);
      }
      if (!c.isWithinDistance) {
        console.log(`     Issue: Card is too FAR from owl (${c.distance}px > 300px)`);
      }
    });
  }

  // Test during rotation
  console.log('\n' + '='.repeat(80));
  console.log('TESTING DURING CAROUSEL ROTATION');
  console.log('='.repeat(80));

  const carouselContainer = page.locator('.circular-gallery-container').first();
  const box = await carouselContainer.boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  console.log('\nRotating carousel 90° to the right...');
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 200, centerY, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  const afterRotation = await page.evaluate(() => {
    const track = document.getElementById('galleryTrack');
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');

    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterX = owlRect.left + owlRect.width / 2;
    const owlCenterY = owlRect.top + owlRect.height / 2;

    const transform = track.style.transform;
    const rotationMatch = transform.match(/rotateY\(([\d.-]+)deg\)/);
    const rotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
    const anglePerCard = 360 / cards.length;

    return {
      rotation: rotation.toFixed(2),
      cards: cards.map((card, index) => {
        const cardAngle = index * anglePerCard;
        let relativeAngle = cardAngle - rotation;
        while (relativeAngle > 180) relativeAngle -= 360;
        while (relativeAngle < -180) relativeAngle += 360;
        const absAngle = Math.abs(relativeAngle);

        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;

        const distance = Math.sqrt(
          Math.pow(cardCenterX - owlCenterX, 2) +
          Math.pow(cardCenterY - owlCenterY, 2)
        );

        const hasGoldBorder = card.style.borderColor?.includes('215, 0');
        const isFrontFacing = absAngle <= 90;
        const isWithinDistance = distance <= 450;
        const shouldGlow = isFrontFacing && isWithinDistance;

        return {
          index,
          title: card.querySelector('h3')?.textContent || 'Unknown',
          angle: relativeAngle.toFixed(1),
          distance: Math.round(distance),
          isFrontFacing,
          isWithinDistance,
          shouldGlow,
          hasGlow: hasGoldBorder
        };
      })
    };
  });

  console.log(`New rotation: ${afterRotation.rotation}°\n`);

  const newMissing = afterRotation.cards.filter(c => c.shouldGlow && !c.hasGlow);
  const newUnexpected = afterRotation.cards.filter(c => !c.shouldGlow && c.hasGlow);

  console.log('Cards after rotation:');
  afterRotation.cards.forEach(c => {
    if (c.hasGlow || c.shouldGlow) {
      const match = c.shouldGlow === c.hasGlow ? '✓' : '✗';
      const icon = c.hasGlow ? '✨' : '  ';
      const expected = c.shouldGlow ? '🌟' : '  ';
      console.log(`${match} ${expected}${icon} ${c.title}: ${c.angle}°, ${c.distance}px`);
    }
  });

  console.log(`\nAfter rotation - Missing: ${newMissing.length}, Unexpected: ${newUnexpected.length}`);

  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSIS');
  console.log('='.repeat(80));

  if (missingGlow.length === 0 && unexpectedGlow.length === 0) {
    console.log('\n✅ All cards behaving correctly!');
  } else {
    console.log('\n❌ Glow logic has issues:');
    if (missingGlow.length > 0) {
      console.log(`\n1. ${missingGlow.length} card(s) should glow but don't`);
      console.log('   Possible causes:');
      console.log('   - updateCardOpacity not being called for these cards');
      console.log('   - Distance/angle calculation incorrect');
      console.log('   - CSS override preventing glow');
    }
    if (unexpectedGlow.length > 0) {
      console.log(`\n2. ${unexpectedGlow.length} card(s) glowing when they shouldn't`);
      console.log('   Possible causes:');
      console.log('   - Front-facing check (absAngle <= 90) not working');
      console.log('   - Distance threshold too large');
      console.log('   - Previous glow not being cleared');
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

  await browser.close();
})();
