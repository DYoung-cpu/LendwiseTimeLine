const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  console.log('\n========================================');
  console.log('ANALYZING BORDER FADE ISSUE');
  console.log('========================================\n');

  const borderAnalysis = await page.evaluate(() => {
    const borderPath = document.getElementById('border-path');
    const borderSvg = document.getElementById('border-svg');
    const filterContainer = document.querySelector('.new-filter-container');

    if (!borderPath || !borderSvg) {
      return { error: 'Border elements not found' };
    }

    const pathStyle = window.getComputedStyle(borderPath);
    const svgStyle = window.getComputedStyle(borderSvg);
    const pathData = borderPath.getAttribute('d');

    // Get all attributes
    const pathAttrs = {};
    for (let attr of borderPath.attributes) {
      pathAttrs[attr.name] = attr.value;
    }

    const svgAttrs = {};
    for (let attr of borderSvg.attributes) {
      svgAttrs[attr.name] = attr.value;
    }

    // Check for gradients or opacity effects
    const defs = borderSvg.querySelector('defs');
    const gradients = defs ? Array.from(defs.querySelectorAll('linearGradient, radialGradient')).map(g => ({
      id: g.id,
      type: g.tagName
    })) : [];

    return {
      path: {
        attributes: pathAttrs,
        computedStyle: {
          stroke: pathStyle.stroke,
          strokeOpacity: pathStyle.strokeOpacity,
          strokeWidth: pathStyle.strokeWidth,
          strokeLinecap: pathStyle.strokeLinecap,
          strokeLinejoin: pathStyle.strokeLinejoin,
          opacity: pathStyle.opacity,
          fill: pathStyle.fill,
          fillOpacity: pathStyle.fillOpacity
        },
        dataLength: pathData ? pathData.length : 0,
        dataSnippet: pathData ? pathData.substring(0, 200) + '...' : 'No path data'
      },
      svg: {
        attributes: svgAttrs,
        computedStyle: {
          opacity: svgStyle.opacity
        }
      },
      gradients: gradients,
      filterContainer: {
        exists: !!filterContainer,
        width: filterContainer ? filterContainer.getBoundingClientRect().width : 0
      }
    };
  });

  if (borderAnalysis.error) {
    console.log('❌ ERROR:', borderAnalysis.error);
  } else {
    console.log('📊 SVG BORDER PATH ANALYSIS:\n');

    console.log('Path Attributes:');
    Object.entries(borderAnalysis.path.attributes).forEach(([key, value]) => {
      if (value.length > 100) {
        console.log(`   ${key}: [${value.length} characters]`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });

    console.log('\nPath Computed Styles:');
    Object.entries(borderAnalysis.path.computedStyle).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log('\nSVG Container:');
    Object.entries(borderAnalysis.svg.computedStyle).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    if (borderAnalysis.gradients.length > 0) {
      console.log('\nGradients Defined:');
      borderAnalysis.gradients.forEach(g => {
        console.log(`   - ${g.id} (${g.type})`);
      });
    }

    console.log('\n========================================');
    console.log('ISSUE DETECTION');
    console.log('========================================\n');

    const issues = [];

    // Check for opacity issues
    if (borderAnalysis.path.computedStyle.strokeOpacity !== '1') {
      issues.push(`❌ Stroke opacity is ${borderAnalysis.path.computedStyle.strokeOpacity} (should be 1)`);
    }

    if (borderAnalysis.path.computedStyle.opacity !== '1') {
      issues.push(`❌ Path opacity is ${borderAnalysis.path.computedStyle.opacity} (should be 1)`);
    }

    // Check stroke color
    if (borderAnalysis.path.computedStyle.stroke.includes('rgba') &&
        !borderAnalysis.path.computedStyle.stroke.includes('rgba(255, 255, 255, 1)')) {
      issues.push(`⚠️  Stroke uses rgba with transparency: ${borderAnalysis.path.computedStyle.stroke}`);
    }

    // Check for gradient references
    if (borderAnalysis.path.attributes.stroke && borderAnalysis.path.attributes.stroke.includes('url(')) {
      issues.push(`⚠️  Stroke references a gradient: ${borderAnalysis.path.attributes.stroke}`);
    }

    if (issues.length > 0) {
      console.log('ISSUES FOUND:\n');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('✅ No obvious opacity/gradient issues found');
      console.log('\nThe fade might be caused by:');
      console.log('1. The SVG path geometry near the filter button gap');
      console.log('2. Anti-aliasing at specific angles');
      console.log('3. Overlapping path segments');
    }

    console.log('\n========================================');
    console.log('RECOMMENDED FIX');
    console.log('========================================\n');

    console.log('Current stroke: ' + borderAnalysis.path.attributes.stroke);
    console.log('Current stroke-width: ' + borderAnalysis.path.attributes['stroke-width']);
    console.log('\nTo fix fading border lines:');
    console.log('1. Ensure stroke has no alpha transparency');
    console.log('2. Check path coordinates near filter button');
    console.log('3. Verify stroke-width is consistent');
  }

  await browser.close();
  console.log('\n✅ Border fade diagnosis complete!');
})();
