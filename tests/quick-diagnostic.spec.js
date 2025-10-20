const { test } = require('@playwright/test');

test('Quick diagnostic', async ({ page }) => {
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  const data = await page.evaluate(() => {
    const filterEl = document.getElementById('new-filter-container');
    const borderEl = document.querySelector('.border-svg');

    if (!filterEl || !borderEl) {
      return { error: 'Elements not found', filterEl: !!filterEl, borderEl: !!borderEl };
    }

    const filterStyles = window.getComputedStyle(filterEl);
    const borderStyles = window.getComputedStyle(borderEl);
    const filterRect = filterEl.getBoundingClientRect();
    const borderRect = borderEl.getBoundingClientRect();

    return {
      className: filterEl.className,
      matchesSelector: filterEl.matches('.new-filter-container'),
      filterComputedTop: filterStyles.top,
      borderComputedTop: borderStyles.top,
      filterBoundingTop: filterRect.top,
      borderBoundingTop: borderRect.top,
      gap: filterRect.top - borderRect.top,
      inlineStyle: filterEl.getAttribute('style'),
      cssRules: Array.from(document.styleSheets).flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules).filter(rule => {
            return rule.style && rule.selectorText && filterEl.matches(rule.selectorText) && rule.style.top;
          }).map(rule => ({
            selector: rule.selectorText,
            top: rule.style.top
          }));
        } catch (e) {
          return [];
        }
      })
    };
  });

  console.log('\n=== DIAGNOSTIC RESULTS ===');
  console.log(JSON.stringify(data, null, 2));
  console.log('=== END ===\n');

  const timestamp = Date.now();
  await page.screenshot({ path: `test-results/diagnostic-${timestamp}.png` });
  console.log(`Screenshot: test-results/diagnostic-${timestamp}.png`);
});
