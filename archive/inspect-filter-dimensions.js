const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000); // Wait for animations

  console.log('\n========================================');
  console.log('FILTER BUTTON MEASUREMENTS');
  console.log('========================================');

  const filterData = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    const btn = document.querySelector('.new-filter-btn');
    const borderContainer = document.querySelector('.timeline-border-container');

    if (!container || !btn || !borderContainer) {
      return { error: 'Elements not found' };
    }

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const borderRect = borderContainer.getBoundingClientRect();

    const containerStyle = window.getComputedStyle(container);
    const btnStyle = window.getComputedStyle(btn);
    const borderStyle = window.getComputedStyle(borderContainer);

    return {
      filterContainer: {
        top: containerStyle.top,
        left: containerStyle.left,
        width: containerRect.width,
        height: containerRect.height,
        position: containerStyle.position,
        transform: containerStyle.transform
      },
      filterButton: {
        width: btnRect.width,
        height: btnRect.height,
        padding: btnStyle.padding,
        border: btnStyle.border,
        borderRadius: btnStyle.borderRadius,
        actualHeight: btnRect.height,
        computedHeight: btnStyle.height
      },
      borderContainer: {
        width: borderRect.width,
        borderTop: borderStyle.borderTop,
        paddingTop: borderStyle.paddingTop,
        position: 'relative to viewport:',
        top: borderRect.top
      },
      calculations: {
        buttonHalfHeight: btnRect.height / 2,
        suggestedTopPosition: -(btnRect.height / 2),
        borderSegmentWidth: (borderRect.width - btnRect.width) / 2
      }
    };
  });

  console.log(JSON.stringify(filterData, null, 2));

  console.log('\n========================================');
  console.log('BORDER SEGMENTS (::before/::after)');
  console.log('========================================');

  const segmentData = await page.evaluate(() => {
    const border = document.querySelector('.timeline-border-container');
    if (!border) return { error: 'Border not found' };

    const before = window.getComputedStyle(border, '::before');
    const after = window.getComputedStyle(border, '::after');

    return {
      before: {
        width: before.width,
        height: before.height,
        top: before.top,
        left: before.left,
        borderTop: before.borderTop,
        borderLeft: before.borderLeft
      },
      after: {
        width: after.width,
        height: after.height,
        top: after.top,
        right: after.right,
        borderTop: after.borderTop,
        borderRight: after.borderRight
      }
    };
  });

  console.log(JSON.stringify(segmentData, null, 2));

  console.log('\n========================================');
  console.log('RECOMMENDATIONS');
  console.log('========================================');

  if (filterData.calculations) {
    console.log(`Button height: ${filterData.filterButton.height}px`);
    console.log(`Half height: ${filterData.calculations.buttonHalfHeight}px`);
    console.log(`Suggested top position: ${filterData.calculations.suggestedTopPosition}px`);
    console.log(`Border segment width should be: calc(50% - ${filterData.calculations.borderSegmentWidth}px)`);
  }

  await browser.close();
  console.log('\n✅ Inspection complete!');
})();
