const { test } = require('@playwright/test');

test('Check button vertical alignment', async ({ page }) => {
  await page.goto('http://localhost:3005/timeline-dev.html');

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Get bounding boxes for all three buttons
  const filterBox = await page.locator('.filter-container').boundingBox();
  const wisrBox = await page.locator('.wisr-button-container').boundingBox();
  const feedBox = await page.locator('.feed-button-container').boundingBox();

  console.log('=== BUTTON POSITIONS ===');
  console.log('FILTER top:', filterBox?.y);
  console.log('WISR top:', wisrBox?.y);
  console.log('FEED top:', feedBox?.y);
  console.log('');
  console.log('FILTER height:', filterBox?.height);
  console.log('WISR height:', wisrBox?.height);
  console.log('FEED height:', feedBox?.height);
  console.log('');
  console.log('Difference (WISR - FILTER):', wisrBox?.y - filterBox?.y);
  console.log('Difference (WISR - FEED):', wisrBox?.y - feedBox?.y);

  // Take screenshot
  await page.screenshot({ path: 'test-results/button-alignment.png', fullPage: false });
});
