const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3005');
  await page.waitForTimeout(2000);

  // Get button positions
  const buttons = {
    filter: await page.locator('.filter-container').boundingBox(),
    feed: await page.locator('.feed-button-container').boundingBox(),
    wisr: await page.locator('.wisr-button-container').boundingBox(),
    marketing: await page.locator('.marketing-button-container').boundingBox()
  };

  console.log('Button Positions:');
  console.log('FILTER:', buttons.filter);
  console.log('FEED:', buttons.feed);
  console.log('WISR:', buttons.wisr);
  console.log('MARKETING:', buttons.marketing);

  await page.waitForTimeout(5000);
  await browser.close();
})();
