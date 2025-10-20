const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    // Only show AI Underwriting related messages
    if (text.includes('Underwriting') || text.includes('Card 10')) {
      console.log('BROWSER:', text);
    }
  });

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  console.log('Checking all cards for glow status...\n');

  const allCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');
    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterX = owlRect.left + owlRect.width / 2;
    const owlCenterY = owlRect.top + owlRect.height / 2;

    return cards.map((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;

      const distance = Math.sqrt(
        Math.pow(cardCenterX - owlCenterX, 2) +
        Math.pow(cardCenterY - owlCenterY, 2)
      );

      const title = card.querySelector('h3')?.textContent || 'Unknown';
      const zIndex = parseInt(card.style.zIndex);
      const hasGoldBorder = card.style.borderColor?.includes('215, 0');

      return {
        index,
        title,
        distance: Math.round(distance),
        zIndex,
        hasGlow: hasGoldBorder,
        borderColor: card.style.borderColor || 'not set',
        shouldGlow: distance <= 450 && zIndex >= 1000
      };
    });
  });

  console.log('Card Glow Status:');
  console.log('='.repeat(80));

  allCards.forEach(card => {
    const match = card.shouldGlow === card.hasGlow ? '✓' : '✗';
    const glowIcon = card.hasGlow ? '✨' : '  ';
    const expectedIcon = card.shouldGlow ? '🌟' : '  ';

    console.log(`${match} ${expectedIcon}${glowIcon} ${card.title} (Card ${card.index})`);
    console.log(`   Distance: ${card.distance}px | Z-index: ${card.zIndex}`);
    console.log(`   Border: ${card.borderColor}`);

    if (card.shouldGlow && !card.hasGlow) {
      console.log(`   ❌ SHOULD GLOW BUT DOESN'T!`);
    } else if (!card.shouldGlow && card.hasGlow) {
      console.log(`   ⚠️  GLOWING BUT SHOULDN'T!`);
    }
    console.log('');
  });

  const aiCard = allCards.find(c => c.title.includes('Underwriting'));
  if (aiCard) {
    console.log('='.repeat(80));
    console.log('AI UNDERWRITING SPECIFIC ANALYSIS');
    console.log('='.repeat(80));
    console.log(`Distance from owl: ${aiCard.distance}px (threshold: 450px) - ${aiCard.distance <= 450 ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`Z-index: ${aiCard.zIndex} (need >= 1000) - ${aiCard.zIndex >= 1000 ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`Has gold glow: ${aiCard.hasGlow ? 'YES ✨' : 'NO ❌'}`);
    console.log(`Border color: ${aiCard.borderColor}`);

    if (!aiCard.hasGlow && aiCard.shouldGlow) {
      console.log(`\n❌ CRITICAL BUG: AI Underwriting meets ALL conditions but NOT glowing!`);
      console.log(`   This suggests the JavaScript is not being executed properly.`);
      console.log(`   Possible issues:`);
      console.log(`   1. Browser cache - user needs HARD refresh (Ctrl+Shift+F5)`);
      console.log(`   2. JavaScript error preventing glow application`);
      console.log(`   3. CSS override preventing inline styles`);
    }
  }

  await browser.close();
})();
