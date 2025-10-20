const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);

  console.log('='.repeat(70));
  console.log('ISSUE 1: Google Analytics Card Transparency');
  console.log('='.repeat(70));

  const cardInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const track = document.getElementById('galleryTrack');
    const transform = track.style.transform;
    const rotationMatch = transform.match(/rotateY\(([\d.-]+)deg\)/);
    const rotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
    const anglePerCard = 360 / cards.length;

    return cards.map((card, index) => {
      const cardAngle = index * anglePerCard;
      let relativeAngle = cardAngle - rotation;
      while (relativeAngle > 180) relativeAngle -= 360;
      while (relativeAngle < -180) relativeAngle += 360;

      const computed = window.getComputedStyle(card);
      const isGoogleCard = card.classList.contains('google-card');
      const cardContent = card.querySelector('.card-content');
      const contentOpacity = cardContent ? window.getComputedStyle(cardContent).opacity : 'none';

      return {
        index,
        angle: relativeAngle.toFixed(1),
        isGoogle: isGoogleCard,
        title: card.querySelector('h3')?.textContent || 'unknown',
        cardOpacity: computed.opacity,
        contentOpacity: contentOpacity,
        backgroundColor: computed.backgroundColor,
        allClasses: Array.from(card.classList).join(', ')
      };
    });
  });

  const googleCard = cardInfo.find(c => c.isGoogle);
  const otherCards = cardInfo.filter(c => !c.isGoogle && Math.abs(parseFloat(c.angle)) < 90);

  console.log('\nGoogle Analytics Card:');
  console.log(`  Index: ${googleCard.index}`);
  console.log(`  Angle: ${googleCard.angle}°`);
  console.log(`  Card opacity: ${googleCard.cardOpacity}`);
  console.log(`  Content opacity: ${googleCard.contentOpacity}`);
  console.log(`  Background: ${googleCard.backgroundColor}`);
  console.log(`  Classes: ${googleCard.allClasses}`);

  console.log('\nOther front-facing cards for comparison:');
  otherCards.slice(0, 3).forEach(c => {
    console.log(`  Card ${c.index} (${c.angle}°): opacity ${c.cardOpacity}, content ${c.contentOpacity}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('ISSUE 2: Cards Glowing Behind Owl');
  console.log('='.repeat(70));

  const glowInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const track = document.getElementById('galleryTrack');
    const transform = track.style.transform;
    const rotationMatch = transform.match(/rotateY\(([\d.-]+)deg\)/);
    const rotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
    const anglePerCard = 360 / cards.length;

    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');
    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterX = owlRect.left + owlRect.width / 2;
    const owlCenterY = owlRect.top + owlRect.height / 2;

    return cards.map((card, index) => {
      const cardAngle = index * anglePerCard;
      let relativeAngle = cardAngle - rotation;
      while (relativeAngle > 180) relativeAngle -= 360;
      while (relativeAngle < -180) relativeAngle += 360;

      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;

      const distance = Math.sqrt(
        Math.pow(cardCenterX - owlCenterX, 2) +
        Math.pow(cardCenterY - owlCenterY, 2)
      );

      const hasGlow = card.style.borderColor?.includes('215, 0');
      const isFrontFacing = Math.abs(relativeAngle) <= 90;
      const zIndex = parseInt(window.getComputedStyle(card).zIndex) || 0;

      return {
        index,
        angle: relativeAngle.toFixed(1),
        distance: Math.round(distance),
        isFrontFacing,
        hasGlow,
        zIndex,
        borderColor: card.style.borderColor || 'not set'
      };
    }).filter(c => c.hasGlow);
  });

  console.log('\nCards currently glowing:');
  glowInfo.forEach(c => {
    const position = c.isFrontFacing ? 'FRONT ✓' : 'BACK ✗';
    const issue = !c.isFrontFacing ? ' <-- SHOULD NOT GLOW' : '';
    console.log(`  Card ${c.index} (${c.angle}°): ${position}, ${c.distance}px, z=${c.zIndex}${issue}`);
  });

  const backGlowing = glowInfo.filter(c => !c.isFrontFacing).length;
  if (backGlowing > 0) {
    console.log(`\n❌ Problem: ${backGlowing} card(s) glowing from behind!`);
  } else {
    console.log('\n✓ All glowing cards are front-facing');
  }

  console.log('\n' + '='.repeat(70));

  await browser.close();
})();
