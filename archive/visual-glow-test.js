const { chromium } = require('playwright');

(async () => {
  console.log('🎥 VISUAL GLOW TEST - Opening Chromium Browser\n');

  // HEADLESS: TRUE for now to get output faster
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  console.log('Loading http://localhost:3005/timeline-dev.html...\n');
  await page.goto('http://localhost:3005/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // Get current state
  const state = await page.evaluate(() => {
    const track = document.getElementById('galleryTrack');
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
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

        const hasGoldBorder = card.style.borderColor?.includes('215, 0');
        const computedBorder = window.getComputedStyle(card).borderColor;

        return {
          index,
          title: card.querySelector('h3')?.textContent || 'Unknown',
          angle: relativeAngle.toFixed(1),
          absAngle: absAngle.toFixed(1),
          shouldGlow: absAngle <= 90,
          hasGlow: hasGoldBorder,
          inlineBorder: card.style.borderColor || 'not set',
          computedBorder: computedBorder,
          boundingBox: card.getBoundingClientRect()
        };
      })
    };
  });

  console.log(`Carousel rotation: ${state.rotation}°\n`);
  console.log('Card Analysis:');
  console.log('='.repeat(90));

  state.cards.forEach(card => {
    const match = card.shouldGlow === card.hasGlow ? '✓' : '✗';
    const glowIcon = card.hasGlow ? '✨' : '  ';
    const expectedIcon = card.shouldGlow ? '🌟' : '  ';

    console.log(`${match} ${expectedIcon}${glowIcon} ${card.title} (${card.angle}°)`);
    console.log(`   Should glow: ${card.shouldGlow} | Has glow: ${card.hasGlow}`);
    console.log(`   Inline border: ${card.inlineBorder}`);
    console.log(`   Computed border: ${card.computedBorder}`);

    if (!match) {
      if (card.shouldGlow && !card.hasGlow) {
        console.log(`   ❌ ERROR: Should glow but doesn't!`);
      } else {
        console.log(`   ❌ ERROR: Shouldn't glow (${card.absAngle}° > 90°) but does!`);
      }
    }
    console.log('');
  });

  const wrong = state.cards.filter(c => c.shouldGlow !== c.hasGlow);
  console.log('='.repeat(90));
  console.log(`Result: ${12 - wrong.length}/12 cards correct`);
  if (wrong.length > 0) {
    console.log(`\n❌ ${wrong.length} card(s) have WRONG glow status!`);
  }
  console.log('='.repeat(90) + '\n');

  // Draw visual annotations on the page
  await page.evaluate((wrongCards) => {
    wrongCards.forEach(cardData => {
      const card = document.querySelectorAll('.gallery-card')[cardData.index];
      const rect = card.getBoundingClientRect();

      // Create red border overlay for cards that are wrong
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 4px solid red;
        pointer-events: none;
        z-index: 99999;
        box-sizing: border-box;
      `;

      // Add label
      const label = document.createElement('div');
      label.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top - 30}px;
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        z-index: 100000;
        border-radius: 4px;
      `;
      label.textContent = `WRONG: ${cardData.angle}° ${cardData.shouldGlow ? 'should glow' : 'should NOT glow'}`;

      document.body.appendChild(overlay);
      document.body.appendChild(label);
    });
  }, wrong);

  console.log('Taking screenshot with annotations...\n');
  await page.screenshot({
    path: 'playwright-visual-comparison.png',
    fullPage: false
  });

  console.log('Screenshot saved: playwright-visual-comparison.png');
  console.log('Cards with wrong glow are marked with RED borders\n');

  await browser.close();
})();
