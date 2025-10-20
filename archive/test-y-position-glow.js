const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Glow:') || text.includes('No glow:')) {
      console.log(text);
    }
  });

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  const yPositionCheck = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');
    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterY = owlRect.top + owlRect.height / 2;
    const owlCenterX = owlRect.left + owlRect.width / 2;

    return cards.map((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const cardCenterX = cardRect.left + cardRect.width / 2;

      const distance = Math.sqrt(
        Math.pow(cardCenterX - owlCenterX, 2) +
        Math.pow(cardCenterY - owlCenterY, 2)
      );

      const isVisuallyInFront = cardCenterY < owlCenterY;
      const hasGoldBorder = card.style.borderColor?.includes('215, 0');

      return {
        index,
        title: card.querySelector('h3')?.textContent || 'Unknown',
        cardY: Math.round(cardCenterY),
        owlY: Math.round(owlCenterY),
        isAboveOwl: isVisuallyInFront,
        distance: Math.round(distance),
        shouldGlow: distance <= 450 && isVisuallyInFront,
        hasGlow: hasGoldBorder,
        borderColor: card.style.borderColor || 'not set'
      };
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log('Y-POSITION GLOW TEST');
  console.log('='.repeat(80));
  console.log(`Owl center Y: ${yPositionCheck[0].owlY}px\n`);

  yPositionCheck.forEach(card => {
    const match = card.shouldGlow === card.hasGlow ? '✓' : '✗';
    const glowIcon = card.hasGlow ? '✨' : '  ';
    const expectedIcon = card.shouldGlow ? '🌟' : '  ';
    const position = card.isAboveOwl ? 'ABOVE' : 'BELOW';

    console.log(`${match} ${expectedIcon}${glowIcon} ${card.title}`);
    console.log(`   Y: ${card.cardY}px (owl: ${card.owlY}px) - ${position}`);
    console.log(`   Distance: ${card.distance}px | Should glow: ${card.shouldGlow}`);
    console.log(`   Border: ${card.borderColor}`);

    if (!match) {
      console.log(`   ❌ MISMATCH!`);
    }
    console.log('');
  });

  const correct = yPositionCheck.filter(c => c.shouldGlow === c.hasGlow).length;
  console.log('='.repeat(80));
  console.log(`Result: ${correct}/${yPositionCheck.length} cards correct`);
  console.log('='.repeat(80));

  await browser.close();
})();
