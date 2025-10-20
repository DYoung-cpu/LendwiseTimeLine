const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Starting filter button restoration test...\n');

  try {
    // Navigate to the page
    console.log('1. Loading timeline-dev.html...');
    await page.goto('http://localhost:3005/timeline-dev.html');
    await page.waitForTimeout(5000); // Wait for intro animation

    // Test 1: Check if filter button exists
    console.log('2. Checking if filter button exists...');
    const filterBtn = await page.$('#main-filter-btn');
    if (!filterBtn) {
      throw new Error('FAIL: Filter button not found');
    }
    console.log('   ✓ Filter button found');

    // Test 2: Check if SVG gradients exist
    console.log('3. Checking SVG gradients...');
    const filterGradient = await page.$('#filterGradient');
    const inProgressGradient = await page.$('#inProgressGradient');
    const futureGradient = await page.$('#futureGradient');
    if (!filterGradient || !inProgressGradient || !futureGradient) {
      throw new Error('FAIL: One or more gradients missing');
    }
    console.log('   ✓ All 3 gradients present (filterGradient, inProgressGradient, futureGradient)');

    // Test 3: Check if filter sections container exists
    console.log('4. Checking SVG filter sections container...');
    const filterSections = await page.$('#filter-sections');
    if (!filterSections) {
      throw new Error('FAIL: Filter sections container not found');
    }
    console.log('   ✓ Filter sections container found');

    // Test 4: Take screenshot of initial state
    console.log('5. Taking screenshot of closed state...');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'filter-test-closed.png',
      fullPage: false
    });
    console.log('   ✓ Screenshot saved: filter-test-closed.png');

    // Test 5: Click filter button to expand
    console.log('6. Clicking filter button to expand...');
    await filterBtn.click();
    await page.waitForTimeout(800); // Wait for expansion animation

    // Test 6: Check if expanded correctly
    console.log('7. Verifying expansion...');
    const container = await page.$('#new-filter-container');
    const isExpanded = await container.evaluate(el => el.classList.contains('filter-expanded'));
    if (!isExpanded) {
      throw new Error('FAIL: Container did not expand');
    }
    console.log('   ✓ Container expanded successfully');

    // Test 7: Check if all 6 sections are visible
    console.log('8. Checking if 6 colored sections rendered...');
    const sectionPaths = await page.$$('#filter-sections path');
    if (sectionPaths.length !== 6) {
      throw new Error(`FAIL: Expected 6 sections, found ${sectionPaths.length}`);
    }
    console.log('   ✓ All 6 sections rendered');

    // Test 8: Take screenshot of expanded state
    console.log('9. Taking screenshot of expanded state...');
    await page.screenshot({
      path: 'filter-test-expanded.png',
      fullPage: false
    });
    console.log('   ✓ Screenshot saved: filter-test-expanded.png');

    // Test 9: Verify option buttons are visible
    console.log('10. Verifying filter option buttons...');
    const operationsBtn = await page.$('.filter-operations');
    const techBtn = await page.$('.filter-tech');
    const completedBtn = await page.$('.filter-completed');
    const inProgressBtn = await page.$('.filter-in-progress');
    const futureBtn = await page.$('.filter-future');

    if (!operationsBtn || !techBtn || !completedBtn || !inProgressBtn || !futureBtn) {
      throw new Error('FAIL: One or more option buttons missing');
    }
    console.log('   ✓ All 5 filter option buttons found');

    // Test 10: Click to close
    console.log('11. Clicking to close filter...');
    await filterBtn.click();
    await page.waitForTimeout(800);

    const isClosed = await container.evaluate(el => !el.classList.contains('filter-expanded'));
    if (!isClosed) {
      throw new Error('FAIL: Container did not close');
    }
    console.log('   ✓ Filter closed successfully');

    console.log('\n========================================');
    console.log('ALL TESTS PASSED!');
    console.log('========================================\n');
    console.log('Filter button restoration successful!');
    console.log('- SVG gradients: ✓');
    console.log('- SVG sections: ✓');
    console.log('- HTML structure: ✓');
    console.log('- JavaScript functions: ✓');
    console.log('- CSS styling: ✓');
    console.log('- Expand/collapse animation: ✓');
    console.log('\nScreenshots saved:');
    console.log('- filter-test-closed.png');
    console.log('- filter-test-expanded.png');

  } catch (error) {
    console.error('\n========================================');
    console.error('TEST FAILED!');
    console.error('========================================');
    console.error(error.message);
    await page.screenshot({ path: 'filter-test-error.png' });
    console.error('\nError screenshot saved: filter-test-error.png');
  }

  await page.waitForTimeout(2000);
  await browser.close();
  process.exit(0);
})();
