const { test, expect } = require('@playwright/test');

test('Verify filter button at top: -35px aligns with border notch', async ({ page }) => {
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(5000);

  const timestamp = Date.now();

  console.log('\n========== VERIFICATION TEST: top: -35px ==========\n');

  // Capture BEFORE state
  const beforeState = await page.evaluate(() => {
    const filterContainer = document.querySelector('.new-filter-container');
    const borderSvg = document.querySelector('.border-svg');
    const filterRect = filterContainer.getBoundingClientRect();
    const borderRect = borderSvg.getBoundingClientRect();

    return {
      filterTop: filterRect.top,
      borderTop: borderRect.top,
      gap: filterRect.top - borderRect.top
    };
  });

  console.log('CURRENT STATE (top: -23px):');
  console.log('  Filter bounding top:', beforeState.filterTop);
  console.log('  Border bounding top:', beforeState.borderTop);
  console.log('  Gap:', beforeState.gap + 'px', beforeState.gap > 0 ? '(filter BELOW border)' : '(filter ABOVE border)');

  await page.screenshot({
    path: `test-results/verify-before-${timestamp}.png`
  });

  // Inject the corrected CSS
  await page.addStyleTag({
    content: `
      .new-filter-container {
        top: -35px !important;
      }
    `
  });

  await page.waitForTimeout(500);

  const afterState = await page.evaluate(() => {
    const filterContainer = document.querySelector('.new-filter-container');
    const borderSvg = document.querySelector('.border-svg');
    const timeline = document.querySelector('.timeline-main-line');

    const filterRect = filterContainer.getBoundingClientRect();
    const borderRect = borderSvg.getBoundingClientRect();
    const timelineRect = timeline ? timeline.getBoundingClientRect() : null;

    return {
      filterTop: filterRect.top,
      borderTop: borderRect.top,
      timelineTop: timelineRect ? timelineRect.top : null,
      gap: filterRect.top - borderRect.top,
      filterComputedTop: window.getComputedStyle(filterContainer).top
    };
  });

  console.log('\nCORRECTED STATE (top: -35px):');
  console.log('  Filter computed top:', afterState.filterComputedTop);
  console.log('  Filter bounding top:', afterState.filterTop);
  console.log('  Border bounding top:', afterState.borderTop);
  console.log('  Gap:', afterState.gap + 'px', Math.abs(afterState.gap) < 2 ? '✅ ALIGNED!' : '');
  console.log('  Timeline top:', afterState.timelineTop);

  await page.screenshot({
    path: `test-results/verify-after-${timestamp}.png`
  });

  console.log('\nRESULTS:');
  console.log('  Movement:', (beforeState.filterTop - afterState.filterTop) + 'px UP');
  console.log('  Gap improvement:', (beforeState.gap - afterState.gap) + 'px');
  console.log('  Final gap:', afterState.gap + 'px');

  if (Math.abs(afterState.gap) < 2) {
    console.log('\n✅ SUCCESS: Filter button is now aligned with border notch!');
    console.log('   Recommended CSS fix: Change .new-filter-container top from -23px to -35px');
  } else {
    console.log('\n⚠️  Gap still present. Further adjustment needed.');
  }

  console.log('\nSCREENSHOTS:');
  console.log('  Before: test-results/verify-before-' + timestamp + '.png');
  console.log('  After: test-results/verify-after-' + timestamp + '.png');

  console.log('\n========================================\n');

  // Success if gap is less than 2px
  expect(Math.abs(afterState.gap)).toBeLessThan(2);
});
