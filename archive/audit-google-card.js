const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to the timeline page
  await page.goto('http://localhost:8000/timeline-dev.html');

  // Wait for the page to load
  await page.waitForTimeout(4000); // Wait for intro animation

  // Find the Google Analytics card
  const googleCard = await page.locator('.google-card').first();

  // Get card dimensions
  const cardBox = await googleCard.boundingBox();
  console.log('Google Card Bounding Box:', cardBox);

  // Get computed styles for the card
  const cardStyles = await googleCard.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      width: styles.width,
      height: styles.height,
      padding: styles.padding,
      display: styles.display,
      flexDirection: styles.flexDirection,
      alignItems: styles.alignItems,
      justifyContent: styles.justifyContent
    };
  });
  console.log('Google Card Styles:', cardStyles);

  // Get card content info
  const cardContent = await googleCard.locator('.card-content').first();
  const contentBox = await cardContent.boundingBox();
  console.log('Card Content Bounding Box:', contentBox);

  // Get icon info
  const iconContainer = await googleCard.locator('.card-icon').first();
  const iconBox = await iconContainer.boundingBox();
  const iconStyles = await iconContainer.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      width: styles.width,
      height: styles.height,
      display: styles.display,
      justifyContent: styles.justifyContent,
      alignItems: styles.alignItems,
      fontSize: styles.fontSize,
      marginBottom: styles.marginBottom
    };
  });
  console.log('Icon Container Bounding Box:', iconBox);
  console.log('Icon Container Styles:', iconStyles);

  // Get SVG info
  const svg = await iconContainer.locator('svg').first();
  const svgBox = await svg.boundingBox();
  const svgAttrs = await svg.evaluate(el => ({
    width: el.getAttribute('width'),
    height: el.getAttribute('height'),
    viewBox: el.getAttribute('viewBox')
  }));
  console.log('SVG Bounding Box:', svgBox);
  console.log('SVG Attributes:', svgAttrs);

  // Get text elements
  const h3 = await googleCard.locator('h3').first();
  const h3Text = await h3.textContent();
  const h3Box = await h3.boundingBox();
  const h3Styles = await h3.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      fontSize: styles.fontSize,
      marginTop: styles.marginTop,
      marginBottom: styles.marginBottom,
      textAlign: styles.textAlign
    };
  });
  console.log('H3 Text:', h3Text);
  console.log('H3 Bounding Box:', h3Box);
  console.log('H3 Styles:', h3Styles);

  // Get all text elements
  const cardDate = await googleCard.locator('.card-date').first();
  const dateText = await cardDate.textContent();
  const dateBox = await cardDate.boundingBox();
  console.log('Date Text:', dateText);
  console.log('Date Bounding Box:', dateBox);

  const cardDesc = await googleCard.locator('.card-description').first();
  const descText = await cardDesc.textContent();
  const descBox = await cardDesc.boundingBox();
  console.log('Description Text:', descText);
  console.log('Description Bounding Box:', descBox);

  // Take screenshot of just the card
  await googleCard.screenshot({ path: 'google-card-audit.png' });
  console.log('\nScreenshot saved as google-card-audit.png');

  // Check if content is overflowing
  const isOverflowing = await googleCard.evaluate(el => {
    const content = el.querySelector('.card-content');
    return {
      scrollHeight: content.scrollHeight,
      clientHeight: content.clientHeight,
      isOverflowing: content.scrollHeight > content.clientHeight
    };
  });
  console.log('Overflow check:', isOverflowing);

  await browser.close();
})();
