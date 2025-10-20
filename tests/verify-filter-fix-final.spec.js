const { test, expect } = require('@playwright/test');

test('Verify filter button fix in actual CSS file', async ({ page }) => {
  // Navigate and wait for page load
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(5000); // Wait for animations and JS initialization

  const timestamp = Date.now();

  console.log('\n========== FINAL VERIFICATION OF FILTER BUTTON FIX ==========\n');

  // Check current state
  const currentState = await page.evaluate(() => {
    const filterSectionsPath = document.querySelector('#filter-sections path');
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterContainer = document.querySelector('.new-filter-container');
    const timeline = document.querySelector('.timeline-main-line');
    const filterText = document.querySelector('.new-filter-btn span');

    const getRect = (el) => el ? el.getBoundingClientRect() : null;
    const getComputedTop = (el) => el ? window.getComputedStyle(el).top : null;

    return {
      filterSectionsPath: {
        rect: getRect(filterSectionsPath),
        exists: !!filterSectionsPath,
        fill: filterSectionsPath?.getAttribute('fill'),
        visible: filterSectionsPath ? (
          window.getComputedStyle(filterSectionsPath).display !== 'none' &&
          window.getComputedStyle(filterSectionsPath).visibility !== 'hidden' &&
          window.getComputedStyle(filterSectionsPath).opacity !== '0'
        ) : false
      },
      filterBtn: {
        rect: getRect(filterBtn),
        exists: !!filterBtn,
        background: filterBtn ? window.getComputedStyle(filterBtn).background : null
      },
      filterContainer: {
        rect: getRect(filterContainer),
        computedTop: getComputedTop(filterContainer)
      },
      filterText: {
        rect: getRect(filterText),
        insideButton: filterBtn ? filterBtn.contains(filterText) : false,
        textContent: filterText?.textContent
      },
      timeline: {
        rect: getRect(timeline)
      },
      alignment: {
        svgTop: filterSectionsPath ? filterSectionsPath.getBoundingClientRect().top : null,
        btnTop: filterBtn ? filterBtn.getBoundingClientRect().top : null,
        gap: (filterBtn && filterSectionsPath) ?
          Math.abs(filterBtn.getBoundingClientRect().top - filterSectionsPath.getBoundingClientRect().top) : null
      }
    };
  });

  console.log('CURRENT STATE:');
  console.log('  Container computed top:', currentState.filterContainer.computedTop);
  console.log('  SVG gradient top:', currentState.filterSectionsPath.rect?.top);
  console.log('  HTML button top:', currentState.filterBtn.rect?.top);
  console.log('  Filter text top:', currentState.filterText.rect?.top);
  console.log('  Alignment gap:', currentState.alignment.gap + 'px');

  // Capture screenshot
  await page.screenshot({
    path: `test-results/filter-verified-${timestamp}.png`,
    fullPage: false
  });

  const filterBtn = await page.locator('.new-filter-btn');
  await filterBtn.screenshot({
    path: `test-results/filter-button-verified-${timestamp}.png`
  });

  console.log('\n  Screenshots saved:');
  console.log('    - test-results/filter-verified-' + timestamp + '.png');
  console.log('    - test-results/filter-button-verified-' + timestamp + '.png');

  // Verify all issues are fixed
  const issues = [];
  const warnings = [];

  if (!currentState.filterSectionsPath.exists) {
    issues.push('SVG gradient path not found');
  }

  if (!currentState.filterSectionsPath.visible) {
    issues.push('SVG gradient path not visible');
  }

  if (currentState.filterSectionsPath.fill !== 'url(#filterGradient)') {
    issues.push('SVG gradient fill incorrect: ' + currentState.filterSectionsPath.fill);
  }

  if (currentState.alignment.gap > 2) {
    issues.push('Filter button misaligned by ' + currentState.alignment.gap + 'px');
  }

  if (!currentState.filterText.insideButton) {
    issues.push('Filter text not inside button');
  }

  if (currentState.filterContainer.computedTop !== '-23px') {
    warnings.push('Container top is ' + currentState.filterContainer.computedTop + ' (expected -23px)');
  }

  console.log('\n========== VERIFICATION RESULTS ==========\n');

  if (issues.length === 0) {
    console.log('✅ ALL ISSUES FIXED!');
    console.log('   ✓ SVG gradient exists and visible');
    console.log('   ✓ SVG gradient using correct fill (url(#filterGradient))');
    console.log('   ✓ Filter button aligned with SVG (gap: ' + currentState.alignment.gap + 'px)');
    console.log('   ✓ Filter text inside button');
    console.log('   ✓ Container positioned at: ' + currentState.filterContainer.computedTop);
  } else {
    console.log('❌ ISSUES REMAINING:');
    issues.forEach(issue => console.log('   - ' + issue));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(warning => console.log('   - ' + warning));
  }

  console.log('\n========================================\n');

  // Assert success
  expect(issues.length).toBe(0);
  expect(currentState.alignment.gap).toBeLessThan(2);
  expect(currentState.filterSectionsPath.visible).toBe(true);
  expect(currentState.filterText.insideButton).toBe(true);
});
