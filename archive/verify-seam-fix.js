const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  // Expand filter
  console.log('🖱️ Expanding filter...');
  await page.click('.new-filter-btn');
  await page.waitForTimeout(700);

  console.log('\n========================================');
  console.log('SEAM FIX VERIFICATION');
  console.log('========================================\n');

  const analysis = await page.evaluate(() => {
    const filterSections = document.getElementById('filter-sections');
    const sectionPaths = Array.from(filterSections.querySelectorAll('path'));

    return sectionPaths.map((path, index) => {
      const stroke = path.getAttribute('stroke');
      const strokeWidth = path.getAttribute('stroke-width');
      const bbox = path.getBBox();

      return {
        index,
        hasStroke: !!stroke,
        stroke: stroke || 'none',
        strokeWidth: strokeWidth || 'none',
        width: Math.round(bbox.width * 10) / 10
      };
    });
  });

  console.log('📊 SECTION STROKE ANALYSIS:\n');
  analysis.forEach(section => {
    const status = section.hasStroke ? '🔲' : '⬜';
    console.log(`${status} Section ${section.index}:`);
    console.log(`   Stroke: ${section.stroke}`);
    console.log(`   Stroke Width: ${section.strokeWidth}`);
    console.log(`   Width: ${section.width}px`);
    console.log('');
  });

  const middleSections = analysis.slice(1, -1);
  const noStrokeMiddle = middleSections.every(s => !s.hasStroke);

  console.log('========================================');
  console.log('RESULTS');
  console.log('========================================\n');

  if (noStrokeMiddle) {
    console.log('✅ Middle sections have no stroke - seams should be eliminated');
  } else {
    console.log('❌ Some middle sections still have stroke');
  }

  if (analysis[0].hasStroke && analysis[analysis.length - 1].hasStroke) {
    console.log('✅ First and last sections have stroke for outer edges');
  }

  console.log('\n⏸️  Pausing for 5 seconds for visual inspection...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
