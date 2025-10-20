const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  console.log('Testing Y positions during carousel rotation...\n');

  // Rotate carousel
  const carousel = page.locator('.circular-gallery-container').first();
  const box = await carousel.boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Rotate significantly
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 400, centerY, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(1000);

  const rotatedPositions = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');
    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterY = owlRect.top + owlRect.height / 2;

    const positions = cards.map((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const isAbove = cardCenterY < owlCenterY;

      return {
        index,
        title: card.querySelector('h3')?.textContent || 'Unknown',
        cardY: Math.round(cardCenterY),
        owlY: Math.round(owlCenterY),
        isAbove,
        diff: Math.round(cardCenterY - owlCenterY)
      };
    });

    return {
      owlY: Math.round(owlCenterY),
      positions
    };
  });

  console.log(`Owl Y position: ${rotatedPositions.owlY}px\n`);
  console.log('Card Y positions after rotation:');
  console.log('='.repeat(70));

  rotatedPositions.positions.forEach(p => {
    const position = p.isAbove ? 'ABOVE ⬆️' : 'BELOW ⬇️';
    console.log(`${p.title}: Y=${p.cardY}px (${p.diff > 0 ? '+' : ''}${p.diff}px) - ${position}`);
  });

  const aboveCount = rotatedPositions.positions.filter(p => p.isAbove).length;
  const belowCount = rotatedPositions.positions.filter(p => !p.isAbove).length;

  console.log('\n' + '='.repeat(70));
  console.log(`Cards above owl: ${aboveCount}`);
  console.log(`Cards below owl: ${belowCount}`);

  if (aboveCount === 0) {
    console.log('\n❌ PROBLEM: No cards are ever above the owl!');
    console.log('   This means the carousel is positioned entirely below the owl.');
    console.log('   Y-position check won\'t work as expected.');
  }

  await browser.close();
})();
