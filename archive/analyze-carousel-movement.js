const { chromium } = require('playwright');

(async () => {
  console.log('🎡 ANALYZING CAROUSEL & OWL SPATIAL RELATIONSHIP\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);

  console.log('='.repeat(70));
  console.log('STEP 1: Get Owl Position (Center/Viewer Position)');
  console.log('='.repeat(70));

  const owlInfo = await page.evaluate(() => {
    const owl = document.querySelector('.landing-owl');
    const owlVideo = document.querySelector('.landing-owl .wisr-video-circle');

    if (!owl && !owlVideo) return { error: 'Owl not found' };

    const target = owlVideo || owl;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return {
      exists: true,
      boundingBox: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      center: { x: centerX, y: centerY },
      viewport: { width: window.innerWidth, height: window.innerHeight }
    };
  });

  if (owlInfo.error) {
    console.log(`❌ ${owlInfo.error}\n`);
  } else {
    console.log(`Owl position:`);
    console.log(`  Center: (${Math.round(owlInfo.center.x)}, ${Math.round(owlInfo.center.y)})`);
    console.log(`  Size: ${Math.round(owlInfo.boundingBox.width)}x${Math.round(owlInfo.boundingBox.height)}`);
    console.log(`  Viewport: ${owlInfo.viewport.width}x${owlInfo.viewport.height}\n`);
  }

  console.log('='.repeat(70));
  console.log('STEP 2: Analyze Carousel Rotation & Card Positions');
  console.log('='.repeat(70));

  const carouselInfo = await page.evaluate(() => {
    const track = document.getElementById('galleryTrack');
    const cards = Array.from(document.querySelectorAll('.gallery-card'));

    if (!track || cards.length === 0) {
      return { error: 'Carousel not found' };
    }

    // Get current rotation
    const transform = track.style.transform;
    const rotationMatch = transform.match(/rotateY\(([-\d.]+)deg\)/);
    const currentRotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;

    const anglePerCard = 360 / cards.length;

    // Get each card's position info
    const cardPositions = cards.map((card, index) => {
      const rect = card.getBoundingClientRect();
      const cardAngle = index * anglePerCard;
      let relativeAngle = cardAngle - currentRotation;

      // Normalize to -180 to 180
      while (relativeAngle > 180) relativeAngle -= 360;
      while (relativeAngle < -180) relativeAngle += 360;

      const absAngle = Math.abs(relativeAngle);

      // Get current styles
      const computed = window.getComputedStyle(card);
      const hasGoldBorder = computed.borderColor.includes('215, 0') ||
                           card.style.borderColor?.includes('215, 0');
      const hasGoldShadow = computed.boxShadow?.includes('215, 0') ||
                           card.style.boxShadow?.includes('215, 0');

      return {
        index,
        cardAngle: cardAngle.toFixed(1),
        relativeAngle: relativeAngle.toFixed(1),
        absAngle: absAngle.toFixed(1),
        boundingBox: {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          centerX: Math.round(rect.left + rect.width / 2),
          centerY: Math.round(rect.top + rect.height / 2)
        },
        isVisible: rect.width > 0 && rect.height > 0,
        zIndex: parseInt(computed.zIndex) || 0,
        opacity: parseFloat(computed.opacity),
        hasGlow: hasGoldBorder || hasGoldShadow,
        borderColor: card.style.borderColor || 'not set',
        boxShadow: card.style.boxShadow ? card.style.boxShadow.substring(0, 40) + '...' : 'not set'
      };
    });

    return {
      rotation: currentRotation.toFixed(2),
      cardCount: cards.length,
      anglePerCard: anglePerCard.toFixed(1),
      cards: cardPositions
    };
  });

  if (carouselInfo.error) {
    console.log(`❌ ${carouselInfo.error}\n`);
    await browser.close();
    return;
  }

  console.log(`\nCarousel rotation: ${carouselInfo.rotation}°`);
  console.log(`Cards: ${carouselInfo.cardCount}, Angle per card: ${carouselInfo.anglePerCard}°\n`);

  console.log('Card Positions & Glow Status:');
  console.log('-'.repeat(70));

  carouselInfo.cards.forEach(card => {
    const isFrontFacing = Math.abs(parseFloat(card.relativeAngle)) <= 45;
    const shouldGlow = Math.abs(parseFloat(card.relativeAngle)) <= 45;
    const statusIcon = shouldGlow ? '🌟' : '  ';
    const glowIcon = card.hasGlow ? '✨' : '❌';
    const match = shouldGlow === card.hasGlow ? '✓' : '✗';

    console.log(`${match} ${statusIcon} Card ${card.index}: angle=${card.relativeAngle}°, glow=${glowIcon}`);
    console.log(`    Position: (${card.boundingBox.centerX}, ${card.boundingBox.centerY})`);
    console.log(`    Z-index: ${card.zIndex}, Opacity: ${card.opacity}`);
    console.log(`    Border: ${card.borderColor}`);
    console.log(`    Shadow: ${card.boxShadow}\n`);
  });

  if (owlInfo.exists) {
    console.log('='.repeat(70));
    console.log('STEP 3: Check Which Cards Overlap with Owl');
    console.log('='.repeat(70));

    const overlaps = carouselInfo.cards.map(card => {
      const owlLeft = owlInfo.center.x - owlInfo.boundingBox.width / 2;
      const owlRight = owlInfo.center.x + owlInfo.boundingBox.width / 2;
      const owlTop = owlInfo.center.y - owlInfo.boundingBox.height / 2;
      const owlBottom = owlInfo.center.y + owlInfo.boundingBox.height / 2;

      const cardLeft = card.boundingBox.x;
      const cardRight = card.boundingBox.x + card.boundingBox.width;
      const cardTop = card.boundingBox.y;
      const cardBottom = card.boundingBox.y + card.boundingBox.height;

      const overlapX = Math.max(0, Math.min(cardRight, owlRight) - Math.max(cardLeft, owlLeft));
      const overlapY = Math.max(0, Math.min(cardBottom, owlBottom) - Math.max(cardTop, owlTop));
      const overlapArea = overlapX * overlapY;

      const distance = Math.sqrt(
        Math.pow(card.boundingBox.centerX - owlInfo.center.x, 2) +
        Math.pow(card.boundingBox.centerY - owlInfo.center.y, 2)
      );

      return {
        index: card.index,
        relativeAngle: card.relativeAngle,
        distance: Math.round(distance),
        overlapArea,
        isNearOwl: distance < 200,
        hasGlow: card.hasGlow
      };
    });

    console.log('\nCards near owl (distance < 200px):');
    overlaps
      .filter(o => o.isNearOwl)
      .forEach(o => {
        const glowStatus = o.hasGlow ? '✨ HAS GLOW' : '❌ NO GLOW';
        console.log(`  Card ${o.index}: ${o.relativeAngle}° from center, ${o.distance}px away - ${glowStatus}`);
      });
  }

  console.log('\n' + '='.repeat(70));
  console.log('STEP 4: Test During Rotation');
  console.log('='.repeat(70));

  const carouselContainer = page.locator('.circular-gallery-container').first();
  const containerBox = await carouselContainer.boundingBox();
  const centerX = containerBox.x + containerBox.width / 2;
  const centerY = containerBox.y + containerBox.height / 2;

  console.log('\nRotating carousel...');
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 150, centerY, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const afterRotation = await page.evaluate(() => {
    const track = document.getElementById('galleryTrack');
    const transform = track.style.transform;
    const rotationMatch = transform.match(/rotateY\(([-\d.]+)deg\)/);
    const rotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;

    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const anglePerCard = 360 / cards.length;

    const glowingCards = [];
    cards.forEach((card, index) => {
      const cardAngle = index * anglePerCard;
      let relativeAngle = cardAngle - rotation;
      while (relativeAngle > 180) relativeAngle -= 360;
      while (relativeAngle < -180) relativeAngle += 360;

      const hasGlow = card.style.borderColor?.includes('215, 0');
      if (hasGlow || Math.abs(relativeAngle) <= 45) {
        glowingCards.push({
          index,
          angle: relativeAngle.toFixed(1),
          hasGlow,
          borderColor: card.style.borderColor
        });
      }
    });

    return { rotation: rotation.toFixed(2), glowingCards };
  });

  console.log(`\nNew rotation: ${afterRotation.rotation}°`);
  console.log('Cards that should glow or are glowing:');
  afterRotation.glowingCards.forEach(c => {
    const status = c.hasGlow ? '✨' : '❌';
    console.log(`  ${status} Card ${c.index} (${c.angle}°): ${c.borderColor || 'no border set'}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('DIAGNOSIS');
  console.log('='.repeat(70));

  const glowingCount = carouselInfo.cards.filter(c => c.hasGlow).length;
  const shouldGlowCount = carouselInfo.cards.filter(c => Math.abs(parseFloat(c.relativeAngle)) <= 45).length;

  console.log(`\nCards currently glowing: ${glowingCount}`);
  console.log(`Cards that should glow: ${shouldGlowCount}`);

  if (glowingCount === 0) {
    console.log('\n❌ PROBLEM: No cards are glowing at all');
    console.log('   Possible causes:');
    console.log('   - updateCardOpacity function not being called');
    console.log('   - !important styles not being applied');
    console.log('   - Cache issue - need hard refresh');
  } else if (glowingCount !== shouldGlowCount) {
    console.log('\n⚠️ PROBLEM: Glow count mismatch');
    console.log('   The logic is running but may have incorrect angle calculations');
  } else {
    console.log('\n✅ Glow logic appears correct!');
  }

  console.log('='.repeat(70) + '\n');

  await browser.close();
})();
