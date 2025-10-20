const { chromium } = require('playwright');

(async () => {
  console.log('🔍 AUDITING CARD GLOW BEHAVIOR\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html');
  console.log('✓ Page loaded\n');

  await page.waitForTimeout(4500);

  const cards = page.locator('.gallery-card');
  const cardCount = await cards.count();

  console.log(`Found ${cardCount} cards\n`);

  console.log('='.repeat(60));
  console.log('CHECKING CARD STYLES AND GLOW');
  console.log('='.repeat(60));

  // Check each card's current styling
  for (let i = 0; i < Math.min(cardCount, 5); i++) {
    const card = cards.nth(i);
    const cardStyles = await card.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        border: computed.border,
        borderColor: computed.borderColor,
        boxShadow: computed.boxShadow,
        opacity: computed.opacity,
        transform: el.style.transform,
        classes: el.className
      };
    });

    console.log(`\nCard ${i}:`);
    console.log(`  Classes: ${cardStyles.classes}`);
    console.log(`  Border: ${cardStyles.border}`);
    console.log(`  Border Color: ${cardStyles.borderColor}`);
    console.log(`  Box Shadow: ${cardStyles.boxShadow.substring(0, 80)}...`);
    console.log(`  Opacity: ${cardStyles.opacity}`);
    console.log(`  Transform: ${cardStyles.transform}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('CHECKING HOVER/ACTIVE STATES IN CSS');
  console.log('='.repeat(60));

  const cssCheck = await page.evaluate(() => {
    const styleSheets = Array.from(document.styleSheets);
    const goldGlowRules = [];
    const cardRules = [];

    styleSheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => {
          const cssText = rule.cssText;
          if (cssText.includes('gallery-card') && (
              cssText.includes('hover') ||
              cssText.includes('gold') ||
              cssText.includes('glow') ||
              cssText.includes('box-shadow')
          )) {
            if (cssText.includes('gold') || cssText.includes('ffd700')) {
              goldGlowRules.push(cssText.substring(0, 150));
            } else {
              cardRules.push(cssText.substring(0, 150));
            }
          }
        });
      } catch (e) {
        // CORS or other access issues
      }
    });

    return { goldGlowRules, cardRules };
  });

  if (cssCheck.goldGlowRules.length > 0) {
    console.log('\nFound GOLD GLOW rules:');
    cssCheck.goldGlowRules.forEach(rule => console.log(`  ${rule}...`));
  } else {
    console.log('\n⚠ No gold glow CSS rules found');
  }

  if (cssCheck.cardRules.length > 0) {
    console.log('\nFound CARD hover/shadow rules:');
    cssCheck.cardRules.slice(0, 3).forEach(rule => console.log(`  ${rule}...`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('TESTING CARD ROTATION POSITIONS');
  console.log('='.repeat(60));

  const galleryTrack = page.locator('#galleryTrack').first();

  // Get current rotation
  const getCurrentRotation = async () => {
    return await galleryTrack.evaluate(el => {
      const transform = el.style.transform;
      const match = transform.match(/rotateY\(([-\d.]+)deg\)/);
      return match ? parseFloat(match[1]) : 0;
    });
  };

  const currentRotation = await getCurrentRotation();
  console.log(`\nCurrent gallery rotation: ${currentRotation.toFixed(2)}°`);

  // Check which cards should be highlighted based on position
  const cardPositions = await page.evaluate((rotation) => {
    const cards = document.querySelectorAll('.gallery-card');
    const positions = [];
    const anglePerCard = 360 / cards.length;

    cards.forEach((card, index) => {
      const cardAngle = index * anglePerCard;
      let relativeAngle = cardAngle - rotation;

      // Normalize to -180 to 180
      while (relativeAngle > 180) relativeAngle -= 360;
      while (relativeAngle < -180) relativeAngle += 360;

      const absAngle = Math.abs(relativeAngle);
      const isFacingViewer = absAngle <= 45; // Within 45 degrees of front

      positions.push({
        index,
        cardAngle: cardAngle.toFixed(1),
        relativeAngle: relativeAngle.toFixed(1),
        absAngle: absAngle.toFixed(1),
        isFacingViewer,
        shouldGlow: absAngle <= 30 // Cards within 30 degrees should glow
      });
    });

    return positions;
  }, currentRotation);

  console.log('\nCard positions relative to viewer (owl):');
  cardPositions.forEach(pos => {
    const marker = pos.shouldGlow ? '✨' : '  ';
    console.log(`  ${marker} Card ${pos.index}: angle=${pos.relativeAngle}° (facing=${pos.isFacingViewer})`);
  });

  const shouldGlowCount = cardPositions.filter(p => p.shouldGlow).length;
  console.log(`\n${shouldGlowCount} cards should have gold glow based on position`);

  console.log('\n' + '='.repeat(60));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(60));
  console.log('1. Add proximity-based glow calculation in JavaScript');
  console.log('2. Update card styles based on angle from viewer');
  console.log('3. Apply gold glow when card is within ~30° of front');
  console.log('4. Fade glow intensity based on distance from center');
  console.log('='.repeat(60) + '\n');

  await browser.close();
})();
