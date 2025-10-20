const { test, expect } = require('@playwright/test');

test('Comprehensive diagnostic - Find what blocks CSS changes', async ({ page }) => {
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(5000); // Wait for all animations

  const timestamp = Date.now();

  console.log('=== COMPREHENSIVE DIAGNOSTIC ===\n');

  // STEP 1: Check what CSS files are loaded
  const loadedStyles = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return links.map(link => ({
      href: link.href,
      loaded: link.sheet !== null
    }));
  });

  console.log('1. LOADED CSS FILES:');
  loadedStyles.forEach((link, i) => {
    console.log(`   ${i + 1}. ${link.href} ${link.loaded ? '✓ Loaded' : '✗ Failed'}`);
  });

  // STEP 2: Check element existence and inline styles
  const elementCheck = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    const button = document.querySelector('.new-filter-btn');
    const borderSvg = document.querySelector('.border-svg');

    const getElementInfo = (el, name) => {
      if (!el) return { name, exists: false };
      return {
        name,
        exists: true,
        inlineStyle: el.getAttribute('style'),
        hasInlineTop: el.style.top !== '',
        inlineTopValue: el.style.top || null,
        className: el.className,
        id: el.id
      };
    };

    return {
      container: getElementInfo(container, '.new-filter-container'),
      button: getElementInfo(button, '.new-filter-btn'),
      borderSvg: getElementInfo(borderSvg, '.border-svg')
    };
  });

  console.log('\n2. ELEMENT CHECK & INLINE STYLES:');
  Object.values(elementCheck).forEach(el => {
    console.log(`   ${el.name}:`);
    console.log(`     Exists: ${el.exists ? '✓' : '✗'}`);
    if (el.exists) {
      console.log(`     Class: "${el.className}"`);
      console.log(`     ID: "${el.id || 'none'}"`);
      console.log(`     Inline style: ${el.inlineStyle || 'none'}`);
      console.log(`     Inline top: ${el.hasInlineTop ? el.inlineTopValue : 'none'}`);
    }
  });

  // STEP 3: Check computed styles vs CSS file values
  const styleComparison = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    const borderSvg = document.querySelector('.border-svg');

    if (!container || !borderSvg) return null;

    const containerComputed = window.getComputedStyle(container);
    const borderComputed = window.getComputedStyle(borderSvg);

    // Find which CSS rule is being applied
    const getRuleSource = (element, property) => {
      const sheets = Array.from(document.styleSheets);
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          for (const rule of rules) {
            if (rule.style && rule.selectorText && element.matches(rule.selectorText)) {
              const value = rule.style.getPropertyValue(property);
              if (value) {
                return {
                  selector: rule.selectorText,
                  value: value,
                  source: sheet.href || 'inline',
                  important: rule.style.getPropertyPriority(property) === 'important'
                };
              }
            }
          }
        } catch (e) {
          // CORS or other error, skip
        }
      }
      return null;
    };

    return {
      container: {
        computedTop: containerComputed.top,
        computedPosition: containerComputed.position,
        computedTransform: containerComputed.transform,
        computedZIndex: containerComputed.zIndex,
        topRuleSource: getRuleSource(container, 'top')
      },
      borderSvg: {
        computedTop: borderComputed.top,
        computedHeight: borderComputed.height,
        topRuleSource: getRuleSource(borderSvg, 'top')
      }
    };
  });

  console.log('\n3. COMPUTED STYLES & CSS SOURCE:');
  if (styleComparison) {
    console.log('   .new-filter-container:');
    console.log(`     Computed top: ${styleComparison.container.computedTop}`);
    console.log(`     Computed position: ${styleComparison.container.computedPosition}`);
    console.log(`     Computed transform: ${styleComparison.container.computedTransform}`);
    console.log(`     Computed z-index: ${styleComparison.container.computedZIndex}`);
    if (styleComparison.container.topRuleSource) {
      console.log(`     Top value source:`);
      console.log(`       Selector: ${styleComparison.container.topRuleSource.selector}`);
      console.log(`       Value: ${styleComparison.container.topRuleSource.value}`);
      console.log(`       From: ${styleComparison.container.topRuleSource.source}`);
      console.log(`       !important: ${styleComparison.container.topRuleSource.important ? 'yes' : 'no'}`);
    }

    console.log('\n   .border-svg:');
    console.log(`     Computed top: ${styleComparison.borderSvg.computedTop}`);
    console.log(`     Computed height: ${styleComparison.borderSvg.computedHeight}`);
    if (styleComparison.borderSvg.topRuleSource) {
      console.log(`     Top value source:`);
      console.log(`       Selector: ${styleComparison.borderSvg.topRuleSource.selector}`);
      console.log(`       Value: ${styleComparison.borderSvg.topRuleSource.value}`);
      console.log(`       From: ${styleComparison.borderSvg.topRuleSource.source}`);
    }
  }

  // STEP 4: Check bounding boxes and visual positions
  const positions = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    const borderSvg = document.querySelector('.border-svg');
    const borderContainer = document.querySelector('.border-container');
    const timeline = document.querySelector('.timeline-main-line');

    const getRect = (el) => el ? el.getBoundingClientRect() : null;

    return {
      container: getRect(container),
      borderSvg: getRect(borderSvg),
      borderContainer: getRect(borderContainer),
      timeline: getRect(timeline)
    };
  });

  console.log('\n4. VISUAL POSITIONS (BOUNDING BOXES):');
  Object.entries(positions).forEach(([name, rect]) => {
    if (rect) {
      console.log(`   ${name}:`);
      console.log(`     Top: ${rect.top}px`);
      console.log(`     Left: ${rect.left}px`);
      console.log(`     Width: ${rect.width}px`);
      console.log(`     Height: ${rect.height}px`);
    }
  });

  // STEP 5: Calculate gaps
  if (positions.container && positions.borderSvg) {
    const gap = positions.container.top - positions.borderSvg.top;
    console.log('\n5. GAP ANALYSIS:');
    console.log(`   Filter container top: ${positions.container.top}px`);
    console.log(`   Border SVG top: ${positions.borderSvg.top}px`);
    console.log(`   Gap: ${gap}px`);
    console.log(`   Status: ${Math.abs(gap) < 2 ? '✓ ALIGNED' : '✗ MISALIGNED'}`);
  }

  // STEP 6: Take annotated screenshot
  await page.screenshot({
    path: `test-results/blocker-diagnostic-${timestamp}.png`,
    fullPage: false
  });

  console.log(`\n6. SCREENSHOT: test-results/blocker-diagnostic-${timestamp}.png`);

  // STEP 7: Check for JavaScript modifications
  const jsCheck = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    if (!container) return null;

    // Check for mutation observers or event listeners
    return {
      hasDataAttributes: Object.keys(container.dataset).length > 0,
      dataAttributes: { ...container.dataset },
      eventListeners: Object.keys(container).filter(k => k.startsWith('on')).length
    };
  });

  console.log('\n7. JAVASCRIPT INTERFERENCE CHECK:');
  if (jsCheck) {
    console.log(`   Data attributes: ${jsCheck.hasDataAttributes ? JSON.stringify(jsCheck.dataAttributes) : 'none'}`);
    console.log(`   Event listeners: ${jsCheck.eventListeners} found`);
  }

  // STEP 8: Final diagnosis
  console.log('\n=== DIAGNOSIS ===');

  if (elementCheck.container?.hasInlineTop) {
    console.log('⚠️  BLOCKER FOUND: Inline style on element overriding CSS');
    console.log(`   Inline top value: ${elementCheck.container.inlineTopValue}`);
  } else if (!styleComparison) {
    console.log('⚠️  BLOCKER FOUND: Element not found or styles not computed');
  } else if (styleComparison.container.topRuleSource?.value !== '-35px') {
    console.log('⚠️  BLOCKER FOUND: Wrong CSS rule being applied');
    console.log(`   Expected: top: -35px`);
    console.log(`   Actual: ${styleComparison.container.topRuleSource?.value || 'none'}`);
    console.log(`   Source: ${styleComparison.container.topRuleSource?.source || 'unknown'}`);
  } else {
    console.log('✓ CSS is correct and applied');
    console.log(`✓ Computed top: ${styleComparison.container.computedTop}`);
    if (positions.container && positions.borderSvg) {
      const gap = Math.abs(positions.container.top - positions.borderSvg.top);
      if (gap >= 2) {
        console.log(`⚠️  Issue: Visual gap exists (${gap}px) despite correct CSS`);
        console.log('   Possible causes: transform, parent positioning, or border issue');
      }
    }
  }
});
