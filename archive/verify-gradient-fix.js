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
  await page.waitForTimeout(500);

  console.log('\n========================================');
  console.log('GRADIENT TYPE VERIFICATION');
  console.log('========================================\n');

  const gradientAnalysis = await page.evaluate(() => {
    const svg = document.getElementById('border-svg');
    const defs = svg.querySelector('defs');

    // Get all gradient definitions
    const gradients = Array.from(defs.querySelectorAll('linearGradient, radialGradient')).map(g => ({
      id: g.id,
      type: g.tagName,
      attributes: g.tagName === 'linearGradient'
        ? { x1: g.getAttribute('x1'), y1: g.getAttribute('y1'), x2: g.getAttribute('x2'), y2: g.getAttribute('y2') }
        : { cx: g.getAttribute('cx'), cy: g.getAttribute('cy'), r: g.getAttribute('r') }
    }));

    // Check section overlaps
    const filterSections = document.getElementById('filter-sections');
    const sectionPaths = Array.from(filterSections.querySelectorAll('path'));
    const sections = sectionPaths.map((path, i) => {
      const bbox = path.getBBox();
      const rect = path.getBoundingClientRect();
      return {
        index: i,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        fill: path.getAttribute('fill')
      };
    });

    // Calculate overlaps
    const overlaps = [];
    for (let i = 0; i < sections.length - 1; i++) {
      const overlap = sections[i].right - sections[i + 1].left;
      overlaps.push({
        between: `${sections[i].fill.match(/#(\w+)/)[1]} → ${sections[i + 1].fill.match(/#(\w+)/)[1]}`,
        overlap: overlap,
        left: sections[i].right,
        right: sections[i + 1].left
      });
    }

    return { gradients, overlaps };
  });

  console.log('📊 GRADIENT DEFINITIONS:\n');
  gradientAnalysis.gradients.forEach(g => {
    console.log(`${g.id}:`);
    console.log(`   Type: ${g.type}`);
    if (g.type === 'linearGradient') {
      console.log(`   Direction: (${g.attributes.x1}, ${g.attributes.y1}) → (${g.attributes.x2}, ${g.attributes.y2})`);
      console.log(`   ${g.attributes.y2 === '100%' ? '✅' : '❌'} Vertical gradient`);
    } else {
      console.log(`   Center: (${g.attributes.cx}, ${g.attributes.cy}), Radius: ${g.attributes.r}`);
    }
    console.log('');
  });

  console.log('📊 SECTION OVERLAPS:\n');
  gradientAnalysis.overlaps.forEach(o => {
    const status = o.overlap > 0 ? '✅' : '❌';
    console.log(`${status} ${o.between}:`);
    console.log(`   Overlap: ${o.overlap}px`);
    console.log(`   Junction: ${o.left} → ${o.right}`);
    console.log('');
  });

  console.log('========================================');
  console.log('RESULTS');
  console.log('========================================\n');

  const allLinear = gradientAnalysis.gradients.every(g => g.type === 'linearGradient');
  const allVertical = gradientAnalysis.gradients.every(g =>
    g.type === 'linearGradient' && g.attributes.y2 === '100%'
  );
  const allOverlapping = gradientAnalysis.overlaps.every(o => o.overlap > 0);

  if (allLinear) {
    console.log('✅ All gradients converted to linearGradient');
  } else {
    console.log('❌ Some gradients still radial');
  }

  if (allVertical) {
    console.log('✅ All gradients are vertical (top-to-bottom)');
  }

  if (allOverlapping) {
    console.log('✅ All sections overlap - gradients should blend seamlessly');
  } else {
    console.log('❌ Some sections have gaps');
  }

  console.log('\n💡 Linear gradients flow consistently across overlapping sections,');
  console.log('   eliminating the visible seams that radial gradients created.');

  console.log('\n⏸️  Pausing for visual inspection...');
  console.log('   Check COMPLETED and IN PROGRESS buttons for gradient continuity');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Gradient verification complete!');
})();
