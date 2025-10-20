const { chromium } = require('playwright');

(async () => {
  console.log('🔍 COMPREHENSIVE CAROUSEL DRAG AUDIT\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Enable console logging from page
  page.on('console', msg => {
    console.log('   [Browser Console]:', msg.text());
  });

  await page.goto('http://localhost:8000/timeline-dev.html');
  console.log('✓ Page loaded\n');

  // Wait for intro
  console.log('⏳ Waiting for intro animation (4.5s)...\n');
  await page.waitForTimeout(4500);

  console.log('='.repeat(60));
  console.log('STEP 1: Check if carousel elements exist');
  console.log('='.repeat(60));

  const carouselContainer = page.locator('.circular-gallery-container').first();
  const galleryTrack = page.locator('#galleryTrack').first();
  const cards = page.locator('.gallery-card');

  const containerExists = await carouselContainer.count() > 0;
  const trackExists = await galleryTrack.count() > 0;
  const cardCount = await cards.count();

  console.log(`Carousel container exists: ${containerExists ? '✓' : '✗'}`);
  console.log(`Gallery track exists: ${trackExists ? '✓' : '✗'}`);
  console.log(`Number of cards: ${cardCount}\n`);

  console.log('='.repeat(60));
  console.log('STEP 2: Check cursor styling');
  console.log('='.repeat(60));

  const containerCursor = await carouselContainer.evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      cursor: computed.cursor,
      display: computed.display,
      pointerEvents: computed.pointerEvents,
      zIndex: computed.zIndex
    };
  });

  console.log('Carousel container styles:');
  console.log(`  cursor: ${containerCursor.cursor}`);
  console.log(`  display: ${containerCursor.display}`);
  console.log(`  pointer-events: ${containerCursor.pointerEvents}`);
  console.log(`  z-index: ${containerCursor.zIndex}\n`);

  if (cardCount > 0) {
    const firstCardCursor = await cards.first().evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        cursor: computed.cursor,
        pointerEvents: computed.pointerEvents,
        zIndex: computed.zIndex
      };
    });

    console.log('First card styles:');
    console.log(`  cursor: ${firstCardCursor.cursor}`);
    console.log(`  pointer-events: ${firstCardCursor.pointerEvents}`);
    console.log(`  z-index: ${firstCardCursor.zIndex}\n`);
  }

  console.log('='.repeat(60));
  console.log('STEP 3: Check if JavaScript is loaded');
  console.log('='.repeat(60));

  const jsCheck = await page.evaluate(() => {
    return {
      galleryConfigExists: typeof galleryConfig !== 'undefined',
      setupMouseDragExists: typeof setupMouseDragRotation !== 'undefined',
      initializeCarouselExists: typeof initializeCarouselGallery !== 'undefined',
      galleryConfigValue: typeof galleryConfig !== 'undefined' ? JSON.stringify(galleryConfig) : 'N/A'
    };
  });

  console.log(`galleryConfig defined: ${jsCheck.galleryConfigExists ? '✓' : '✗'}`);
  console.log(`setupMouseDragRotation defined: ${jsCheck.setupMouseDragExists ? '✓' : '✗'}`);
  console.log(`initializeCarouselGallery defined: ${jsCheck.initializeCarouselExists ? '✓' : '✗'}`);
  if (jsCheck.galleryConfigExists) {
    console.log(`galleryConfig: ${jsCheck.galleryConfigValue}\n`);
  }

  console.log('='.repeat(60));
  console.log('STEP 4: Check event listeners');
  console.log('='.repeat(60));

  const listenerCheck = await page.evaluate(() => {
    const container = document.querySelector('.circular-gallery-container');
    if (!container) return { error: 'Container not found' };

    // Try to see if we can detect listeners (limited in browsers)
    return {
      containerHtml: container.outerHTML.substring(0, 200),
      containerTagName: container.tagName,
      containerClass: container.className,
      hasMouseDown: 'onmousedown' in container,
      eventListenersNote: 'Cannot directly inspect addEventListener listeners in browser'
    };
  });

  console.log('Container element check:');
  console.log(`  Tag: ${listenerCheck.containerTagName}`);
  console.log(`  Classes: ${listenerCheck.containerClass}`);
  console.log(`  Has mousedown property: ${listenerCheck.hasMouseDown}`);
  console.log(`  Note: ${listenerCheck.eventListenersNote}\n`);

  console.log('='.repeat(60));
  console.log('STEP 5: Test actual drag interaction');
  console.log('='.repeat(60));

  const containerBox = await carouselContainer.boundingBox();
  if (!containerBox) {
    console.log('✗ FAIL: Could not get container bounding box\n');
  } else {
    const centerX = containerBox.x + containerBox.width / 2;
    const centerY = containerBox.y + containerBox.height / 2;

    console.log(`Container center: (${Math.round(centerX)}, ${Math.round(centerY)})`);
    console.log(`Container size: ${Math.round(containerBox.width)}x${Math.round(containerBox.height)}\n`);

    // Get initial rotation
    const rotationBefore = await galleryTrack.evaluate(el => el.style.transform);
    console.log(`Rotation BEFORE drag: ${rotationBefore}`);

    // Try to perform drag
    console.log('\nAttempting drag from center...');
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    console.log('  Mouse down ✓');

    await page.waitForTimeout(100);

    await page.mouse.move(centerX + 100, centerY, { steps: 10 });
    console.log('  Mouse moved +100px ✓');

    await page.waitForTimeout(100);

    await page.mouse.up();
    console.log('  Mouse up ✓');

    await page.waitForTimeout(200);

    const rotationAfter = await galleryTrack.evaluate(el => el.style.transform);
    console.log(`\nRotation AFTER drag: ${rotationAfter}`);

    if (rotationBefore !== rotationAfter) {
      console.log('\n✓ SUCCESS: Drag changed rotation!');
    } else {
      console.log('\n✗ FAIL: Drag did NOT change rotation');
    }

    // Check cursor change during drag simulation
    console.log('\nChecking cursor change during interaction...');
    const cursorDuringDrag = await carouselContainer.evaluate(el =>
      window.getComputedStyle(el).cursor
    );
    console.log(`Cursor after drag: ${cursorDuringDrag}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 6: Try dragging on a card directly');
  console.log('='.repeat(60));

  if (cardCount > 0) {
    const firstCard = cards.first();
    const cardBox = await firstCard.boundingBox();

    if (cardBox) {
      const cardCenterX = cardBox.x + cardBox.width / 2;
      const cardCenterY = cardBox.y + cardBox.height / 2;

      console.log(`Card center: (${Math.round(cardCenterX)}, ${Math.round(cardCenterY)})`);

      const rotationBeforeCardDrag = await galleryTrack.evaluate(el => el.style.transform);
      console.log(`Rotation BEFORE card drag: ${rotationBeforeCardDrag}`);

      console.log('\nAttempting drag from card...');
      await page.mouse.move(cardCenterX, cardCenterY);
      await page.mouse.down();
      await page.waitForTimeout(50);
      await page.mouse.move(cardCenterX + 100, cardCenterY, { steps: 10 });
      await page.waitForTimeout(50);
      await page.mouse.up();
      await page.waitForTimeout(200);

      const rotationAfterCardDrag = await galleryTrack.evaluate(el => el.style.transform);
      console.log(`Rotation AFTER card drag: ${rotationAfterCardDrag}`);

      if (rotationBeforeCardDrag !== rotationAfterCardDrag) {
        console.log('\n✓ SUCCESS: Card drag changed rotation!');
      } else {
        console.log('\n✗ FAIL: Card drag did NOT change rotation');
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Review the results above to identify the issue.');
  console.log('Common issues:');
  console.log('  - Event listeners not attached');
  console.log('  - JavaScript not loaded');
  console.log('  - CSS preventing interactions');
  console.log('  - Z-index issues');
  console.log('='.repeat(60) + '\n');

  await browser.close();
})();
