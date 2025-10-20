const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  console.log('\n========================================');
  console.log('BORDER ENDPOINT ANALYSIS (CLOSED STATE)');
  console.log('========================================\n');

  const analysis = await page.evaluate(() => {
    const borderPath = document.getElementById('border-path');
    const filterSections = document.getElementById('filter-sections');
    const filterBtn = document.querySelector('.new-filter-btn');
    const borderContainer = document.querySelector('.timeline-border-container');

    if (!borderPath || !filterSections || !filterBtn) {
      return { error: 'Elements not found' };
    }

    const borderPathD = borderPath.getAttribute('d');
    const pathSegments = borderPathD.split(/[ML]/).filter(s => s.trim());

    // Parse coordinates from path
    const coords = pathSegments.map(seg => {
      const nums = seg.trim().split(/\s+/).map(n => parseFloat(n));
      return { x: nums[0], y: nums[1] };
    }).filter(c => !isNaN(c.x));

    // Get filter button bounds
    const filterRect = filterBtn.getBoundingClientRect();
    const filterSectionPaths = filterSections.querySelectorAll('path');
    const filterSectionRect = filterSectionPaths[0] ? filterSectionPaths[0].getBoundingClientRect() : null;

    // Get viewport info
    const containerRect = borderContainer.getBoundingClientRect();
    const centerX = containerRect.width / 2;

    return {
      borderEndpoints: {
        leftEndpoint: coords[1], // Second point (after first corner)
        rightStartpoint: coords[2] // Third point (start of right segment)
      },
      filterButton: {
        left: Math.round(filterRect.left - containerRect.left),
        right: Math.round(filterRect.right - containerRect.left),
        width: Math.round(filterRect.width)
      },
      filterSection: filterSectionRect ? {
        left: Math.round(filterSectionRect.left - containerRect.left),
        right: Math.round(filterSectionRect.right - containerRect.left),
        width: Math.round(filterSectionRect.width)
      } : null,
      centerX: Math.round(centerX),
      containerWidth: Math.round(containerRect.width)
    };
  });

  if (analysis.error) {
    console.log('❌ ERROR:', analysis.error);
    await browser.close();
    return;
  }

  console.log('📊 FILTER BUTTON POSITION:');
  console.log(`   Left edge: ${analysis.filterButton.left}px`);
  console.log(`   Right edge: ${analysis.filterButton.right}px`);
  console.log(`   Width: ${analysis.filterButton.width}px`);
  console.log(`   Center X: ${analysis.centerX}px\n`);

  if (analysis.filterSection) {
    console.log('📊 FILTER SECTION (SVG) POSITION:');
    console.log(`   Left edge: ${analysis.filterSection.left}px`);
    console.log(`   Right edge: ${analysis.filterSection.right}px`);
    console.log(`   Width: ${analysis.filterSection.width}px\n`);
  }

  console.log('📊 BORDER PATH ENDPOINTS:');
  console.log(`   Left endpoint: x=${Math.round(analysis.borderEndpoints.leftEndpoint.x)}px`);
  console.log(`   Right startpoint: x=${Math.round(analysis.borderEndpoints.rightStartpoint.x)}px\n`);

  console.log('========================================');
  console.log('COVERAGE ANALYSIS');
  console.log('========================================\n');

  const leftGap = analysis.filterButton.left - Math.round(analysis.borderEndpoints.leftEndpoint.x);
  const rightGap = Math.round(analysis.borderEndpoints.rightStartpoint.x) - analysis.filterButton.right;

  console.log(`Left side:`);
  console.log(`   Border ends at: ${Math.round(analysis.borderEndpoints.leftEndpoint.x)}px`);
  console.log(`   Filter starts at: ${analysis.filterButton.left}px`);
  console.log(`   Gap: ${leftGap}px ${leftGap > 0 ? '❌ EXPOSED' : '✅ COVERED'}\n`);

  console.log(`Right side:`);
  console.log(`   Filter ends at: ${analysis.filterButton.right}px`);
  console.log(`   Border starts at: ${Math.round(analysis.borderEndpoints.rightStartpoint.x)}px`);
  console.log(`   Gap: ${rightGap}px ${rightGap > 0 ? '❌ EXPOSED' : '✅ COVERED'}\n`);

  if (leftGap <= 0 && rightGap <= 0) {
    console.log('✅ SUCCESS: Border endpoints fully hidden under filter button!');
  } else {
    console.log('❌ ISSUE: Border endpoints still exposed');
    console.log(`   Recommendation: Extend endpoints by additional ${Math.max(leftGap, rightGap)}px`);
  }

  console.log('\n⏸️  Pausing for 5 seconds for visual inspection...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Analysis complete!');
})();
