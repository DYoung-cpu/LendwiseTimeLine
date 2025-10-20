const { chromium } = require('playwright');

(async () => {
  console.log('Testing card interaction...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html');
  await page.waitForTimeout(4500);

  const firstCard = page.locator('.gallery-card').first();
  const cardBox = await firstCard.boundingBox();
  const centerX = cardBox.x + cardBox.width / 2;
  const centerY = cardBox.y + cardBox.height / 2;

  console.log('1. Testing DRAG (should rotate, not open modal)');
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 100, centerY, { steps: 10 });
  await page.mouse.up();
  console.log('   Drag complete. Check if carousel rotated.\n');
  await page.waitForTimeout(2000);

  console.log('2. Testing CLICK (should open modal)');
  await page.mouse.click(centerX, centerY);
  console.log('   Click complete. Check if modal opened.\n');
  await page.waitForTimeout(3000);

  console.log('Done! Browser will close in 3 seconds...');
  await page.waitForTimeout(3000);
  await browser.close();
})();
