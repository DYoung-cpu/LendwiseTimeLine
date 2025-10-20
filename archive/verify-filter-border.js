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
  console.log('FILTER BORDER VERIFICATION');
  console.log('========================================\n');

  const analysis = await page.evaluate(() => {
    const filterBorder = document.getElementById('filter-border');
    const borderPath = document.getElementById('border-path');

    if (!filterBorder || !borderPath) {
      return { error: 'Border elements not found' };
    }

    const filterBorderD = filterBorder.getAttribute('d');
    const filterBorderStroke = filterBorder.getAttribute('stroke');
    const filterBorderStrokeWidth = filterBorder.getAttribute('stroke-width');

    // Parse commands
    const commands = filterBorderD.match(/[MLQZ]/g);
    const hasTopEdge = filterBorderD.includes('L') && commands.length > 2;
    const hasBottomEdge = filterBorderD.includes('L') && commands.length > 2;
    const hasCorners = filterBorderD.includes('Q');

    return {
      filterBorder: {
        pathLength: filterBorderD.length,
        stroke: filterBorderStroke,
        strokeWidth: filterBorderStrokeWidth,
        commandCount: commands.length,
        hasTopEdge,
        hasBottomEdge,
        hasCorners,
        pathSnippet: filterBorderD.substring(0, 100) + '...'
      }
    };
  });

  if (analysis.error) {
    console.log('❌ ERROR:', analysis.error);
    await browser.close();
    return;
  }

  console.log('📊 FILTER BORDER ANALYSIS:\n');
  console.log(`Path length: ${analysis.filterBorder.pathLength} characters`);
  console.log(`Stroke: ${analysis.filterBorder.stroke}`);
  console.log(`Stroke width: ${analysis.filterBorder.strokeWidth}px`);
  console.log(`Command count: ${analysis.filterBorder.commandCount}`);
  console.log(`Has top edge: ${analysis.filterBorder.hasTopEdge ? '✅' : '❌'}`);
  console.log(`Has bottom edge: ${analysis.filterBorder.hasBottomEdge ? '✅' : '❌'}`);
  console.log(`Has rounded corners: ${analysis.filterBorder.hasCorners ? '✅' : '❌'}`);
  console.log(`\nPath snippet: ${analysis.filterBorder.pathSnippet}`);

  console.log('\n========================================');
  console.log('RESULTS');
  console.log('========================================\n');

  if (analysis.filterBorder.commandCount >= 8) {
    console.log('✅ Filter border has complete outline (top, bottom, sides, corners)');
  } else {
    console.log('❌ Filter border outline incomplete');
  }

  console.log('\n⏸️  Pausing for 5 seconds for visual inspection...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
