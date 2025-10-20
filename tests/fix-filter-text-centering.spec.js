const { test, expect } = require('@playwright/test');

test('Diagnose and fix filter text centering', async ({ page }) => {
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(5000); // Wait for animations

  const timestamp = Date.now();

  // STEP 1: Diagnose current state
  const before = await page.evaluate(() => {
    const button = document.querySelector('.new-filter-btn');
    const filterText = button ? button.querySelector('span:not(.filter-count)') : null;
    const filterIcon = document.querySelector('.filter-icon');

    const getDetails = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      return {
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        centerY: rect.top + (rect.height / 2),
        computed: {
          display: computed.display,
          alignItems: computed.alignItems,
          justifyContent: computed.justifyContent,
          padding: computed.padding,
          lineHeight: computed.lineHeight,
          verticalAlign: computed.verticalAlign,
          margin: computed.margin,
          transform: computed.transform
        }
      };
    };

    return {
      button: getDetails(button),
      text: getDetails(filterText),
      icon: getDetails(filterIcon)
    };
  });

  console.log('=== BEFORE STATE ===');
  console.log('Button:', JSON.stringify(before.button, null, 2));
  console.log('Text:', JSON.stringify(before.text, null, 2));
  console.log('Icon:', JSON.stringify(before.icon, null, 2));

  if (before.button && before.text) {
    const offset = before.text.centerY - before.button.centerY;
    console.log(`\nText vertical offset from button center: ${offset}px`);
    console.log(`Text is ${offset > 0 ? 'BELOW' : 'ABOVE'} button center by ${Math.abs(offset)}px`);
  }

  // Take before screenshot
  await page.screenshot({
    path: `test-results/text-centering-before-${timestamp}.png`,
    clip: { x: 0, y: 0, width: 1280, height: 400 }
  });

  // STEP 2: Test CSS fixes via injection
  console.log('\n=== TESTING CSS FIXES ===');

  // Try fix 1: Ensure flexbox centering on button
  await page.addStyleTag({
    content: `
      .new-filter-btn {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 8px 14px !important;
        line-height: 1 !important;
      }
      .new-filter-btn span:not(.filter-count) {
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1 !important;
        vertical-align: middle !important;
      }
      .filter-icon {
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1 !important;
        vertical-align: middle !important;
      }
    `
  });

  await page.waitForTimeout(500);

  // Measure after fix
  const after = await page.evaluate(() => {
    const button = document.querySelector('.new-filter-btn');
    const filterText = button ? button.querySelector('span:not(.filter-count)') : null;
    const filterIcon = document.querySelector('.filter-icon');

    const getDetails = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      return {
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        centerY: rect.top + (rect.height / 2),
        computed: {
          display: computed.display,
          alignItems: computed.alignItems,
          justifyContent: computed.justifyContent,
          padding: computed.padding,
          lineHeight: computed.lineHeight,
          verticalAlign: computed.verticalAlign
        }
      };
    };

    return {
      button: getDetails(button),
      text: getDetails(filterText),
      icon: getDetails(filterIcon)
    };
  });

  console.log('\n=== AFTER FIX ===');
  console.log('Button:', JSON.stringify(after.button, null, 2));
  console.log('Text:', JSON.stringify(after.text, null, 2));
  console.log('Icon:', JSON.stringify(after.icon, null, 2));

  if (after.button && after.text) {
    const offset = after.text.centerY - after.button.centerY;
    console.log(`\nText vertical offset from button center: ${offset}px`);
    console.log(`Text is ${offset > 0 ? 'BELOW' : 'ABOVE'} button center by ${Math.abs(offset)}px`);
    console.log(`Improvement: ${Math.abs(before.text.centerY - before.button.centerY) - Math.abs(offset)}px`);
  }

  // Take after screenshot
  await page.screenshot({
    path: `test-results/text-centering-after-${timestamp}.png`,
    clip: { x: 0, y: 0, width: 1280, height: 400 }
  });

  // Check if centered (within 2px tolerance)
  const finalOffset = Math.abs(after.text.centerY - after.button.centerY);
  const isCentered = finalOffset < 2;

  console.log(`\n=== RESULT ===`);
  console.log(`Text centered: ${isCentered ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Final offset: ${finalOffset}px (must be < 2px)`);

  if (!isCentered) {
    throw new Error(`Text not centered. Offset: ${finalOffset}px`);
  }

  console.log('\n✅ FIX SUCCESSFUL');
  console.log('Screenshots:');
  console.log(`  Before: test-results/text-centering-before-${timestamp}.png`);
  console.log(`  After: test-results/text-centering-after-${timestamp}.png`);
  console.log('\nCSS to apply:');
  console.log(`
  .new-filter-btn {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 8px 14px !important;
    line-height: 1 !important;
  }
  .new-filter-btn span:not(.filter-count), .filter-icon {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1 !important;
    vertical-align: middle !important;
  }
  `);
});
