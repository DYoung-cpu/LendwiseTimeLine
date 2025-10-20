const { test, expect } = require('@playwright/test');

test('Test CSS injection to move filter button into notch', async ({ page }) => {
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(5000); // Wait for animations

  const timestamp = Date.now();

  console.log('\n========== CSS INJECTION TEST ==========\n');

  // Capture BEFORE state
  const beforeState = await page.evaluate(() => {
    const filterContainer = document.querySelector('.new-filter-container');
    const borderSvg = document.querySelector('.border-svg');

    if (!filterContainer || !borderSvg) {
      return { error: 'Elements not found' };
    }

    const filterRect = filterContainer.getBoundingClientRect();
    const borderRect = borderSvg.getBoundingClientRect();
    const filterStyles = window.getComputedStyle(filterContainer);
    const borderStyles = window.getComputedStyle(borderSvg);

    return {
      filterTop: filterRect.top,
      borderTop: borderRect.top,
      filterComputedTop: filterStyles.top,
      borderComputedTop: borderStyles.top,
      gap: filterRect.top - borderRect.top,
      expectedPosition: 'Filter should be inside border notch'
    };
  });

  console.log('BEFORE CSS INJECTION:');
  console.log('  Filter container computed top:', beforeState.filterComputedTop);
  console.log('  Filter container bounding top:', beforeState.filterTop);
  console.log('  Border SVG bounding top:', beforeState.borderTop);
  console.log('  Gap:', beforeState.gap + 'px');

  await page.screenshot({
    path: `test-results/before-injection-${timestamp}.png`,
    fullPage: false
  });

  // Now inject CSS to move the filter button UP into the notch
  // The notch is at the top of the border, so we need to move the filter UP
  // Current: top: -23px
  // Try: top: -58px (35px higher to match the -35px border offset)
  await page.addStyleTag({
    content: `
      .new-filter-container {
        top: -58px !important;
        background: rgba(255, 0, 0, 0.1) !important; /* Red tint to verify CSS applied */
      }
    `
  });

  await page.waitForTimeout(500);

  // Capture AFTER state
  const afterState = await page.evaluate(() => {
    const filterContainer = document.querySelector('.new-filter-container');
    const borderSvg = document.querySelector('.border-svg');

    const filterRect = filterContainer.getBoundingClientRect();
    const borderRect = borderSvg.getBoundingClientRect();
    const filterStyles = window.getComputedStyle(filterContainer);

    return {
      filterTop: filterRect.top,
      borderTop: borderRect.top,
      filterComputedTop: filterStyles.top,
      gap: filterRect.top - borderRect.top,
      backgroundColor: filterStyles.backgroundColor
    };
  });

  console.log('\nAFTER CSS INJECTION (top: -58px !important):');
  console.log('  Filter container computed top:', afterState.filterComputedTop);
  console.log('  Filter container bounding top:', afterState.filterTop);
  console.log('  Border SVG bounding top:', afterState.borderTop);
  console.log('  Gap:', afterState.gap + 'px');
  console.log('  Background color (should have red tint):', afterState.backgroundColor);

  await page.screenshot({
    path: `test-results/after-injection-${timestamp}.png`,
    fullPage: false
  });

  const movement = beforeState.filterTop - afterState.filterTop;
  console.log('\nMOVEMENT ANALYSIS:');
  console.log('  Filter moved UP by:', movement + 'px');
  console.log('  Gap before:', beforeState.gap + 'px');
  console.log('  Gap after:', afterState.gap + 'px');
  console.log('  Gap improvement:', (beforeState.gap - afterState.gap) + 'px');

  console.log('\nSCREENSHOTS:');
  console.log('  Before: test-results/before-injection-' + timestamp + '.png');
  console.log('  After: test-results/after-injection-' + timestamp + '.png');

  console.log('\n========== END TEST ==========\n');

  // The test succeeds if the gap decreased (filter moved up toward border)
  expect(afterState.gap).toBeLessThan(beforeState.gap);
});
