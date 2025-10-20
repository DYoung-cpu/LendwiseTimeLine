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
  console.log('DEEP DIVE: TIMELINE FRAME HEIGHT');
  console.log('========================================\n');

  const analysis = await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    const borderSvg = document.getElementById('border-svg');
    const filterContainer = document.querySelector('.new-filter-container');
    const timeline = document.querySelector('.timeline-viewport');

    const containerStyle = window.getComputedStyle(borderContainer);
    const containerRect = borderContainer.getBoundingClientRect();

    return {
      borderContainer: {
        // CSS values
        padding: containerStyle.padding,
        paddingTop: containerStyle.paddingTop,
        paddingBottom: containerStyle.paddingBottom,
        paddingLeft: containerStyle.paddingLeft,
        paddingRight: containerStyle.paddingRight,
        margin: containerStyle.margin,
        marginTop: containerStyle.marginTop,
        height: containerStyle.height,

        // Computed measurements
        rect: {
          top: Math.round(containerRect.top),
          bottom: Math.round(containerRect.bottom),
          height: Math.round(containerRect.height),
          width: Math.round(containerRect.width)
        },

        // Inner content
        scrollHeight: borderContainer.scrollHeight,
        clientHeight: borderContainer.clientHeight,
        offsetHeight: borderContainer.offsetHeight
      },
      filterContainer: filterContainer ? {
        top: Math.round(filterContainer.getBoundingClientRect().top),
        bottom: Math.round(filterContainer.getBoundingClientRect().bottom)
      } : null,
      timeline: timeline ? {
        top: Math.round(timeline.getBoundingClientRect().top),
        height: Math.round(timeline.getBoundingClientRect().height)
      } : null
    };
  });

  console.log('📊 TIMELINE BORDER CONTAINER:\n');
  console.log('CSS Padding:');
  console.log(`   Combined: ${analysis.borderContainer.padding}`);
  console.log(`   Top: ${analysis.borderContainer.paddingTop}`);
  console.log(`   Bottom: ${analysis.borderContainer.paddingBottom}`);
  console.log(`   Left: ${analysis.borderContainer.paddingLeft}`);
  console.log(`   Right: ${analysis.borderContainer.paddingRight}`);

  console.log('\nCSS Margin:');
  console.log(`   Combined: ${analysis.borderContainer.margin}`);
  console.log(`   Top: ${analysis.borderContainer.marginTop}`);

  console.log('\nDimensions:');
  console.log(`   CSS Height: ${analysis.borderContainer.height}`);
  console.log(`   Rendered Height: ${analysis.borderContainer.rect.height}px`);
  console.log(`   Offset Height: ${analysis.borderContainer.offsetHeight}px`);
  console.log(`   Client Height: ${analysis.borderContainer.clientHeight}px`);
  console.log(`   Scroll Height: ${analysis.borderContainer.scrollHeight}px`);

  console.log('\nPosition:');
  console.log(`   Top: ${analysis.borderContainer.rect.top}px`);
  console.log(`   Bottom: ${analysis.borderContainer.rect.bottom}px`);
  console.log(`   Width: ${analysis.borderContainer.rect.width}px`);

  if (analysis.filterContainer) {
    console.log('\n📊 FILTER CONTAINER:\n');
    console.log(`   Top: ${analysis.filterContainer.top}px`);
    console.log(`   Bottom: ${analysis.filterContainer.bottom}px`);
  }

  if (analysis.timeline) {
    console.log('\n📊 TIMELINE CONTENT:\n');
    console.log(`   Top: ${analysis.timeline.top}px`);
    console.log(`   Height: ${analysis.timeline.height}px`);
  }

  // Calculate spacing
  const filterToTimeline = analysis.timeline && analysis.filterContainer
    ? analysis.timeline.top - analysis.filterContainer.bottom
    : 'N/A';

  console.log('\n========================================');
  console.log('SPACING ANALYSIS');
  console.log('========================================\n');

  console.log(`Space from Filter to Timeline: ${filterToTimeline}px`);

  const expectedPadding = '24px';
  const actualPaddingTop = analysis.borderContainer.paddingTop;
  const actualPaddingBottom = analysis.borderContainer.paddingBottom;

  console.log(`\nExpected padding: ${expectedPadding}`);
  console.log(`Actual padding top: ${actualPaddingTop} ${actualPaddingTop === expectedPadding ? '✅' : '❌ MISMATCH'}`);
  console.log(`Actual padding bottom: ${actualPaddingBottom} ${actualPaddingBottom === expectedPadding ? '✅' : '❌ MISMATCH'}`);

  // Check for CSS overrides
  console.log('\n========================================');
  console.log('CHECKING FOR CSS CONFLICTS');
  console.log('========================================\n');

  const conflicts = await page.evaluate(() => {
    const container = document.querySelector('.timeline-border-container');
    const allRules = [];

    // Get all stylesheets
    for (let sheet of document.styleSheets) {
      try {
        for (let rule of sheet.cssRules || sheet.rules) {
          if (rule.selectorText && rule.selectorText.includes('timeline-border-container')) {
            const paddingValue = rule.style.padding || rule.style.paddingTop;
            if (paddingValue) {
              allRules.push({
                selector: rule.selectorText,
                padding: paddingValue,
                href: sheet.href || 'inline'
              });
            }
          }
        }
      } catch (e) {
        // CORS or other access issue
      }
    }

    return allRules;
  });

  if (conflicts.length > 0) {
    console.log('CSS Rules affecting padding:\n');
    conflicts.forEach((rule, i) => {
      console.log(`${i + 1}. ${rule.selector}`);
      console.log(`   Padding: ${rule.padding}`);
      console.log(`   Source: ${rule.href}`);
      console.log('');
    });
  } else {
    console.log('No CSS conflicts found');
  }

  console.log('\n⏸️  Pausing for visual inspection...');
  await page.waitForTimeout(3000);

  await browser.close();
  console.log('\n✅ Deep dive complete!');
})();
