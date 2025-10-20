const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Testing YOUR server at localhost:3005\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Modern Timeline') || text.includes('version')) {
      console.log('BROWSER:', text);
    }
  });

  await page.goto('http://localhost:3005/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  const serverCheck = await page.evaluate(() => {
    const scriptTag = document.querySelector('script[src*="modern-timeline.js"]');
    const scriptSrc = scriptTag ? scriptTag.src : 'NOT FOUND';

    const hasDebugLabels = document.querySelector('.debug-angle-label') !== null;
    const cards = Array.from(document.querySelectorAll('.gallery-card'));

    const codeCheck = {
      hasUpdateCardOpacity: typeof updateCardOpacity !== 'undefined',
      functionString: typeof updateCardOpacity !== 'undefined'
        ? updateCardOpacity.toString().substring(0, 800)
        : 'NOT FOUND'
    };

    const track = document.getElementById('galleryTrack');
    const transform = track.style.transform;
    const rotationMatch = transform.match(/rotateY\(([\d.-]+)deg\)/);
    const rotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
    const anglePerCard = 360 / cards.length;

    return {
      scriptSrc,
      hasDebugLabels,
      cardCount: cards.length,
      rotation: rotation.toFixed(2),
      codeCheck,
      cards: cards.map((card, index) => {
        const cardAngle = index * anglePerCard;
        let relativeAngle = cardAngle - rotation;
        while (relativeAngle > 180) relativeAngle -= 360;
        while (relativeAngle < -180) relativeAngle += 360;

        const absAngle = Math.abs(relativeAngle);
        const hasGoldBorder = card.style.borderColor?.includes('215, 0');

        return {
          index,
          title: card.querySelector('h3')?.textContent || 'Unknown',
          angle: relativeAngle.toFixed(1),
          absAngle: absAngle.toFixed(1),
          hasGlow: hasGoldBorder,
          shouldGlow: absAngle <= 90
        };
      })
    };
  });

  console.log('Server Check:');
  console.log('='.repeat(80));
  console.log(`Script source: ${serverCheck.scriptSrc}`);
  console.log(`Has debug angle labels: ${serverCheck.hasDebugLabels ? 'YES ✓' : 'NO ✗'}`);
  console.log(`Rotation: ${serverCheck.rotation}°`);
  console.log(`\nCode check:`);
  console.log(`Has updateCardOpacity function: ${serverCheck.codeCheck.hasUpdateCardOpacity}`);
  console.log(`\nFunction preview:\n${serverCheck.codeCheck.functionString}...`);

  console.log('\n' + '='.repeat(80));
  console.log('Glow Status on localhost:3005:');
  console.log('='.repeat(80));

  serverCheck.cards.forEach(card => {
    const match = card.shouldGlow === card.hasGlow ? '✓' : '✗';
    const glowIcon = card.hasGlow ? '✨' : '  ';
    const expectedIcon = card.shouldGlow ? '🌟' : '  ';

    console.log(`${match} ${expectedIcon}${glowIcon} ${card.title} (${card.angle}°)`);
  });

  const correct = serverCheck.cards.filter(c => c.shouldGlow === c.hasGlow).length;
  console.log(`\nResult: ${correct}/12 cards correct\n`);

  if (correct !== 12) {
    console.log('❌ localhost:3005 has DIFFERENT/OLD code than localhost:8000!');
    console.log('   You need to update the files on port 3005 or switch to port 8000.');
  }

  await browser.close();
})();
