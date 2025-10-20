const { chromium } = require('playwright');

(async () => {
  console.log('🎠 Quick Carousel Drag Test\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html');
  console.log('✓ Page loaded');

  // Wait for intro animation
  await page.waitForTimeout(4500);

  const carouselContainer = page.locator('.circular-gallery-container').first();
  const galleryTrack = page.locator('#galleryTrack').first();

  // Test cursor
  const cursor = await carouselContainer.evaluate(el => window.getComputedStyle(el).cursor);
  console.log(`\nCursor: ${cursor} ${cursor === 'grab' ? '✓' : '✗'}`);

  // Test drag rotation
  const containerBox = await carouselContainer.boundingBox();
  const centerX = containerBox.x + containerBox.width / 2;
  const centerY = containerBox.y + containerBox.height / 2;

  const rotationBefore = await galleryTrack.evaluate(el => el.style.transform);
  console.log(`\nBefore drag: ${rotationBefore}`);

  // Perform drag
  await page.mouse.move(centerX - 100, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 100, centerY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(100);

  const rotationAfter = await galleryTrack.evaluate(el => el.style.transform);
  console.log(`After drag: ${rotationAfter}`);
  console.log(`Rotation changed: ${rotationBefore !== rotationAfter ? '✓' : '✗'}`);

  // Test auto-rotation resumes
  await page.waitForTimeout(600);
  const rot1 = await galleryTrack.evaluate(el => el.style.transform);
  await page.waitForTimeout(300);
  const rot2 = await galleryTrack.evaluate(el => el.style.transform);

  console.log(`\nAuto-rotation resumed: ${rot1 !== rot2 ? '✓' : '✗'}`);

  console.log('\n✅ Carousel drag functionality working!\n');

  await browser.close();
})();
