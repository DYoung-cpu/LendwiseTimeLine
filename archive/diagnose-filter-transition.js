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
  console.log('FILTER BUTTON - CLOSED STATE');
  console.log('========================================\n');

  const closedState = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    const filterBtn = document.querySelector('.new-filter-btn');

    if (!container || !filterBtn) {
      return { error: 'Elements not found' };
    }

    const containerRect = container.getBoundingClientRect();
    const btnRect = filterBtn.getBoundingClientRect();
    const btnStyle = window.getComputedStyle(filterBtn);
    const containerStyle = window.getComputedStyle(container);

    return {
      container: {
        width: containerRect.width,
        left: containerRect.left,
        right: containerRect.right,
        centerX: containerRect.left + (containerRect.width / 2)
      },
      button: {
        width: btnRect.width,
        left: btnRect.left,
        right: btnRect.right,
        centerX: btnRect.left + (btnRect.width / 2),
        cssLeft: btnStyle.left,
        cssTop: btnStyle.top,
        cssTransform: btnStyle.transform,
        cssWidth: btnStyle.width
      },
      isExpanded: container.classList.contains('filter-expanded')
    };
  });

  console.log('Container:', closedState.container);
  console.log('Button:', closedState.button);
  console.log('Is Expanded:', closedState.isExpanded);
  console.log('Button centered in container:', Math.abs(closedState.button.centerX - closedState.container.centerX) < 2);

  console.log('\n🖱️ Clicking filter button to expand...');
  await page.click('.new-filter-btn');
  await page.waitForTimeout(600); // Wait for expansion animation

  console.log('\n========================================');
  console.log('FILTER BUTTON - EXPANDED STATE');
  console.log('========================================\n');

  const expandedState = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    const filterBtn = document.querySelector('.new-filter-btn');
    const svg = document.getElementById('border-svg');
    const filterSections = document.getElementById('filter-sections');

    if (!container || !filterBtn || !filterSections) {
      return { error: 'Elements not found' };
    }

    const containerRect = container.getBoundingClientRect();
    const btnRect = filterBtn.getBoundingClientRect();
    const btnStyle = window.getComputedStyle(filterBtn);
    const svgRect = svg.getBoundingClientRect();
    const svgPaths = filterSections.querySelectorAll('path');
    const filterPath = svgPaths[3]; // 4th section (Filter)

    let filterSection = null;
    if (filterPath) {
      const pathBBox = filterPath.getBBox();
      const pathCenterX = svgRect.left + pathBBox.x + (pathBBox.width / 2);
      filterSection = {
        bbox: {
          x: pathBBox.x,
          width: pathBBox.width,
          centerX: pathBBox.x + (pathBBox.width / 2)
        },
        screenCenterX: pathCenterX
      };
    }

    return {
      container: {
        width: containerRect.width,
        left: containerRect.left,
        right: containerRect.right,
        centerX: containerRect.left + (containerRect.width / 2)
      },
      button: {
        width: btnRect.width,
        left: btnRect.left,
        right: btnRect.right,
        centerX: btnRect.left + (btnRect.width / 2),
        cssLeft: btnStyle.left,
        cssTop: btnStyle.top,
        cssTransform: btnStyle.transform,
        cssWidth: btnStyle.width
      },
      filterSection,
      isExpanded: container.classList.contains('filter-expanded'),
      offset: filterSection ? Math.round((btnRect.left + (btnRect.width / 2)) - filterSection.screenCenterX) : null
    };
  });

  console.log('Container:', expandedState.container);
  console.log('Button:', expandedState.button);
  console.log('Filter Section:', expandedState.filterSection);
  console.log('Is Expanded:', expandedState.isExpanded);
  if (expandedState.offset !== null) {
    console.log(`Button/Section Offset: ${expandedState.offset}px ${Math.abs(expandedState.offset) < 2 ? '✅' : '❌'}`);
  }

  console.log('\n========================================');
  console.log('ANALYSIS');
  console.log('========================================\n');

  if (expandedState.offset !== null && Math.abs(expandedState.offset) >= 2) {
    console.log('❌ ISSUE DETECTED: Filter button is not centered in its section');
    console.log(`   Offset: ${expandedState.offset}px`);
    console.log(`   Button CSS left: ${expandedState.button.cssLeft}`);
    console.log(`   Button CSS transform: ${expandedState.button.cssTransform}`);
    console.log(`   Expected button center: ${expandedState.filterSection.screenCenterX}px`);
    console.log(`   Actual button center: ${expandedState.button.centerX}px`);

    // Calculate what the CSS should be
    const correctLeft = expandedState.filterSection.bbox.centerX;
    console.log(`\n   RECOMMENDED FIX:`);
    console.log(`   .filter-expanded .new-filter-btn {`);
    console.log(`     left: ${correctLeft}px;`);
    console.log(`     transform: translateX(-50%);`);
    console.log(`   }`);
  } else {
    console.log('✅ Filter button is correctly positioned');
  }

  await page.waitForTimeout(1000);
  await browser.close();
  console.log('\n✅ Diagnosis complete!');
})();
