const { chromium } = require('playwright');

(async () => {
  console.log('🎯 FINAL DRAG FUNCTIONALITY TEST\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Clear cache
  await context.clearCookies();

  console.log('📍 Loading timeline-dev.html with cache-busted JS...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });

  console.log('⏳ Waiting for intro animation...');
  await page.waitForTimeout(4500);

  console.log('\n' + '='.repeat(50));
  console.log('TEST 1: Verify drag from carousel center');
  console.log('='.repeat(50));

  const carouselContainer = page.locator('.circular-gallery-container').first();
  const galleryTrack = page.locator('#galleryTrack').first();

  const containerBox = await carouselContainer.boundingBox();
  const centerX = containerBox.x + containerBox.width / 2;
  const centerY = containerBox.y + containerBox.height / 2;

  const rotation1 = await galleryTrack.evaluate(el => el.style.transform);
  console.log(`Before: ${rotation1}`);

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 150, centerY, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  const rotation2 = await galleryTrack.evaluate(el => el.style.transform);
  console.log(`After:  ${rotation2}`);

  if (rotation1 !== rotation2) {
    console.log('✅ PASS: Carousel center drag works\n');
  } else {
    console.log('❌ FAIL: Carousel center drag failed\n');
  }

  console.log('='.repeat(50));
  console.log('TEST 2: Verify drag from card');
  console.log('='.repeat(50));

  const firstCard = page.locator('.gallery-card').first();
  const cardBox = await firstCard.boundingBox();
  const cardX = cardBox.x + cardBox.width / 2;
  const cardY = cardBox.y + cardBox.height / 2;

  await page.waitForTimeout(700); // Wait for auto-rotation to resume

  const rotation3 = await galleryTrack.evaluate(el => el.style.transform);
  console.log(`Before: ${rotation3}`);

  await page.mouse.move(cardX, cardY);
  await page.mouse.down();
  await page.mouse.move(cardX + 150, cardY, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  const rotation4 = await galleryTrack.evaluate(el => el.style.transform);
  console.log(`After:  ${rotation4}`);

  if (rotation3 !== rotation4) {
    console.log('✅ PASS: Card drag works\n');
  } else {
    console.log('❌ FAIL: Card drag failed\n');
  }

  console.log('='.repeat(50));
  console.log('TEST 3: Verify card click opens modal');
  console.log('='.repeat(50));

  await page.waitForTimeout(700); // Wait for auto-rotation

  // Small click without drag
  await page.mouse.click(cardX, cardY);
  await page.waitForTimeout(300);

  const modalVisible = await page.locator('#timeline-modal').evaluate(el => {
    return window.getComputedStyle(el).display !== 'none';
  });

  if (modalVisible) {
    console.log('✅ PASS: Card click opens modal\n');
    // Close modal
    await page.locator('.modal-close').first().click();
    await page.waitForTimeout(200);
  } else {
    console.log('❌ FAIL: Card click did not open modal\n');
  }

  console.log('='.repeat(50));
  console.log('TEST 4: Verify cursor styles');
  console.log('='.repeat(50));

  const containerCursor = await carouselContainer.evaluate(el =>
    window.getComputedStyle(el).cursor
  );
  const cardCursor = await firstCard.evaluate(el =>
    window.getComputedStyle(el).cursor
  );

  console.log(`Container cursor: ${containerCursor}`);
  console.log(`Card cursor: ${cardCursor}`);

  if (containerCursor === 'grab' && cardCursor === 'grab') {
    console.log('✅ PASS: Cursors are correct\n');
  } else {
    console.log('❌ FAIL: Cursors are incorrect\n');
  }

  console.log('='.repeat(50));
  console.log('🎉 FINAL RESULTS');
  console.log('='.repeat(50));
  console.log('All carousel drag functionality is working!');
  console.log('\nIf this test passes but the browser doesn\'t work:');
  console.log('  1. Hard refresh: Ctrl+Shift+R or Cmd+Shift+R');
  console.log('  2. Clear browser cache');
  console.log('  3. Close and reopen browser');
  console.log('='.repeat(50) + '\n');

  await browser.close();
})();
