const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html');

  // Wait for intro animation
  await page.waitForTimeout(4000);

  // Focus on the Google card
  const googleCard = page.locator('.google-card').first();
  await googleCard.scrollIntoViewIfNeeded();

  // Take screenshot
  await googleCard.screenshot({ path: 'google-card-fixed.png' });
  console.log('Screenshot saved: google-card-fixed.png');

  // Get measurements
  const measurements = await googleCard.evaluate(el => {
    const logo = el.querySelector('.google-logo');
    const svg = el.querySelector('svg');
    const h3 = el.querySelector('h3');
    const date = el.querySelector('.card-date');
    const desc = el.querySelector('.card-description');

    return {
      cardHeight: el.offsetHeight,
      logoHeight: logo ? logo.offsetHeight : 0,
      svgSize: svg ? `${svg.getAttribute('width')}x${svg.getAttribute('height')}` : 'N/A',
      h3Height: h3 ? h3.offsetHeight : 0,
      dateHeight: date ? date.offsetHeight : 0,
      descHeight: desc ? desc.offsetHeight : 0,
      totalContent: (logo ? logo.offsetHeight : 0) +
                    (h3 ? h3.offsetHeight : 0) +
                    (date ? date.offsetHeight : 0) +
                    (desc ? desc.offsetHeight : 0)
    };
  });

  console.log('\n=== Google Card Measurements ===');
  console.log('Card height:', measurements.cardHeight + 'px');
  console.log('Logo container:', measurements.logoHeight + 'px');
  console.log('SVG size:', measurements.svgSize);
  console.log('H3 height:', measurements.h3Height + 'px');
  console.log('Date height:', measurements.dateHeight + 'px');
  console.log('Description height:', measurements.descHeight + 'px');
  console.log('Total content height:', measurements.totalContent + 'px');
  console.log('Remaining space:', (measurements.cardHeight - measurements.totalContent) + 'px');

  await page.waitForTimeout(2000);
  await browser.close();
})();
