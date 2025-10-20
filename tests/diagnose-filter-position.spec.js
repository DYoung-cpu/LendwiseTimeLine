const { test, expect } = require('@playwright/test');

test('Diagnose filter button positioning issue', async ({ page }) => {
  // Navigate to the page
  await page.goto('http://localhost:3005/timeline-dev.html');

  // Wait for page load and filter animation
  await page.waitForTimeout(5000);

  console.log('\n=== DIAGNOSTIC REPORT ===\n');

  // 1. Check actual element class name
  const className = await page.$eval('#new-filter-container', el => el.className);
  console.log('1. Element class name:', className);

  // 2. Check if CSS selector matches
  const matchesSelector = await page.$eval('#new-filter-container', el => {
    return el.matches('.new-filter-container');
  });
  console.log('2. Does .new-filter-container selector match?', matchesSelector);

  // 3. Get computed top value for filter container
  const filterComputedTop = await page.$eval('#new-filter-container', el => {
    const styles = window.getComputedStyle(el);
    return {
      top: styles.top,
      position: styles.position,
      transform: styles.transform,
      opacity: styles.opacity,
      display: styles.display
    };
  });
  console.log('3. Filter container computed styles:', filterComputedTop);

  // 4. Get border SVG computed top
  const borderComputedTop = await page.$eval('.border-svg', el => {
    const styles = window.getComputedStyle(el);
    return {
      top: styles.top,
      height: styles.height,
      position: styles.position
    };
  });
  console.log('4. Border SVG computed styles:', borderComputedTop);

  // 5. Get actual bounding box positions
  const filterBox = await page.$eval('#new-filter-container', el => {
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  });
  console.log('5. Filter container bounding box:', filterBox);

  const borderBox = await page.$eval('.border-svg', el => {
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  });
  console.log('6. Border SVG bounding box:', borderBox);

  // 6. Check for inline styles
  const inlineStyle = await page.$eval('#new-filter-container', el => el.getAttribute('style'));
  console.log('7. Inline styles on element:', inlineStyle || 'none');

  // 7. Get all CSS rules affecting the element
  const cssRules = await page.$eval('#new-filter-container', el => {
    const rules = [];
    for (let sheet of document.styleSheets) {
      try {
        for (let rule of sheet.cssRules) {
          if (rule.style && rule.selectorText) {
            if (el.matches(rule.selectorText)) {
              if (rule.style.top) {
                rules.push({
                  selector: rule.selectorText,
                  top: rule.style.top,
                  href: sheet.href
                });
              }
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets can't be accessed
      }
    }
    return rules;
  });
  console.log('8. CSS rules with top property:', cssRules);

  // 8. Calculate visual gap
  const gap = filterBox.top - borderBox.top;
  console.log('9. Visual gap (filter.top - border.top):', gap + 'px');

  // 9. Check console errors
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  await page.waitForTimeout(1000);
  console.log('10. Console messages:', consoleMessages.length > 0 ? consoleMessages : 'none');

  // 10. Take diagnostic screenshot
  const timestamp = Date.now();
  await page.screenshot({
    path: `test-results/filter-diagnostic-${timestamp}.png`,
    fullPage: false
  });
  console.log(`\n11. Screenshot saved: test-results/filter-diagnostic-${timestamp}.png`);

  console.log('\n=== END DIAGNOSTIC REPORT ===\n');

  // Test should always pass - this is diagnostic only
  expect(matchesSelector).toBe(true);
});
