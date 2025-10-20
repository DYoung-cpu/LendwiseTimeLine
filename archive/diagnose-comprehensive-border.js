const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  // Expand filter to see all sections
  console.log('🖱️ Expanding filter...');
  await page.click('.new-filter-btn');
  await page.waitForTimeout(700);

  console.log('\n========================================');
  console.log('COMPREHENSIVE BORDER & GRADIENT AUDIT');
  console.log('========================================\n');

  const analysis = await page.evaluate(() => {
    const borderPath = document.getElementById('border-path');
    const filterSections = document.getElementById('filter-sections');
    const borderSvg = document.getElementById('border-svg');

    if (!borderPath || !filterSections || !borderSvg) {
      return { error: 'Elements not found' };
    }

    // Analyze border path
    const borderPathD = borderPath.getAttribute('d');
    const borderStyle = window.getComputedStyle(borderPath);

    // Analyze filter section paths
    const sectionPaths = Array.from(filterSections.querySelectorAll('path'));
    const sections = sectionPaths.map((path, index) => {
      const pathD = path.getAttribute('d');
      const fill = path.getAttribute('fill');
      const stroke = path.getAttribute('stroke');
      const strokeWidth = path.getAttribute('stroke-width');
      const bbox = path.getBBox();
      const rect = path.getBoundingClientRect();

      return {
        index,
        bbox: {
          x: Math.round(bbox.x * 10) / 10,
          y: Math.round(bbox.y * 10) / 10,
          width: Math.round(bbox.width * 10) / 10,
          height: Math.round(bbox.height * 10) / 10
        },
        screen: {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        },
        fill,
        stroke,
        strokeWidth,
        pathLength: pathD ? pathD.length : 0
      };
    });

    // Check for gaps between sections
    const gaps = [];
    for (let i = 0; i < sections.length - 1; i++) {
      const current = sections[i];
      const next = sections[i + 1];
      const gapSize = Math.round(next.screen.left - current.screen.right);

      if (Math.abs(gapSize) > 0) {
        gaps.push({
          between: `Section ${i} and ${i + 1}`,
          gapSize: gapSize,
          currentRight: current.screen.right,
          nextLeft: next.screen.left
        });
      }
    }

    // Analyze border path geometry near filter button
    const pathSegments = borderPathD.split('M').filter(s => s.trim());

    return {
      borderPath: {
        d: borderPathD,
        segments: pathSegments.length,
        stroke: borderStyle.stroke,
        strokeWidth: borderStyle.strokeWidth,
        strokeLinecap: borderStyle.strokeLinecap,
        strokeLinejoin: borderStyle.strokeLinejoin
      },
      filterSections: sections,
      gaps,
      totalSections: sections.length
    };
  });

  if (analysis.error) {
    console.log('❌ ERROR:', analysis.error);
    await browser.close();
    return;
  }

  console.log('📊 BORDER PATH ANALYSIS:\n');
  console.log(`Segments: ${analysis.borderPath.segments}`);
  console.log(`Stroke: ${analysis.borderPath.stroke}`);
  console.log(`Stroke Width: ${analysis.borderPath.strokeWidth}`);
  console.log(`Stroke Linecap: ${analysis.borderPath.strokeLinecap}`);
  console.log(`Stroke Linejoin: ${analysis.borderPath.strokeLinejoin}`);

  console.log('\n📊 FILTER SECTIONS ANALYSIS:\n');
  console.log(`Total sections: ${analysis.totalSections}\n`);

  analysis.filterSections.forEach(section => {
    console.log(`Section ${section.index}:`);
    console.log(`   BBox: x=${section.bbox.x}, width=${section.bbox.width}`);
    console.log(`   Screen: left=${section.screen.left}, right=${section.screen.right}, width=${section.screen.width}`);
    console.log(`   Fill: ${section.fill}`);
    console.log(`   Stroke: ${section.stroke || 'none'}`);
    console.log(`   Stroke Width: ${section.strokeWidth || 'none'}`);
    console.log('');
  });

  console.log('\n========================================');
  console.log('GRADIENT BREAK DETECTION');
  console.log('========================================\n');

  if (analysis.gaps.length > 0) {
    console.log('❌ GAPS FOUND BETWEEN SECTIONS:\n');
    analysis.gaps.forEach(gap => {
      console.log(`${gap.between}:`);
      console.log(`   Gap size: ${gap.gapSize}px`);
      console.log(`   Section ends at: ${gap.currentRight}px`);
      console.log(`   Next section starts at: ${gap.nextLeft}px`);
      console.log('');
    });
  } else {
    console.log('✅ No gaps detected between sections');
  }

  // Check for stroke on sections (should be stroked to prevent seams)
  const sectionsWithoutStroke = analysis.filterSections.filter(s => !s.stroke || s.stroke === 'none');
  if (sectionsWithoutStroke.length > 0) {
    console.log('\n⚠️  SECTIONS WITHOUT STROKE (may cause visible seams):\n');
    sectionsWithoutStroke.forEach(s => {
      console.log(`   Section ${s.index}: no stroke defined`);
    });
  }

  console.log('\n========================================');
  console.log('RECOMMENDED FIXES');
  console.log('========================================\n');

  if (analysis.gaps.length > 0) {
    console.log('FIX FOR GRADIENT BREAKS:');
    console.log('1. Add small overlap between adjacent sections (1-2px)');
    console.log('2. OR add stroke to section paths to cover seams');
    console.log('');
  }

  if (analysis.borderPath.segments > 2) {
    console.log('FIX FOR BORDER FADE:');
    console.log(`Border has ${analysis.borderPath.segments} segments (gap creates visible endpoints)`);
    console.log('1. Extend border path endpoints slightly beyond filter button');
    console.log('2. OR use stroke-linecap: square (already applied)');
    console.log('3. OR increase stroke-width slightly near endpoints');
    console.log('');
  }

  console.log('\n⏸️  Pausing for 5 seconds to inspect visually...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Comprehensive audit complete!');
})();
