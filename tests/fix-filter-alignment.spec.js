const { test, expect } = require('@playwright/test');

test('Fix filter button alignment with CSS injection', async ({ page }) => {
  // Navigate and wait for page load
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(5000); // Wait for animations and JS initialization

  const timestamp = Date.now();

  console.log('\n========== FILTER BUTTON ALIGNMENT FIX ==========\n');

  // STEP 1: Capture BEFORE state
  await page.screenshot({
    path: `test-results/filter-before-fix-${timestamp}.png`,
    fullPage: false
  });

  const beforeState = await page.evaluate(() => {
    const filterSectionsPath = document.querySelector('#filter-sections path');
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterContainer = document.querySelector('.new-filter-container');
    const timeline = document.querySelector('.timeline-main-line');

    const getRect = (el) => el ? el.getBoundingClientRect() : null;
    const getComputedTop = (el) => el ? window.getComputedStyle(el).top : null;

    return {
      filterSectionsPath: { rect: getRect(filterSectionsPath) },
      filterBtn: { rect: getRect(filterBtn) },
      filterContainer: { rect: getRect(filterContainer), computedTop: getComputedTop(filterContainer) },
      timeline: { rect: getRect(timeline) },
      alignment: {
        svgTop: filterSectionsPath ? filterSectionsPath.getBoundingClientRect().top : null,
        btnTop: filterBtn ? filterBtn.getBoundingClientRect().top : null,
        gap: (filterBtn && filterSectionsPath) ?
          Math.abs(filterBtn.getBoundingClientRect().top - filterSectionsPath.getBoundingClientRect().top) : null
      }
    };
  });

  console.log('BEFORE state:');
  console.log('  SVG gradient top:', beforeState.filterSectionsPath.rect?.top);
  console.log('  HTML button top:', beforeState.filterBtn.rect?.top);
  console.log('  Container computed top:', beforeState.filterContainer.computedTop);
  console.log('  Misalignment gap:', beforeState.alignment.gap + 'px');
  console.log('  Timeline top:', beforeState.timeline.rect?.top);

  // STEP 2: Calculate required correction
  // The SVG is at containerY = 12 in the JavaScript (line 1828 of timeline-dev.html)
  // The .new-filter-container is currently at top: 12px
  // But the HTML button is 35px below the SVG gradient
  // This means we need to move the container UP by 35px

  const correctionNeeded = beforeState.alignment.gap;
  const newTopValue = `calc(12px - ${correctionNeeded}px)`; // = -23px

  console.log('\n  CORRECTION CALCULATION:');
  console.log('    Current container top: 12px');
  console.log('    Misalignment: ' + correctionNeeded + 'px');
  console.log('    Required adjustment: -' + correctionNeeded + 'px');
  console.log('    New top value: ' + newTopValue + ' = -23px');

  // STEP 3: Apply CSS fix via injection (NO CACHE ISSUES)
  console.log('\n  Applying CSS fix via injection...');

  await page.addStyleTag({
    content: `
      .new-filter-container {
        top: -23px !important;
      }
    `
  });

  // STEP 4: Wait for rendering
  await page.waitForTimeout(500);

  // STEP 5: Capture AFTER state
  await page.screenshot({
    path: `test-results/filter-after-fix-${timestamp}.png`,
    fullPage: false
  });

  const afterState = await page.evaluate(() => {
    const filterSectionsPath = document.querySelector('#filter-sections path');
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterContainer = document.querySelector('.new-filter-container');
    const timeline = document.querySelector('.timeline-main-line');

    const getRect = (el) => el ? el.getBoundingClientRect() : null;
    const getComputedTop = (el) => el ? window.getComputedStyle(el).top : null;

    return {
      filterSectionsPath: { rect: getRect(filterSectionsPath) },
      filterBtn: { rect: getRect(filterBtn) },
      filterContainer: { rect: getRect(filterContainer), computedTop: getComputedTop(filterContainer) },
      timeline: { rect: getRect(timeline) },
      alignment: {
        svgTop: filterSectionsPath ? filterSectionsPath.getBoundingClientRect().top : null,
        btnTop: filterBtn ? filterBtn.getBoundingClientRect().top : null,
        gap: (filterBtn && filterSectionsPath) ?
          Math.abs(filterBtn.getBoundingClientRect().top - filterSectionsPath.getBoundingClientRect().top) : null
      }
    };
  });

  console.log('\nAFTER state:');
  console.log('  SVG gradient top:', afterState.filterSectionsPath.rect?.top);
  console.log('  HTML button top:', afterState.filterBtn.rect?.top);
  console.log('  Container computed top:', afterState.filterContainer.computedTop);
  console.log('  Misalignment gap:', afterState.alignment.gap + 'px');
  console.log('  Timeline top:', afterState.timeline.rect?.top);

  // STEP 6: Calculate layout shifts
  const timelineShift = beforeState.timeline.rect && afterState.timeline.rect ?
    Math.abs(afterState.timeline.rect.top - beforeState.timeline.rect.top) : 0;

  const containerShift = beforeState.filterContainer.rect && afterState.filterContainer.rect ?
    afterState.filterContainer.rect.top - beforeState.filterContainer.rect.top : 0;

  console.log('\n  LAYOUT SHIFT ANALYSIS:');
  console.log('    Timeline shift: ' + timelineShift + 'px (should be 0)');
  console.log('    Container shift: ' + containerShift + 'px (expected: -35px)');
  console.log('    Alignment improved by: ' + (beforeState.alignment.gap - afterState.alignment.gap) + 'px');

  // STEP 7: Verify success
  const passed = afterState.alignment.gap < 2 && timelineShift < 2;

  console.log('\n========== VERIFICATION ==========\n');

  if (passed) {
    console.log('✅ FIX SUCCESSFUL!');
    console.log('   Alignment gap: ' + afterState.alignment.gap + 'px (< 2px threshold)');
    console.log('   Timeline shift: ' + timelineShift + 'px (no unintended movement)');
    console.log('   Container moved: ' + containerShift + 'px (as expected)');
    console.log('\n   RECOMMENDED CSS CHANGE:');
    console.log('   File: timeline-clean-test.css');
    console.log('   Line: 3879 (approx)');
    console.log('   Change: top: 12px; → top: -23px;');
  } else {
    console.log('❌ FIX INCOMPLETE');
    console.log('   Alignment gap: ' + afterState.alignment.gap + 'px (target: < 2px)');
    console.log('   Timeline shift: ' + timelineShift + 'px (target: < 2px)');

    if (afterState.alignment.gap >= 2) {
      console.log('   Further adjustment needed: ' + afterState.alignment.gap + 'px');
    }
  }

  console.log('\n  Screenshots:');
  console.log('    Before: test-results/filter-before-fix-' + timestamp + '.png');
  console.log('    After:  test-results/filter-after-fix-' + timestamp + '.png');
  console.log('\n========================================\n');

  // STEP 8: Capture close-up comparison
  const filterBtn = await page.locator('.new-filter-btn');
  await filterBtn.screenshot({
    path: `test-results/filter-button-fixed-${timestamp}.png`
  });

  console.log('✅ Close-up screenshot: test-results/filter-button-fixed-' + timestamp + '.png\n');

  // Assert test passes
  expect(passed).toBe(true);
});
