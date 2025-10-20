const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  console.log('🖱️ Clicking filter button to expand...');
  await page.click('.new-filter-btn');
  await page.waitForTimeout(600);

  console.log('\n========================================');
  console.log('VERTICAL ALIGNMENT ANALYSIS');
  console.log('========================================\n');

  const alignmentAnalysis = await page.evaluate(() => {
    const buttons = [
      { selector: '.new-filter-btn span', name: 'Filter (span)', parent: '.new-filter-btn' },
      { selector: '.filter-operations', name: 'Operations' },
      { selector: '.filter-tech', name: 'Tech' },
      { selector: '.filter-completed', name: 'Completed' },
      { selector: '.filter-in-progress', name: 'In Progress' },
      { selector: '.filter-future', name: 'Future' }
    ];

    const results = [];

    buttons.forEach(({ selector, name, parent }) => {
      const element = document.querySelector(selector);
      const parentElement = parent ? document.querySelector(parent) : element?.parentElement;

      if (!element || !parentElement) {
        results.push({ name, error: 'Element not found' });
        return;
      }

      const rect = element.getBoundingClientRect();
      const parentRect = parentElement.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const parentStyle = window.getComputedStyle(parentElement);

      // Calculate vertical centering
      const elementCenterY = rect.top + (rect.height / 2);
      const parentCenterY = parentRect.top + (parentRect.height / 2);
      const offsetFromCenter = elementCenterY - parentCenterY;

      results.push({
        name,
        element: {
          top: Math.round(rect.top * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
          centerY: Math.round(elementCenterY * 10) / 10,
          lineHeight: style.lineHeight,
          fontSize: style.fontSize,
          paddingTop: style.paddingTop,
          paddingBottom: style.paddingBottom,
          verticalAlign: style.verticalAlign
        },
        parent: {
          top: Math.round(parentRect.top * 10) / 10,
          height: Math.round(parentRect.height * 10) / 10,
          centerY: Math.round(parentCenterY * 10) / 10,
          display: parentStyle.display,
          alignItems: parentStyle.alignItems,
          paddingTop: parentStyle.paddingTop,
          paddingBottom: parentStyle.paddingBottom
        },
        alignment: {
          offsetFromCenter: Math.round(offsetFromCenter * 10) / 10,
          isCentered: Math.abs(offsetFromCenter) < 1
        }
      });
    });

    return results;
  });

  console.log('Button Text Alignment Report:\n');

  alignmentAnalysis.forEach(button => {
    if (button.error) {
      console.log(`❌ ${button.name}: ${button.error}\n`);
      return;
    }

    const status = button.alignment.isCentered ? '✅' : '⚠️';
    console.log(`${status} ${button.name}`);
    console.log(`   Offset from center: ${button.alignment.offsetFromCenter}px`);
    console.log(`   Element height: ${button.element.height}px`);
    console.log(`   Parent height: ${button.parent.height}px`);
    console.log(`   Line height: ${button.element.lineHeight}`);
    console.log(`   Font size: ${button.element.fontSize}`);
    console.log(`   Parent display: ${button.parent.display}`);
    console.log(`   Parent align-items: ${button.parent.alignItems}`);

    if (!button.alignment.isCentered) {
      const correction = -button.alignment.offsetFromCenter;
      console.log(`   SUGGESTED FIX: Add 'top: ${correction}px' or adjust line-height`);
    }
    console.log('');
  });

  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  const allCentered = alignmentAnalysis.every(b => b.error || b.alignment.isCentered);

  if (allCentered) {
    console.log('✅ All text is properly centered!');
  } else {
    console.log('⚠️ Some text is not centered. Review suggested fixes above.');

    // Find common offset pattern
    const offsets = alignmentAnalysis
      .filter(b => !b.error && !b.alignment.isCentered)
      .map(b => b.alignment.offsetFromCenter);

    if (offsets.length > 0) {
      const avgOffset = offsets.reduce((a, b) => a + b, 0) / offsets.length;
      console.log(`\nAverage offset: ${Math.round(avgOffset * 10) / 10}px`);
      console.log(`This suggests adjusting 'top' by ${Math.round(-avgOffset * 10) / 10}px`);
    }
  }

  await page.waitForTimeout(1000);
  await browser.close();
  console.log('\n✅ Diagnosis complete!');
})();
