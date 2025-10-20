const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to timeline-dev.html...');
  await page.goto('http://localhost:8000/timeline-dev.html');

  // Wait for intro animation
  console.log('Waiting for animation...');
  await page.waitForTimeout(4500);

  // Find Google card
  const googleCard = page.locator('.google-card').first();

  console.log('\n=== Checking Google Card Styling ===');

  // Check logo dimensions
  const logoStyles = await googleCard.locator('.google-logo').evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      width: styles.width,
      height: styles.height,
      padding: styles.padding,
      marginBottom: styles.marginBottom
    };
  });
  console.log('Logo container:', logoStyles);

  // Check SVG dimensions
  const svgDims = await googleCard.locator('svg').evaluate(el => ({
    width: el.getAttribute('width'),
    height: el.getAttribute('height')
  }));
  console.log('SVG dimensions:', svgDims);

  // Check text sizes
  const h3Styles = await googleCard.locator('h3').evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      fontSize: styles.fontSize,
      marginBottom: styles.marginBottom
    };
  });
  console.log('H3 styles:', h3Styles);

  const dateStyles = await googleCard.locator('.card-date').evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      fontSize: styles.fontSize,
      marginBottom: styles.marginBottom
    };
  });
  console.log('Date styles:', dateStyles);

  const descStyles = await googleCard.locator('.card-description').evaluate(el => {
    const styles = window.getComputedStyle(el);
    return { fontSize: styles.fontSize };
  });
  console.log('Description styles:', descStyles);

  // Check centering
  const contentStyles = await googleCard.locator('.card-content').evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      display: styles.display,
      flexDirection: styles.flexDirection,
      alignItems: styles.alignItems,
      justifyContent: styles.justifyContent
    };
  });
  console.log('Card content centering:', contentStyles);

  // Take screenshot
  await googleCard.screenshot({ path: 'google-card-fixed.png' });
  console.log('\n✓ Screenshot saved: google-card-fixed.png');

  await browser.close();
  console.log('✓ Done!');
})();
