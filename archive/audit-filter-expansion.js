const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,  // Browser stays open so we can see what happens
    slowMo: 500       // Slow down actions so we can observe
  });

  const page = await browser.newPage();

  // Disable cache to ensure fresh load
  await page.route('**/*', (route) => route.continue({
    headers: { ...route.request().headers(), 'Cache-Control': 'no-cache' }
  }));

  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(2000); // Wait for page to fully load

  console.log('\n=== FILTER EXPANSION AUDIT ===\n');

  // 1. CHECK INITIAL DOM STATE
  console.log('1. INITIAL DOM STATE:');
  const initialState = await page.evaluate(() => {
    const mainBtn = document.getElementById('main-filter-btn');
    const container = document.getElementById('new-filter-container');
    const leftOptions = document.getElementById('filter-options-left');
    const rightOptions = document.getElementById('filter-options-right');
    const filterBtns = document.querySelectorAll('.filter-option-btn');

    return {
      mainBtn: {
        exists: !!mainBtn,
        classes: mainBtn?.className,
        computedDisplay: mainBtn ? window.getComputedStyle(mainBtn).display : null,
        clickable: mainBtn ? true : false
      },
      container: {
        exists: !!container,
        inlineStyle: container?.getAttribute('style'),
        classes: container?.className,
        computedDisplay: container ? window.getComputedStyle(container).display : null
      },
      leftOptions: {
        exists: !!leftOptions,
        classes: leftOptions?.className,
        computedDisplay: leftOptions ? window.getComputedStyle(leftOptions).display : null
      },
      rightOptions: {
        exists: !!rightOptions,
        classes: rightOptions?.className,
        computedDisplay: rightOptions ? window.getComputedStyle(rightOptions).display : null
      },
      filterButtons: {
        count: filterBtns.length,
        buttons: Array.from(filterBtns).map(btn => ({
          text: btn.textContent,
          value: btn.getAttribute('data-value'),
          visible: window.getComputedStyle(btn).display !== 'none'
        }))
      }
    };
  });

  console.log(JSON.stringify(initialState, null, 2));

  // 2. CHECK CLICK HANDLER (skipping getEventListeners - not available in Playwright)
  console.log('\n2. CLICK HANDLER: Attached via JavaScript in page');

  // 3. SIMULATE CLICK AND OBSERVE CHANGES
  console.log('\n3. CLICKING FILTER BUTTON...');
  await page.click('#main-filter-btn');
  await page.waitForTimeout(1000); // Wait for animations

  // 4. CHECK STATE AFTER CLICK
  console.log('\n4. STATE AFTER CLICK:');
  const afterClickState = await page.evaluate(() => {
    const mainBtn = document.getElementById('main-filter-btn');
    const container = document.getElementById('new-filter-container');
    const leftOptions = document.getElementById('filter-options-left');
    const rightOptions = document.getElementById('filter-options-right');
    const borderContainer = document.querySelector('.timeline-border-container');

    return {
      container: {
        classes: container?.className,
        inlineStyle: container?.getAttribute('style'),
        computedDisplay: container ? window.getComputedStyle(container).display : null,
        hasExpandedClass: container?.classList.contains('filter-expanded')
      },
      borderContainer: {
        hasExpandedClass: borderContainer?.classList.contains('filter-expanded')
      },
      leftOptions: {
        classes: leftOptions?.className,
        computedDisplay: leftOptions ? window.getComputedStyle(leftOptions).display : null,
        computedOpacity: leftOptions ? window.getComputedStyle(leftOptions).opacity : null,
        hasVisibleClass: leftOptions?.classList.contains('visible')
      },
      rightOptions: {
        classes: rightOptions?.className,
        computedDisplay: rightOptions ? window.getComputedStyle(rightOptions).display : null,
        computedOpacity: rightOptions ? window.getComputedStyle(rightOptions).opacity : null,
        hasVisibleClass: rightOptions?.classList.contains('visible')
      }
    };
  });

  console.log(JSON.stringify(afterClickState, null, 2));

  // 5. CHECK FILTER BUTTON VISIBILITY AFTER CLICK
  console.log('\n5. FILTER BUTTONS VISIBILITY AFTER CLICK:');
  const filterBtnVisibility = await page.evaluate(() => {
    const filterBtns = document.querySelectorAll('.filter-option-btn');
    return Array.from(filterBtns).map(btn => ({
      text: btn.textContent,
      computedDisplay: window.getComputedStyle(btn).display,
      computedOpacity: window.getComputedStyle(btn).opacity,
      boundingRect: {
        width: btn.getBoundingClientRect().width,
        height: btn.getBoundingClientRect().height,
        top: btn.getBoundingClientRect().top,
        left: btn.getBoundingClientRect().left
      }
    }));
  });

  console.log(JSON.stringify(filterBtnVisibility, null, 2));

  // 6. DIAGNOSIS
  console.log('\n6. DIAGNOSIS:');
  const diagnosis = await page.evaluate(() => {
    const container = document.getElementById('new-filter-container');
    const inlineStyle = container?.getAttribute('style');
    const hasInlineDisplayNone = inlineStyle?.includes('display: none');

    return {
      problem: hasInlineDisplayNone ?
        'FOUND ISSUE: Container has inline style="display: none;" which overrides CSS classes' :
        'No obvious inline style blocking',
      inlineStyle: inlineStyle,
      recommendation: hasInlineDisplayNone ?
        'Remove inline style and use CSS class to control visibility' :
        'Further investigation needed'
    };
  });

  console.log(JSON.stringify(diagnosis, null, 2));

  console.log('\n=== AUDIT COMPLETE ===');
  console.log('Browser will stay open for 30 seconds for visual inspection...\n');

  await page.waitForTimeout(30000);
  await browser.close();
})();
