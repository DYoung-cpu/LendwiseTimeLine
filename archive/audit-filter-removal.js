const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,  // Browser stays open for visual inspection
    slowMo: 300
  });

  const page = await browser.newPage();

  // Disable cache
  await page.route('**/*', (route) => route.continue({
    headers: { ...route.request().headers(), 'Cache-Control': 'no-cache' }
  }));

  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(3000); // Wait for page to fully load

  console.log('\n=== FILTER REMOVAL AUDIT ===\n');

  // 1. CHECK FOR FILTER HTML ELEMENTS
  console.log('1. CHECKING FOR FILTER HTML ELEMENTS:');
  const filterElements = await page.evaluate(() => {
    return {
      newFilterContainer: !!document.getElementById('new-filter-container'),
      mainFilterBtn: !!document.getElementById('main-filter-btn'),
      filterOptionsLeft: !!document.getElementById('filter-options-left'),
      filterOptionsRight: !!document.getElementById('filter-options-right'),
      filterSections: !!document.getElementById('filter-sections'),
      filterBorder: !!document.getElementById('filter-border'),
      filterOptionBtns: document.querySelectorAll('.filter-option-btn').length,
      filterClearBtn: !!document.getElementById('filter-clear-btn'),
      filterCount: !!document.getElementById('filter-count')
    };
  });

  console.log(JSON.stringify(filterElements, null, 2));

  if (Object.values(filterElements).some(val => val === true || val > 0)) {
    console.log('\n❌ FAIL: Filter elements still exist in DOM');
  } else {
    console.log('\n✅ PASS: No filter elements found in DOM');
  }

  // 2. CHECK FOR FILTER SVG GRADIENTS
  console.log('\n2. CHECKING FOR FILTER SVG GRADIENTS:');
  const svgGradients = await page.evaluate(() => {
    return {
      filterGradient: !!document.getElementById('filterGradient'),
      inProgressGradient: !!document.getElementById('inProgressGradient'),
      futureGradient: !!document.getElementById('futureGradient')
    };
  });

  console.log(JSON.stringify(svgGradients, null, 2));

  if (Object.values(svgGradients).some(val => val === true)) {
    console.log('\n❌ FAIL: Filter SVG gradients still exist');
  } else {
    console.log('\n✅ PASS: No filter SVG gradients found');
  }

  // 3. CHECK FOR FILTER CSS CLASSES APPLIED
  console.log('\n3. CHECKING FOR FILTER CSS CLASSES:');
  const appliedClasses = await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    return {
      borderContainerHasFilterExpanded: borderContainer?.classList.contains('filter-expanded'),
      anyElementWithFilterClasses: Array.from(document.querySelectorAll('[class*="filter"]')).length
    };
  });

  console.log(JSON.stringify(appliedClasses, null, 2));

  if (appliedClasses.borderContainerHasFilterExpanded) {
    console.log('\n❌ FAIL: Border container has filter-expanded class');
  } else {
    console.log('\n✅ PASS: No filter-expanded class on border container');
  }

  // 4. CHECK BORDER RENDERING
  console.log('\n4. CHECKING BORDER SVG PATH:');
  const borderInfo = await page.evaluate(() => {
    const borderPath = document.getElementById('border-path');
    const pathD = borderPath?.getAttribute('d');

    return {
      borderPathExists: !!borderPath,
      pathHasNotch: pathD ? pathD.includes('-filterHeight') || pathD.includes('filterLeft') || pathD.includes('filterRight') : false,
      pathData: pathD ? pathD.substring(0, 100) + '...' : null
    };
  });

  console.log(JSON.stringify(borderInfo, null, 2));

  if (borderInfo.pathHasNotch) {
    console.log('\n❌ FAIL: Border path still contains filter button notch logic');
  } else if (borderInfo.borderPathExists) {
    console.log('\n✅ PASS: Border path exists without filter notch');
  } else {
    console.log('\n⚠️  WARNING: Border path not found');
  }

  // 5. CHECK FOR FILTER-RELATED JAVASCRIPT VARIABLES
  console.log('\n5. CHECKING FOR FILTER JAVASCRIPT:');
  const jsCheck = await page.evaluate(() => {
    // Check if filter-related global variables or functions exist
    return {
      hasCreateFilterSections: typeof createFilterSections !== 'undefined',
      hasToggleOptions: typeof toggleOptions !== 'undefined',
      hasFilterCount: typeof filterCount !== 'undefined'
    };
  });

  console.log(JSON.stringify(jsCheck, null, 2));

  if (Object.values(jsCheck).some(val => val === true)) {
    console.log('\n❌ FAIL: Filter JavaScript functions/variables still exist');
  } else {
    console.log('\n✅ PASS: No filter JavaScript found');
  }

  // 6. VISUAL INSPECTION
  console.log('\n6. VISUAL INSPECTION:');
  console.log('- Check if timeline border appears correctly without notch');
  console.log('- Verify no filter button or elements visible');
  console.log('- Confirm timeline milestones display properly');

  // 7. SUMMARY
  console.log('\n=== AUDIT SUMMARY ===\n');

  const allChecks = {
    htmlElements: !Object.values(filterElements).some(val => val === true || val > 0),
    svgGradients: !Object.values(svgGradients).some(val => val === true),
    cssClasses: !appliedClasses.borderContainerHasFilterExpanded,
    borderPath: !borderInfo.pathHasNotch && borderInfo.borderPathExists,
    javascript: !Object.values(jsCheck).some(val => val === true)
  };

  const passedCount = Object.values(allChecks).filter(v => v).length;
  const totalCount = Object.keys(allChecks).length;

  console.log(`Passed: ${passedCount}/${totalCount} checks`);

  if (passedCount === totalCount) {
    console.log('\n🎉 ✅ ALL CHECKS PASSED - Filter button successfully removed!\n');
  } else {
    console.log('\n⚠️  Some checks failed - Filter remnants may still exist\n');
    console.log('Failed checks:');
    Object.entries(allChecks).forEach(([key, passed]) => {
      if (!passed) console.log(`  - ${key}`);
    });
    console.log('');
  }

  console.log('Browser will remain open for 60 seconds for visual inspection...\n');

  await page.waitForTimeout(60000);
  await browser.close();
})();
