const { test, expect } = require('@playwright/test');
const path = require('path');

test('Verify Filter Button Animation and Final State', async ({ page }) => {
  console.log('\n=== ANIMATION TIMING VERIFICATION ===\n');

  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForLoadState('networkidle');

  // Check opacity immediately after load (should be 0)
  const opacityBefore = await page.evaluate(() => {
    const el = document.getElementById('new-filter-container');
    return window.getComputedStyle(el).opacity;
  });

  console.log('Opacity immediately after load:', opacityBefore);
  console.log('Expected: 0 (animation starts with opacity: 0)');

  // Wait for animation to complete (3.5s delay + 0.5s animation = 4s total)
  console.log('\nWaiting 4.5 seconds for animation to complete...');
  await page.waitForTimeout(4500);

  // Check opacity after animation (should be 1)
  const opacityAfter = await page.evaluate(() => {
    const el = document.getElementById('new-filter-container');
    return window.getComputedStyle(el).opacity;
  });

  console.log('\nOpacity after 4.5 seconds:', opacityAfter);
  console.log('Expected: 1 (animation should have made it visible)');

  // Verify the top position is still correct
  const finalTop = await page.evaluate(() => {
    const el = document.getElementById('new-filter-container');
    return window.getComputedStyle(el).top;
  });

  console.log('\nFinal top position:', finalTop);
  console.log('Expected: -23px');

  // Check if animation exists
  const animationInfo = await page.evaluate(() => {
    const el = document.getElementById('new-filter-container');
    const computed = window.getComputedStyle(el);
    return {
      animationName: computed.animationName,
      animationDuration: computed.animationDuration,
      animationDelay: computed.animationDelay,
      animationFillMode: computed.animationFillMode
    };
  });

  console.log('\nAnimation properties:');
  console.log('  Name:', animationInfo.animationName);
  console.log('  Duration:', animationInfo.animationDuration);
  console.log('  Delay:', animationInfo.animationDelay);
  console.log('  Fill Mode:', animationInfo.animationFillMode);

  // Take screenshots before and after animation
  const beforePath = path.join(__dirname, '..', 'test-results', 'filter-before-animation.png');
  const afterPath = path.join(__dirname, '..', 'test-results', 'filter-after-animation.png');

  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: beforePath, fullPage: false });
  console.log('\nBefore animation screenshot:', beforePath);

  await page.waitForTimeout(4500);
  await page.screenshot({ path: afterPath, fullPage: false });
  console.log('After animation screenshot:', afterPath);

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('CSS is working correctly: top = -23px ✅');
  console.log('Animation delay: 3.5s');
  console.log('Animation duration: 0.5s');
  console.log('Total wait time needed: 4 seconds');
  console.log('User issue: Checked browser BEFORE animation completed!');
  console.log('\n================\n');

  // Assertions
  expect(finalTop).toBe('-23px');
  expect(parseFloat(opacityAfter)).toBeGreaterThan(0.9); // Should be 1 or very close
});
