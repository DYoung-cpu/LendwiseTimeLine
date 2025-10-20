const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3005/timeline-dev.html', { waitUntil: 'domcontentloaded' });

  const positions = await page.evaluate(() => {
    const timelineLine = document.querySelector('.timeline-main-line');
    const navBtn = document.querySelector('.timeline-nav-left');

    if (!timelineLine || !navBtn) return { error: 'Elements not found' };

    const lineRect = timelineLine.getBoundingClientRect();
    const btnRect = navBtn.getBoundingClientRect();

    const lineCenter = lineRect.top + (lineRect.height / 2);
    const btnCenter = btnRect.top + (btnRect.height / 2);
    const difference = btnCenter - lineCenter;

    return {
      lineCenter,
      btnCenter,
      difference,
      adjustment: Math.round(difference)
    };
  });

  console.log(JSON.stringify(positions, null, 2));

  await browser.close();
})();
