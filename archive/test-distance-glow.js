const { chromium } = require('playwright');

(async () => {
  console.log('✨ TESTING DISTANCE-BASED GLOW\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);

  console.log('='.repeat(70));
  console.log('Checking Distance-Based Glow Logic');
  console.log('='.repeat(70));

  const glowInfo = await page.evaluate(() => {
    // Get owl position
    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');

    if (!owlElement) return { error: 'Owl not found' };

    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterX = owlRect.left + owlRect.width / 2;
    const owlCenterY = owlRect.top + owlRect.height / 2;

    // Check each card's distance and glow status
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const glowDistanceThreshold = 250;

    const cardInfo = cards.map((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;

      const distance = Math.sqrt(
        Math.pow(cardCenterX - owlCenterX, 2) +
        Math.pow(cardCenterY - owlCenterY, 2)
      );

      const shouldGlow = distance <= glowDistanceThreshold;
      const hasGoldBorder = card.style.borderColor?.includes('215, 0');

      return {
        index,
        distance: Math.round(distance),
        position: { x: Math.round(cardCenterX), y: Math.round(cardCenterY) },
        shouldGlow,
        hasGlow: hasGoldBorder,
        borderColor: card.style.borderColor || 'not set'
      };
    });

    return {
      owlCenter: { x: Math.round(owlCenterX), y: Math.round(owlCenterY) },
      threshold: glowDistanceThreshold,
      cards: cardInfo
    };
  });

  if (glowInfo.error) {
    console.log(`❌ ${glowInfo.error}`);
    await browser.close();
    return;
  }

  console.log(`\nOwl center: (${glowInfo.owlCenter.x}, ${glowInfo.owlCenter.y})`);
  console.log(`Glow distance threshold: ${glowInfo.threshold}px\n`);

  console.log('Card Distance Analysis:');
  console.log('-'.repeat(70));

  glowInfo.cards.forEach(card => {
    const statusIcon = card.shouldGlow ? '🌟' : '  ';
    const glowIcon = card.hasGlow ? '✨' : '❌';
    const match = card.shouldGlow === card.hasGlow ? '✓' : '✗';

    console.log(`${match} ${statusIcon} Card ${card.index}: ${card.distance}px from owl - ${glowIcon}`);
    console.log(`    Position: (${card.position.x}, ${card.position.y})`);
    console.log(`    Border: ${card.borderColor}\n`);
  });

  // Count matches
  const correctGlow = glowInfo.cards.filter(c => c.shouldGlow === c.hasGlow).length;
  const totalCards = glowInfo.cards.length;

  console.log('='.repeat(70));
  console.log('RESULTS');
  console.log('='.repeat(70));
  console.log(`\nCorrect glow status: ${correctGlow}/${totalCards} cards`);

  if (correctGlow === totalCards) {
    console.log('✅ All cards have correct glow based on distance!');
  } else {
    console.log('❌ Some cards have incorrect glow status');
    const incorrect = glowInfo.cards.filter(c => c.shouldGlow !== c.hasGlow);
    console.log('\nIncorrect cards:');
    incorrect.forEach(c => {
      console.log(`  Card ${c.index}: ${c.distance}px - Should ${c.shouldGlow ? 'glow' : 'not glow'}, but ${c.hasGlow ? 'glows' : "doesn't glow"}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('Testing During Rotation');
  console.log('='.repeat(70));

  // Rotate carousel and check again
  const carouselContainer = page.locator('.circular-gallery-container').first();
  const box = await carouselContainer.boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 200, centerY, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  const afterRotation = await page.evaluate(() => {
    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');
    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterX = owlRect.left + owlRect.width / 2;
    const owlCenterY = owlRect.top + owlRect.height / 2;

    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const glowingCards = [];

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;

      const distance = Math.sqrt(
        Math.pow(cardCenterX - owlCenterX, 2) +
        Math.pow(cardCenterY - owlCenterY, 2)
      );

      const hasGlow = card.style.borderColor?.includes('215, 0');

      if (hasGlow || distance <= 250) {
        glowingCards.push({
          index,
          distance: Math.round(distance),
          hasGlow,
          borderColor: card.style.borderColor
        });
      }
    });

    return glowingCards;
  });

  console.log('\nCards near owl or glowing after rotation:');
  afterRotation.forEach(c => {
    const icon = c.hasGlow ? '✨' : '❌';
    console.log(`  ${icon} Card ${c.index}: ${c.distance}px - ${c.borderColor || 'no border'}`);
  });

  console.log('\n' + '='.repeat(70) + '\n');

  await browser.close();
})();
