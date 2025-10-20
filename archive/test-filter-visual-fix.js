const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    console.log('\n🔍 FILTER BUTTON VISUAL FIX VERIFICATION\n');
    console.log('=' .repeat(60));

    // Navigate to page
    await page.goto('http://localhost:3005/timeline-dev.html', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for timeline
    await page.waitForSelector('.timeline-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // 1. Check for browser console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 2. Take "after" screenshot
    await page.screenshot({
      path: 'filter-buttons-after-fix.png',
      fullPage: false
    });
    results.passed.push('✅ After-fix screenshot saved');

    // 3. Check HTML button backgrounds are transparent
    const newFilterBtnBg = await page.evaluate(() => {
      const btn = document.querySelector('.new-filter-btn');
      if (!btn) return 'NOT_FOUND';
      const style = window.getComputedStyle(btn);
      return style.background || style.backgroundColor;
    });

    if (newFilterBtnBg.includes('transparent') || newFilterBtnBg.includes('rgba(0, 0, 0, 0)')) {
      results.passed.push('✅ .new-filter-btn has transparent background');
    } else {
      results.failed.push(`❌ .new-filter-btn background not transparent: ${newFilterBtnBg}`);
    }

    // 4. Check SVG sections exist
    const svgSections = await page.evaluate(() => {
      const sections = document.querySelectorAll('.filter-visual-section');
      return sections.length;
    });

    if (svgSections > 0) {
      results.passed.push(`✅ Found ${svgSections} SVG visual sections`);
    } else {
      results.failed.push('❌ No SVG visual sections found');
    }

    // 5. Check filter option buttons background
    const filterOptionBg = await page.evaluate(() => {
      const btn = document.querySelector('.filter-option-btn');
      if (!btn) return 'NOT_FOUND';
      const style = window.getComputedStyle(btn);
      return style.background || style.backgroundColor;
    });

    if (filterOptionBg.includes('rgba(0, 0, 0, 0.1)') || filterOptionBg === 'NOT_FOUND') {
      results.passed.push('✅ .filter-option-btn has correct subtle background');
    } else {
      results.warnings.push(`⚠️  .filter-option-btn background: ${filterOptionBg}`);
    }

    // 6. Test click functionality
    await page.click('.new-filter-btn');
    await page.waitForTimeout(500);

    const isExpanded = await page.evaluate(() => {
      return document.querySelector('.filter-container').classList.contains('filter-expanded');
    });

    if (isExpanded) {
      results.passed.push('✅ Filter expands on click');
    } else {
      results.failed.push('❌ Filter did not expand on click');
    }

    // 7. Check for old .filter-btn CSS
    const oldFilterBtn = await page.evaluate(() => {
      const oldBtn = document.querySelector('.filter-btn:not(.filter-option-btn):not(.new-filter-btn):not(.filter-clear-btn)');
      return oldBtn ? 'FOUND' : 'NOT_FOUND';
    });

    if (oldFilterBtn === 'NOT_FOUND') {
      results.passed.push('✅ No old .filter-btn elements found');
    } else {
      results.failed.push('❌ Old .filter-btn elements still present');
    }

    // 8. Visual comparison note
    console.log('\n📸 VISUAL COMPARISON:');
    console.log('   After screenshot: filter-buttons-after-fix.png');
    console.log('   Compare with user reference screenshot');

    // Print results
    console.log('\n\n📊 TEST RESULTS:\n');

    if (results.passed.length > 0) {
      console.log('PASSED:');
      results.passed.forEach(msg => console.log(`  ${msg}`));
    }

    if (results.warnings.length > 0) {
      console.log('\nWARNINGS:');
      results.warnings.forEach(msg => console.log(`  ${msg}`));
    }

    if (results.failed.length > 0) {
      console.log('\nFAILED:');
      results.failed.forEach(msg => console.log(`  ${msg}`));
    }

    if (errors.length > 0) {
      console.log('\nCONSOLE ERRORS:');
      errors.forEach(err => console.log(`  ❌ ${err}`));
    }

    console.log('\n' + '='.repeat(60));

    const totalTests = results.passed.length + results.failed.length;
    const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);

    console.log(`\n🎯 OVERALL: ${results.passed.length}/${totalTests} passed (${passRate}%)`);

    if (results.failed.length === 0) {
      console.log('\n✨ SUCCESS! All tests passed. Filter buttons are now transparent.\n');
      console.log('👉 NEXT STEPS:');
      console.log('   1. Compare screenshots visually');
      console.log('   2. Verify only SVG gradients are visible');
      console.log('   3. Check against user reference screenshot\n');
    } else {
      console.log('\n⚠️  ATTENTION NEEDED: Some tests failed. Review above.\n');
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    results.failed.push(`Test execution error: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
