const { test, expect } = require('@playwright/test');

test('Final verification: Filter button aligned with CSS file change', async ({ page }) => {
  // Navigate with cache-busting to ensure fresh CSS load
  await page.goto('http://localhost:3005/timeline-dev.html?nocache=' + Date.now());
  await page.waitForTimeout(5000);

  const timestamp = Date.now();

  console.log('\n========== FINAL VERIFICATION (CSS FILE CHANGED) ==========\n');

  const result = await page.evaluate(() => {
    const filterContainer = document.querySelector('.new-filter-container');
    const borderSvg = document.querySelector('.border-svg');
    const timeline = document.querySelector('.timeline-main-line');

    if (!filterContainer || !borderSvg) {
      return { error: 'Elements not found' };
    }

    const filterRect = filterContainer.getBoundingClientRect();
    const borderRect = borderSvg.getBoundingClientRect();
    const timelineRect = timeline ? timeline.getBoundingClientRect() : null;
    const filterStyles = window.getComputedStyle(filterContainer);
    const borderStyles = window.getComputedStyle(borderSvg);

    return {
      filterComputedTop: filterStyles.top,
      borderComputedTop: borderStyles.top,
      filterBoundingTop: filterRect.top,
      borderBoundingTop: borderRect.top,
      timelineBoundingTop: timelineRect ? timelineRect.top : null,
      gap: filterRect.top - borderRect.top,
      className: filterContainer.className,
      matchesSelector: filterContainer.matches('.new-filter-container')
    };
  });

  console.log('VERIFICATION RESULTS:');
  console.log('  Element class name:', result.className);
  console.log('  Matches .new-filter-container:', result.matchesSelector);
  console.log('  Filter computed top:', result.filterComputedTop, result.filterComputedTop === '-35px' ? '✅' : '❌');
  console.log('  Border computed top:', result.borderComputedTop);
  console.log('  Filter bounding top:', result.filterBoundingTop);
  console.log('  Border bounding top:', result.borderBoundingTop);
  console.log('  Timeline bounding top:', result.timelineBoundingTop);
  console.log('  Gap (filter - border):', result.gap + 'px');

  await page.screenshot({
    path: `test-results/final-verification-${timestamp}.png`,
    fullPage: false
  });

  console.log('\nScreenshot: test-results/final-verification-' + timestamp + '.png');

  if (result.filterComputedTop === '-35px' && Math.abs(result.gap) < 2) {
    console.log('\n✅ SUCCESS: Filter button correctly positioned!');
    console.log('   - CSS applied: top: -35px');
    console.log('   - Alignment gap: ' + result.gap + 'px');
    console.log('   - Filter is integrated into border notch');
  } else {
    console.log('\n❌ ISSUE DETECTED:');
    if (result.filterComputedTop !== '-35px') {
      console.log('   - Expected computed top: -35px, got: ' + result.filterComputedTop);
      console.log('   - CSS may not be loading or is being overridden');
    }
    if (Math.abs(result.gap) >= 2) {
      console.log('   - Alignment gap too large: ' + result.gap + 'px');
    }
  }

  console.log('\n========================================\n');

  // Assert success
  expect(result.filterComputedTop).toBe('-35px');
  expect(Math.abs(result.gap)).toBeLessThan(2);
});
