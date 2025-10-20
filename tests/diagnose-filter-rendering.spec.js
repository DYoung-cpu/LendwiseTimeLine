const { test, expect } = require('@playwright/test');

test('Diagnose filter button SVG gradient rendering issues', async ({ page }) => {
  // Navigate and wait for page load
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(5000); // Wait for animations and JS initialization

  const timestamp = Date.now();

  console.log('\n========== FILTER BUTTON RENDERING DIAGNOSTIC ==========\n');

  // STEP 1: Check if SVG gradient elements are present in DOM
  const svgGradientCheck = await page.evaluate(() => {
    const filterGradient = document.querySelector('#filterGradient');
    const inProgressGradient = document.querySelector('#inProgressGradient');
    const futureGradient = document.querySelector('#futureGradient');
    const filterSections = document.querySelector('#filter-sections');
    const filterSectionsPath = document.querySelector('#filter-sections path');

    return {
      filterGradient: {
        exists: !!filterGradient,
        id: filterGradient?.id,
        stops: filterGradient ? filterGradient.querySelectorAll('stop').length : 0
      },
      inProgressGradient: {
        exists: !!inProgressGradient,
        id: inProgressGradient?.id,
        stops: inProgressGradient ? inProgressGradient.querySelectorAll('stop').length : 0
      },
      futureGradient: {
        exists: !!futureGradient,
        id: futureGradient?.id,
        stops: futureGradient ? futureGradient.querySelectorAll('stop').length : 0
      },
      filterSections: {
        exists: !!filterSections,
        childCount: filterSections?.children.length || 0
      },
      filterSectionsPath: {
        exists: !!filterSectionsPath,
        fillAttribute: filterSectionsPath?.getAttribute('fill'),
        dAttribute: filterSectionsPath?.getAttribute('d')?.substring(0, 50) + '...'
      }
    };
  });

  console.log('SVG GRADIENT CHECK:', JSON.stringify(svgGradientCheck, null, 2));

  // STEP 2: Check computed styles and visibility
  const visibilityCheck = await page.evaluate(() => {
    const filterSectionsPath = document.querySelector('#filter-sections path');
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterContainer = document.querySelector('.new-filter-container');
    const borderSvg = document.querySelector('.border-svg');

    const getComputedStyles = (el) => {
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        position: styles.position,
        top: styles.top,
        left: styles.left,
        width: styles.width,
        height: styles.height,
        background: styles.background,
        backgroundColor: styles.backgroundColor
      };
    };

    return {
      filterSectionsPath: getComputedStyles(filterSectionsPath),
      filterBtn: getComputedStyles(filterBtn),
      filterContainer: getComputedStyles(filterContainer),
      borderSvg: getComputedStyles(borderSvg)
    };
  });

  console.log('\nCOMPUTED STYLES CHECK:', JSON.stringify(visibilityCheck, null, 2));

  // STEP 3: Check element positions and layering
  const positionCheck = await page.evaluate(() => {
    const filterSectionsPath = document.querySelector('#filter-sections path');
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterContainer = document.querySelector('.new-filter-container');
    const filterText = document.querySelector('.new-filter-btn span');

    const getRect = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    };

    return {
      filterSectionsPath: getRect(filterSectionsPath),
      filterBtn: getRect(filterBtn),
      filterContainer: getRect(filterContainer),
      filterText: getRect(filterText),
      alignment: {
        svgPathTop: filterSectionsPath ? filterSectionsPath.getBoundingClientRect().top : null,
        htmlBtnTop: filterBtn ? filterBtn.getBoundingClientRect().top : null,
        containerTop: filterContainer ? filterContainer.getBoundingClientRect().top : null,
        gap: (filterBtn && filterSectionsPath) ?
          Math.abs(filterBtn.getBoundingClientRect().top - filterSectionsPath.getBoundingClientRect().top) : null
      }
    };
  });

  console.log('\nPOSITION AND ALIGNMENT CHECK:', JSON.stringify(positionCheck, null, 2));

  // STEP 4: Check if HTML button is covering SVG gradient
  const layeringCheck = await page.evaluate(() => {
    const filterSectionsPath = document.querySelector('#filter-sections path');
    const filterBtn = document.querySelector('.new-filter-btn');

    if (!filterSectionsPath || !filterBtn) {
      return { error: 'Elements not found' };
    }

    const svgRect = filterSectionsPath.getBoundingClientRect();
    const btnRect = filterBtn.getBoundingClientRect();

    // Check if button is covering the SVG
    const svgCenterX = svgRect.left + svgRect.width / 2;
    const svgCenterY = svgRect.top + svgRect.height / 2;

    // Get element at SVG center point
    const elementAtSvgCenter = document.elementFromPoint(svgCenterX, svgCenterY);
    const isSvgCovered = elementAtSvgCenter !== filterSectionsPath;

    return {
      svgCenter: { x: svgCenterX, y: svgCenterY },
      elementAtSvgCenter: {
        tag: elementAtSvgCenter?.tagName,
        class: elementAtSvgCenter?.className,
        id: elementAtSvgCenter?.id
      },
      isSvgCovered: isSvgCovered,
      svgZIndex: window.getComputedStyle(filterSectionsPath.parentElement.parentElement).zIndex,
      btnZIndex: window.getComputedStyle(filterBtn.parentElement).zIndex,
      overlapping: {
        svgRect: { top: svgRect.top, left: svgRect.left, width: svgRect.width, height: svgRect.height },
        btnRect: { top: btnRect.top, left: btnRect.left, width: btnRect.width, height: btnRect.height }
      }
    };
  });

  console.log('\nLAYERING CHECK (Z-INDEX):', JSON.stringify(layeringCheck, null, 2));

  // STEP 5: Check if filter text is in correct parent
  const textLocationCheck = await page.evaluate(() => {
    const filterBtn = document.querySelector('.new-filter-btn');
    const filterText = document.querySelector('.new-filter-btn span');
    const filterContainer = document.querySelector('.new-filter-container');

    if (!filterBtn || !filterText) {
      return { error: 'Elements not found' };
    }

    return {
      filterText: {
        parentTag: filterText.parentElement?.tagName,
        parentClass: filterText.parentElement?.className,
        textContent: filterText.textContent,
        position: {
          top: filterText.getBoundingClientRect().top,
          left: filterText.getBoundingClientRect().left
        }
      },
      filterBtn: {
        position: {
          top: filterBtn.getBoundingClientRect().top,
          left: filterBtn.getBoundingClientRect().left
        },
        childrenCount: filterBtn.children.length
      },
      isTextInsideButton: filterBtn.contains(filterText),
      containerChildren: Array.from(filterContainer?.children || []).map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id
      }))
    };
  });

  console.log('\nTEXT LOCATION CHECK:', JSON.stringify(textLocationCheck, null, 2));

  // STEP 6: Check SVG rendering
  const svgRenderCheck = await page.evaluate(() => {
    const borderSvg = document.querySelector('.border-svg');
    const filterSections = document.querySelector('#filter-sections');
    const filterSectionsPath = document.querySelector('#filter-sections path');

    return {
      borderSvg: {
        exists: !!borderSvg,
        tagName: borderSvg?.tagName,
        viewBox: borderSvg?.getAttribute('viewBox'),
        width: borderSvg?.getAttribute('width'),
        height: borderSvg?.getAttribute('height')
      },
      filterSections: {
        exists: !!filterSections,
        tagName: filterSections?.tagName,
        innerHTML: filterSections?.innerHTML.substring(0, 200) + '...'
      },
      filterSectionsPath: {
        exists: !!filterSectionsPath,
        fill: filterSectionsPath?.getAttribute('fill'),
        stroke: filterSectionsPath?.getAttribute('stroke'),
        strokeWidth: filterSectionsPath?.getAttribute('stroke-width'),
        pathData: filterSectionsPath?.getAttribute('d')?.substring(0, 100) + '...'
      }
    };
  });

  console.log('\nSVG RENDERING CHECK:', JSON.stringify(svgRenderCheck, null, 2));

  // STEP 7: Capture screenshot for visual analysis
  await page.screenshot({
    path: `test-results/filter-diagnostic-${timestamp}.png`,
    fullPage: false
  });

  console.log('\n✅ Screenshot saved: test-results/filter-diagnostic-' + timestamp + '.png');

  // STEP 8: Capture close-up screenshot of filter button area
  const filterBtn = await page.locator('.new-filter-btn');
  await filterBtn.screenshot({
    path: `test-results/filter-button-closeup-${timestamp}.png`
  });

  console.log('✅ Close-up screenshot saved: test-results/filter-button-closeup-' + timestamp + '.png');

  // STEP 9: Analyze and report
  console.log('\n========== DIAGNOSTIC SUMMARY ==========\n');

  const issues = [];

  if (!svgGradientCheck.filterSectionsPath.exists) {
    issues.push('❌ CRITICAL: SVG path in #filter-sections not found - gradient won\'t render');
  } else if (svgGradientCheck.filterSectionsPath.fillAttribute !== 'url(#filterGradient)') {
    issues.push(`❌ CRITICAL: SVG path fill is "${svgGradientCheck.filterSectionsPath.fillAttribute}" instead of "url(#filterGradient)"`);
  }

  if (visibilityCheck.filterSectionsPath?.display === 'none') {
    issues.push('❌ CRITICAL: SVG path has display: none');
  }

  if (visibilityCheck.filterSectionsPath?.visibility === 'hidden') {
    issues.push('❌ CRITICAL: SVG path has visibility: hidden');
  }

  if (visibilityCheck.filterSectionsPath?.opacity === '0') {
    issues.push('❌ CRITICAL: SVG path has opacity: 0');
  }

  if (layeringCheck.isSvgCovered) {
    issues.push(`❌ CRITICAL: HTML button is covering SVG gradient (element at SVG center: ${layeringCheck.elementAtSvgCenter?.tag}.${layeringCheck.elementAtSvgCenter?.class})`);
  }

  if (positionCheck.alignment.gap && positionCheck.alignment.gap > 2) {
    issues.push(`❌ Filter button misaligned by ${positionCheck.alignment.gap}px`);
  }

  if (!textLocationCheck.isTextInsideButton) {
    issues.push('❌ CRITICAL: Filter text is NOT inside button element');
  }

  if (visibilityCheck.filterBtn?.background !== 'transparent' &&
      visibilityCheck.filterBtn?.background !== 'rgba(0, 0, 0, 0)' &&
      visibilityCheck.filterBtn?.background !== 'none') {
    issues.push(`⚠️  WARNING: Filter button has background: ${visibilityCheck.filterBtn?.background} (should be transparent)`);
  }

  if (issues.length === 0) {
    console.log('✅ No obvious rendering issues detected');
    console.log('   SVG gradients present: YES');
    console.log('   SVG path visible: YES');
    console.log('   HTML button transparent: YES');
    console.log('   Text inside button: YES');
    console.log('   Alignment: GOOD (gap: ' + (positionCheck.alignment.gap || 0) + 'px)');
  } else {
    console.log('⚠️  ISSUES FOUND:\n');
    issues.forEach(issue => console.log('   ' + issue));
  }

  console.log('\n========================================\n');
  console.log('Screenshots available for visual inspection:');
  console.log('  - test-results/filter-diagnostic-' + timestamp + '.png');
  console.log('  - test-results/filter-button-closeup-' + timestamp + '.png');
  console.log('\n========================================\n');

  // Return diagnostic data
  const diagnosticData = {
    timestamp,
    svgGradients: svgGradientCheck,
    computedStyles: visibilityCheck,
    positions: positionCheck,
    layering: layeringCheck,
    textLocation: textLocationCheck,
    svgRendering: svgRenderCheck,
    issues: issues,
    screenshots: [
      `test-results/filter-diagnostic-${timestamp}.png`,
      `test-results/filter-button-closeup-${timestamp}.png`
    ]
  };

  console.log('FULL DIAGNOSTIC DATA:', JSON.stringify(diagnosticData, null, 2));
});
