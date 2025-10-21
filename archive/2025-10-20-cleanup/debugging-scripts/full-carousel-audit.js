const { chromium } = require('playwright');

(async () => {
  console.log('🔍 FULL CAROUSEL AUDIT - Angle vs Glow Status\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  const auditResults = await page.evaluate(() => {
    const track = document.getElementById('galleryTrack');
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');

    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterX = owlRect.left + owlRect.width / 2;
    const owlCenterY = owlRect.top + owlRect.height / 2;

    const transform = track.style.transform;
    const rotationMatch = transform.match(/rotateY\(([\d.-]+)deg\)/);
    const currentRotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
    const anglePerCard = 360 / cards.length;

    return {
      rotation: currentRotation.toFixed(2),
      anglePerCard: anglePerCard.toFixed(1),
      cards: cards.map((card, index) => {
        const cardAngle = index * anglePerCard;
        let relativeAngle = cardAngle - currentRotation;
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
        const debugLabel = card.querySelector('.debug-angle-label')?.textContent || 'NO LABEL';

        return {
          index,
          title: card.querySelector('h3')?.textContent || 'Unknown',
          calculatedAngle: relativeAngle.toFixed(1),
          absAngle: absAngle.toFixed(1),
          debugLabelAngle: debugLabel,
          distance: Math.round(distance),
          hasGlow: hasGoldBorder,
          shouldGlow: absAngle <= 90 && distance <= 450,
          borderColor: card.style.borderColor || 'not set'
        };
      })
    };
  });

  console.log(`Carousel rotation: ${auditResults.rotation}°`);
  console.log(`Angle per card: ${auditResults.anglePerCard}°\n`);

  console.log('='.repeat(90));
  console.log('CARD AUDIT - Calculated Angle vs Debug Label vs Glow Status');
  console.log('='.repeat(90));

  auditResults.cards.forEach(card => {
    const match = card.shouldGlow === card.hasGlow ? '✓' : '✗';
    const glowIcon = card.hasGlow ? '✨' : '  ';
    const expectedIcon = card.shouldGlow ? '🌟' : '  ';

    const angleMismatch = card.calculatedAngle !== card.debugLabelAngle ? '⚠️' : '  ';

    console.log(`${match} ${expectedIcon}${glowIcon} Card ${card.index}: ${card.title}`);
    console.log(`   ${angleMismatch} Calculated: ${card.calculatedAngle}° | Debug Label: ${card.debugLabelAngle} | Abs: ${card.absAngle}°`);
    console.log(`   Distance: ${card.distance}px | Should glow: ${card.shouldGlow} | Has glow: ${card.hasGlow}`);
    console.log(`   Border: ${card.borderColor}`);

    if (card.calculatedAngle !== card.debugLabelAngle) {
      console.log(`   ❌ ANGLE MISMATCH! Calculated angle doesn't match debug label!`);
    }

    if (!match) {
      if (card.shouldGlow && !card.hasGlow) {
        console.log(`   ❌ SHOULD GLOW BUT DOESN'T`);
      } else {
        console.log(`   ❌ SHOULDN'T GLOW BUT DOES (angle ${card.absAngle}° > 90°)`);
      }
    }
    console.log('');
  });

  const correct = auditResults.cards.filter(c => c.shouldGlow === c.hasGlow).length;
  const angleMismatches = auditResults.cards.filter(c => c.calculatedAngle !== c.debugLabelAngle).length;

  console.log('='.repeat(90));
  console.log('SUMMARY');
  console.log('='.repeat(90));
  console.log(`Glow logic: ${correct}/12 cards correct`);
  console.log(`Angle mismatches: ${angleMismatches}/12 cards`);

  if (angleMismatches > 0) {
    console.log('\n❌ CRITICAL: Debug labels showing different angles than calculated!');
    console.log('   This means the angle being DISPLAYED is different from the angle being USED for glow.');
    console.log('   Possible issue: updateCardOpacity being called with wrong angle value.');
  }

  console.log('='.repeat(90) + '\n');

  await browser.close();
})();
