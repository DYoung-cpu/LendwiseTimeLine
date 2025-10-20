const { test, expect } = require('@playwright/test');

test('Test border frame height reduction with CSS transform', async ({ page }) => {
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(5000); // Wait for animations

  const timestamp = Date.now();

  console.log('\n=== BORDER HEIGHT FIX TEST ===\n');

  // STEP 1: Measure current state
  const before = await page.evaluate(() => {
    const borderSvg = document.querySelector('.border-svg');
    const timeline = document.querySelector('.timeline-main-line');
    const borderContainer = document.querySelector('.timeline-border-container');

    if (!borderSvg || !timeline || !borderContainer) {
      return null;
    }

    const svgRect = borderSvg.getBoundingClientRect();
    const timelineRect = timeline.getBoundingClientRect();
    const containerRect = borderContainer.getBoundingClientRect();

    return {
      svgBottom: svgRect.bottom,
      svgTop: svgRect.top,
      svgHeight: svgRect.height,
      timelineTop: timelineRect.top,
      containerHeight: containerRect.height,
      containerBottom: containerRect.bottom
    };
  });

  console.log('BEFORE INJECTION:');
  console.log(`  SVG Border Height: ${before.svgHeight}px`);
  console.log(`  SVG Bottom Edge: ${before.svgBottom}px`);
  console.log(`  Container Bottom: ${before.containerBottom}px`);
  console.log(`  Gap below container: ${before.svgBottom - before.containerBottom}px`);

  // Take before screenshot
  await page.screenshot({
    path: `test-results/border-before-${timestamp}.png`,
    fullPage: false
  });

  // STEP 2: Try CSS transform to move border down visually
  // This will shift the entire SVG down, making the bottom edge closer to timeline
  await page.addStyleTag({
    content: `
      .border-svg {
        transform: translateY(-50px) !important;
      }
    `
  });

  await page.waitForTimeout(500);

  // STEP 3: Measure after injection
  const after = await page.evaluate(() => {
    const borderSvg = document.querySelector('.border-svg');
    const timeline = document.querySelector('.timeline-main-line');
    const borderContainer = document.querySelector('.timeline-border-container');

    const svgRect = borderSvg.getBoundingClientRect();
    const timelineRect = timeline.getBoundingClientRect();
    const containerRect = borderContainer.getBoundingClientRect();

    return {
      svgBottom: svgRect.bottom,
      svgTop: svgRect.top,
      svgHeight: svgRect.height,
      timelineTop: timelineRect.top,
      containerHeight: containerRect.height,
      containerBottom: containerRect.bottom
    };
  });

  console.log('\nAFTER INJECTION (translateY(-50px)):');
  console.log(`  SVG Border Height: ${after.svgHeight}px`);
  console.log(`  SVG Bottom Edge: ${after.svgBottom}px`);
  console.log(`  Container Bottom: ${after.containerBottom}px`);
  console.log(`  Gap below container: ${after.svgBottom - after.containerBottom}px`);
  console.log(`  Movement: ${before.svgBottom - after.svgBottom}px upward`);

  // Take after screenshot
  await page.screenshot({
    path: `test-results/border-after-${timestamp}.png`,
    fullPage: false
  });

  // STEP 4: Check filter button is still intact
  const filterCheck = await page.evaluate(() => {
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterText = filterBtn?.querySelector('span:not(.filter-count)');

    if (!filterBtn || !filterText) return { intact: false };

    const btnRect = filterBtn.getBoundingClientRect();
    const textRect = filterText.getBoundingClientRect();

    // Text should be inside button bounds
    const textInsideButton = (
      textRect.top >= btnRect.top &&
      textRect.bottom <= btnRect.bottom + 5 // 5px tolerance
    );

    return {
      intact: textInsideButton,
      btnTop: btnRect.top,
      textTop: textRect.top,
      offset: textRect.top - btnRect.top
    };
  });

  console.log('\nFILTER BUTTON CHECK:');
  console.log(`  Button intact: ${filterCheck.intact ? '✓ YES' : '✗ NO'}`);
  console.log(`  Text offset from button: ${filterCheck.offset}px`);

  console.log('\n=== RESULT ===');
  const improvement = before.svgBottom - after.svgBottom;
  console.log(`Border moved up by: ${improvement}px`);
  console.log(`Filter button: ${filterCheck.intact ? '✓ Still intact' : '✗ BROKEN'}`);

  if (filterCheck.intact && improvement > 40) {
    console.log('\n✅ SUCCESS: Border reduced WITHOUT breaking filter button');
    console.log(`\nCSS to apply:\n.border-svg {\n  transform: translateY(-50px);\n}\n`);
  } else if (!filterCheck.intact) {
    console.log('\n⚠️  WARNING: Filter button was affected by the transform');
  } else {
    console.log('\n❌ Border did not move enough');
  }

  console.log(`\nScreenshots:`);
  console.log(`  Before: test-results/border-before-${timestamp}.png`);
  console.log(`  After: test-results/border-after-${timestamp}.png`);
});
