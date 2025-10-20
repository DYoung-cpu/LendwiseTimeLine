const { chromium } = require('playwright');

(async () => {
  console.log('🧭 Testing Carousel Drag Direction\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html');
  await page.waitForTimeout(4500);

  const galleryTrack = page.locator('#galleryTrack').first();
  const carouselContainer = page.locator('.circular-gallery-container').first();

  const containerBox = await carouselContainer.boundingBox();
  const centerX = containerBox.x + containerBox.width / 2;
  const centerY = containerBox.y + containerBox.height / 2;

  // Get initial rotation value
  const getRotationValue = async () => {
    const transform = await galleryTrack.evaluate(el => el.style.transform);
    const match = transform.match(/rotateY\(([-\d.]+)deg\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  console.log('TEST 1: Drag RIGHT → Rotation should INCREASE');
  console.log('='.repeat(50));

  const rotation1 = await getRotationValue();
  console.log(`Before drag right: ${rotation1.toFixed(2)}°`);

  // Drag to the RIGHT (positive X direction)
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 100, centerY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  const rotation2 = await getRotationValue();
  console.log(`After drag right:  ${rotation2.toFixed(2)}°`);

  const change1 = rotation2 - rotation1;
  console.log(`Change: ${change1.toFixed(2)}° (${change1 > 0 ? '✅ INCREASED' : '❌ DECREASED'})`);

  if (change1 > 0) {
    console.log('✅ PASS: Dragging right increases rotation\n');
  } else {
    console.log('❌ FAIL: Dragging right should increase rotation\n');
  }

  console.log('TEST 2: Drag LEFT → Rotation should DECREASE');
  console.log('='.repeat(50));

  await page.waitForTimeout(600); // Let auto-rotation stabilize

  const rotation3 = await getRotationValue();
  console.log(`Before drag left: ${rotation3.toFixed(2)}°`);

  // Drag to the LEFT (negative X direction)
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX - 100, centerY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  const rotation4 = await getRotationValue();
  console.log(`After drag left:  ${rotation4.toFixed(2)}°`);

  const change2 = rotation4 - rotation3;
  console.log(`Change: ${change2.toFixed(2)}° (${change2 < 0 ? '✅ DECREASED' : '❌ INCREASED'})`);

  if (change2 < 0) {
    console.log('✅ PASS: Dragging left decreases rotation\n');
  } else {
    console.log('❌ FAIL: Dragging left should decrease rotation\n');
  }

  console.log('='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));

  if (change1 > 0 && change2 < 0) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('Drag direction is correct:');
    console.log('  • Drag RIGHT → Carousel spins RIGHT');
    console.log('  • Drag LEFT → Carousel spins LEFT');
  } else {
    console.log('❌ TESTS FAILED');
    console.log('Drag direction is incorrect');
  }

  console.log('='.repeat(50) + '\n');

  await browser.close();
})();
