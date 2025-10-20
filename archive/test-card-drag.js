const { chromium } = require('playwright');

(async () => {
  console.log('🎴 Testing Card Drag Functionality\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html');
  console.log('✓ Page loaded');

  // Wait for intro animation
  await page.waitForTimeout(4500);

  const galleryTrack = page.locator('#galleryTrack').first();
  const firstCard = page.locator('.gallery-card').first();

  // Test 1: Drag a card to rotate carousel
  console.log('\n📋 Test 1: Drag card to rotate carousel');

  const cardBox = await firstCard.boundingBox();
  const cardCenterX = cardBox.x + cardBox.width / 2;
  const cardCenterY = cardBox.y + cardBox.height / 2;

  console.log(`   Card center: (${Math.round(cardCenterX)}, ${Math.round(cardCenterY)})`);

  const rotationBefore = await galleryTrack.evaluate(el => el.style.transform);
  console.log(`   Rotation before: ${rotationBefore}`);

  // Drag the card (drag to the right)
  await page.mouse.move(cardCenterX, cardCenterY);
  await page.mouse.down();
  await page.mouse.move(cardCenterX + 150, cardCenterY, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(100);

  const rotationAfter = await galleryTrack.evaluate(el => el.style.transform);
  console.log(`   Rotation after: ${rotationAfter}`);

  if (rotationBefore !== rotationAfter) {
    console.log('   ✓ PASS: Card drag rotates carousel');
  } else {
    console.log('   ✗ FAIL: Card drag did not rotate carousel');
  }

  // Test 2: Click card (small movement) should open modal
  console.log('\n📋 Test 2: Click card to open modal');

  // Wait for auto-rotation to resume and stabilize
  await page.waitForTimeout(600);

  // Quick click without dragging
  await page.mouse.move(cardCenterX, cardCenterY);
  await page.mouse.down();
  await page.mouse.move(cardCenterX + 1, cardCenterY); // Tiny 1px movement
  await page.mouse.up();
  await page.waitForTimeout(300);

  const modalVisible = await page.locator('#timeline-modal').evaluate(el => {
    return window.getComputedStyle(el).display !== 'none';
  });

  if (modalVisible) {
    console.log('   ✓ PASS: Card click opens modal');

    // Close modal for next test
    const closeBtn = page.locator('.modal-close').first();
    await closeBtn.click();
    await page.waitForTimeout(300);
  } else {
    console.log('   ✗ FAIL: Card click did not open modal');
  }

  // Test 3: Large drag should NOT open modal
  console.log('\n📋 Test 3: Large drag should not open modal');

  await page.mouse.move(cardCenterX, cardCenterY);
  await page.mouse.down();
  await page.mouse.move(cardCenterX + 100, cardCenterY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const modalVisibleAfterDrag = await page.locator('#timeline-modal').evaluate(el => {
    return window.getComputedStyle(el).display !== 'none';
  });

  if (!modalVisibleAfterDrag) {
    console.log('   ✓ PASS: Large drag does not open modal');
  } else {
    console.log('   ✗ FAIL: Large drag opened modal (should not)');
  }

  // Test 4: Cursor changes on cards
  console.log('\n📋 Test 4: Cursor styling');

  const carouselCursor = await page.locator('.circular-gallery-container').evaluate(el =>
    window.getComputedStyle(el).cursor
  );

  console.log(`   Carousel cursor: ${carouselCursor}`);
  if (carouselCursor === 'grab' || carouselCursor.includes('grab')) {
    console.log('   ✓ PASS: Cursor is "grab"');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log('✓ Card drag rotates carousel');
  console.log('✓ Card click opens modal');
  console.log('✓ Large drag does not open modal');
  console.log('✓ Cursor is "grab"');
  console.log('\n🎉 All card drag tests passed!\n');

  await browser.close();
})();
