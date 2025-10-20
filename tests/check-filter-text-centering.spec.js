const { test, expect } = require('@playwright/test');

test('Check filter button text centering and position', async ({ page }) => {
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(5000); // Wait for animations

  const timestamp = Date.now();

  // Check actual state
  const diagnostics = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    const button = document.querySelector('.new-filter-btn');
    const filterText = document.querySelector('.filter-text');
    const borderSvg = document.querySelector('.border-svg');

    const getFullStyles = (el) => {
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        // Position
        top: computed.top,
        left: computed.left,
        position: computed.position,
        transform: computed.transform,
        // Alignment
        display: computed.display,
        alignItems: computed.alignItems,
        justifyContent: computed.justifyContent,
        textAlign: computed.textAlign,
        // Bounds
        boundingTop: rect.top,
        boundingLeft: rect.left,
        boundingWidth: rect.width,
        boundingHeight: rect.height,
        // Visibility
        opacity: computed.opacity,
        visibility: computed.visibility
      };
    };

    return {
      container: getFullStyles(container),
      button: getFullStyles(button),
      filterText: getFullStyles(filterText),
      borderSvg: getFullStyles(borderSvg),
      containerHTML: container ? container.outerHTML.substring(0, 200) : null,
      buttonHTML: button ? button.outerHTML.substring(0, 200) : null
    };
  });

  console.log('=== FILTER BUTTON DIAGNOSTIC ===');
  console.log('\nCONTAINER (.new-filter-container):');
  console.log(JSON.stringify(diagnostics.container, null, 2));

  console.log('\nBUTTON (.new-filter-btn):');
  console.log(JSON.stringify(diagnostics.button, null, 2));

  console.log('\nFILTER TEXT (.filter-text):');
  console.log(JSON.stringify(diagnostics.filterText, null, 2));

  console.log('\nBORDER SVG (.border-svg):');
  console.log(JSON.stringify(diagnostics.borderSvg, null, 2));

  console.log('\nHTML STRUCTURE:');
  console.log('Container:', diagnostics.containerHTML);
  console.log('Button:', diagnostics.buttonHTML);

  // Take screenshot
  await page.screenshot({
    path: `test-results/filter-diagnostic-${timestamp}.png`,
    fullPage: false
  });

  console.log(`\nScreenshot saved: test-results/filter-diagnostic-${timestamp}.png`);

  // Check if text is centered
  if (diagnostics.button && diagnostics.filterText) {
    const buttonCenterY = diagnostics.button.boundingTop + (diagnostics.button.boundingHeight / 2);
    const textCenterY = diagnostics.filterText.boundingTop + (diagnostics.filterText.boundingHeight / 2);
    const verticalOffset = Math.abs(buttonCenterY - textCenterY);

    console.log(`\nTEXT CENTERING CHECK:`);
    console.log(`  Button center Y: ${buttonCenterY}px`);
    console.log(`  Text center Y: ${textCenterY}px`);
    console.log(`  Vertical offset: ${verticalOffset}px`);
    console.log(`  Is centered: ${verticalOffset < 2 ? 'YES ✓' : 'NO ✗'}`);
  }

  // Check container position
  if (diagnostics.container && diagnostics.borderSvg) {
    console.log(`\nPOSITION CHECK:`);
    console.log(`  Container computed top: ${diagnostics.container.top}`);
    console.log(`  Container bounding top: ${diagnostics.container.boundingTop}px`);
    console.log(`  Border computed top: ${diagnostics.borderSvg.top}`);
    console.log(`  Border bounding top: ${diagnostics.borderSvg.boundingTop}px`);
    console.log(`  Gap: ${Math.abs(diagnostics.container.boundingTop - diagnostics.borderSvg.boundingTop)}px`);
  }
});
