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
  console.log('VERIFYING GRADIENT BREAK FIXES');
  console.log('========================================\n');

  const analysis = await page.evaluate(() => {
    const filterSections = document.getElementById('filter-sections');
    const borderPath = document.getElementById('border-path');

    if (!filterSections || !borderPath) {
      return { error: 'Elements not found' };
    }

    const sectionPaths = Array.from(filterSections.querySelectorAll('path'));
    const sections = sectionPaths.map((path, index) => {
      const stroke = path.getAttribute('stroke');
      const strokeWidth = path.getAttribute('stroke-width');
      const bbox = path.getBBox();
      const rect = path.getBoundingClientRect();

      return {
        index,
        bbox: {
          x: Math.round(bbox.x * 10) / 10,
          width: Math.round(bbox.width * 10) / 10
        },
        screen: {
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10
        },
        stroke,
        strokeWidth
      };
    });

    // Check overlaps between sections
    const overlaps = [];
    for (let i = 0; i < sections.length - 1; i++) {
      const current = sections[i];
      const next = sections[i + 1];
      const overlap = Math.round((current.screen.right - next.screen.left) * 10) / 10;

      overlaps.push({
        between: `Section ${i} and ${i + 1}`,
        overlap: overlap,
        currentRight: current.screen.right,
        nextLeft: next.screen.left
      });
    }

    // Check border path endpoints
    const borderPathD = borderPath.getAttribute('d');
    const borderStroke = borderPath.getAttribute('stroke');
    const borderStrokeWidth = borderPath.getAttribute('stroke-width');
    const borderStyle = window.getComputedStyle(borderPath);

    return {
      sections,
      overlaps,
      border: {
        stroke: borderStroke,
        strokeWidth: borderStrokeWidth,
        strokeLinecap: borderStyle.strokeLinecap,
        pathSegments: borderPathD.split('M').filter(s => s.trim()).length
      }
    };
  });

  if (analysis.error) {
    console.log('❌ ERROR:', analysis.error);
    await browser.close();
    return;
  }

  console.log('📊 SECTION STROKE ANALYSIS:\n');
  analysis.sections.forEach(section => {
    console.log(`Section ${section.index}:`);
    console.log(`   Stroke: ${section.stroke}`);
    console.log(`   Stroke Width: ${section.strokeWidth}px`);
    console.log(`   Screen: left=${section.screen.left}, right=${section.screen.right}`);
    console.log('');
  });

  console.log('📊 OVERLAP ANALYSIS:\n');
  analysis.overlaps.forEach(overlap => {
    const status = overlap.overlap > 0 ? '✅' : '❌';
    console.log(`${status} ${overlap.between}:`);
    console.log(`   Overlap: ${overlap.overlap}px`);
    console.log(`   Section ends at: ${overlap.currentRight}px`);
    console.log(`   Next starts at: ${overlap.nextLeft}px`);
    console.log('');
  });

  console.log('📊 BORDER PATH ANALYSIS:\n');
  console.log(`Stroke: ${analysis.border.stroke}`);
  console.log(`Stroke Width: ${analysis.border.strokeWidth}px`);
  console.log(`Stroke Linecap: ${analysis.border.strokeLinecap}`);
  console.log(`Path Segments: ${analysis.border.pathSegments}`);

  console.log('\n========================================');
  console.log('VERIFICATION RESULTS');
  console.log('========================================\n');

  const allOverlapping = analysis.overlaps.every(o => o.overlap > 0);
  const properStroke = analysis.sections.every(s => parseFloat(s.strokeWidth) >= 1);

  if (allOverlapping) {
    console.log('✅ All sections have overlap - gradient breaks should be fixed');
  } else {
    console.log('❌ Some sections still have gaps');
  }

  if (properStroke) {
    console.log('✅ All sections have stroke-width ≥ 1px');
  } else {
    console.log('❌ Some sections have insufficient stroke width');
  }

  if (analysis.border.strokeLinecap === 'square') {
    console.log('✅ Border has stroke-linecap: square');
  } else {
    console.log('⚠️  Border stroke-linecap is not square');
  }

  console.log('\n⏸️  Pausing for 5 seconds for visual inspection...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Verification complete!');
})();
