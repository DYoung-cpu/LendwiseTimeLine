const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);

  const licensingCheck = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const licensingCard = cards.find(c => c.querySelector('h3')?.textContent === 'Licensing');

    if (!licensingCard) return { error: 'Licensing card not found' };

    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');
    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterX = owlRect.left + owlRect.width / 2;
    const owlCenterY = owlRect.top + owlRect.height / 2;

    const cardRect = licensingCard.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;

    const distance = Math.sqrt(
      Math.pow(cardCenterX - owlCenterX, 2) +
      Math.pow(cardCenterY - owlCenterY, 2)
    );

    const zIndex = parseInt(licensingCard.style.zIndex);
    const normalizedDistance = distance / 450;
    const calculatedGlow = 1 - Math.pow(normalizedDistance, 2);

    return {
      distance: Math.round(distance),
      zIndex,
      borderColor: licensingCard.style.borderColor || 'not set',
      boxShadow: licensingCard.style.boxShadow || 'not set',
      hasGoldBorder: licensingCard.style.borderColor?.includes('215, 0'),
      normalizedDistance: normalizedDistance.toFixed(3),
      calculatedGlow: calculatedGlow.toFixed(3),
      glowPercent: (calculatedGlow * 100).toFixed(1)
    };
  });

  if (licensingCheck.error) {
    console.log(licensingCheck.error);
  } else {
    console.log('\n='.repeat(70));
    console.log('LICENSING CARD GLOW ANALYSIS');
    console.log('='.repeat(70));
    console.log(`Distance from owl: ${licensingCheck.distance}px (threshold: 450px)`);
    console.log(`Z-index: ${licensingCheck.zIndex} (need >= 1000 to glow)`);
    console.log(`\nGlow calculation:`);
    console.log(`  Normalized distance: ${licensingCheck.normalizedDistance} (distance/450)`);
    console.log(`  Calculated glow: ${licensingCheck.calculatedGlow} = ${licensingCheck.glowPercent}%`);
    console.log(`\nActual styles:`);
    console.log(`  Has gold border: ${licensingCheck.hasGoldBorder ? 'YES ✨' : 'NO ❌'}`);
    console.log(`  Border color: ${licensingCheck.borderColor}`);
    console.log(`  Box shadow: ${licensingCheck.boxShadow.substring(0, 60)}...`);

    if (licensingCheck.hasGoldBorder) {
      const glowPct = parseFloat(licensingCheck.glowPercent);
      if (glowPct < 20) {
        console.log(`\n⚠️  WARNING: Glow is only ${licensingCheck.glowPercent}% - TOO FAINT TO SEE!`);
        console.log(`   At ${licensingCheck.distance}px distance, the glow is barely visible.`);
        console.log(`\n   SOLUTION OPTIONS:`);
        console.log(`   1. Use more aggressive curve (cubic instead of quadratic)`);
        console.log(`   2. Add minimum glow threshold (e.g., 30% minimum)`);
        console.log(`   3. Use linear gradient instead of exponential`);
      } else {
        console.log(`\n✓ Glow intensity ${licensingCheck.glowPercent}% should be visible`);
      }
    } else {
      console.log(`\n❌ NO GLOW APPLIED - Card not meeting glow conditions`);
    }
  }

  console.log('='.repeat(70) + '\n');

  await browser.close();
})();
