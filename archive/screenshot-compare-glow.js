const { chromium } = require('playwright');

(async () => {
  console.log('Taking screenshot with glow analysis...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // Get glow status
  const glowStatus = await page.evaluate(() => {
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

      const hasGoldBorder = card.style.borderColor?.includes('215, 0');
      const title = card.querySelector('h3')?.textContent || 'Unknown';

      return {
        index,
        title,
        angle: relativeAngle.toFixed(1),
        absAngle: Math.abs(relativeAngle).toFixed(1),
        hasGlow: hasGoldBorder,
        shouldGlow: Math.abs(relativeAngle) <= 90
      };
    });
  });

  console.log('Current Glow Status:');
  console.log('='.repeat(80));
  glowStatus.forEach(card => {
    const match = card.shouldGlow === card.hasGlow ? '✓' : '✗';
    const glowIcon = card.hasGlow ? '✨' : '  ';
    const expectedIcon = card.shouldGlow ? '🌟' : '  ';
    console.log(`${match} ${expectedIcon}${glowIcon} ${card.title} (${card.angle}°)`);
  });

  const correct = glowStatus.filter(c => c.shouldGlow === c.hasGlow).length;
  console.log('\n' + '='.repeat(80));
  console.log(`Correct: ${correct}/12 cards`);
  console.log('='.repeat(80) + '\n');

  // Take screenshot
  await page.screenshot({
    path: 'playwright-glow-screenshot.png',
    fullPage: false
  });
  console.log('Screenshot saved as: playwright-glow-screenshot.png');
  console.log('\nCompare this with your browser screenshot to identify differences.');
  console.log('- If they match: glow logic is correct');
  console.log('- If they differ: browser cache issue\n');

  await browser.close();
})();
