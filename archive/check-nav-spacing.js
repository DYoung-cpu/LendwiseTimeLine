const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3005/timeline-dev.html', { waitUntil: 'domcontentloaded' });

  const spacing = await page.evaluate(() => {
    const timeline = document.querySelector('.timeline-main-line');
    const leftBtn = document.querySelector('.timeline-nav-left');
    const rightBtn = document.querySelector('.timeline-nav-right');

    if (!timeline || !leftBtn || !rightBtn) return { error: 'Elements not found' };

    const timelineRect = timeline.getBoundingClientRect();
    const leftBtnRect = leftBtn.getBoundingClientRect();
    const rightBtnRect = rightBtn.getBoundingClientRect();

    const leftGap = timelineRect.left - leftBtnRect.right;
    const rightGap = rightBtnRect.left - timelineRect.right;

    return {
      leftGap: Math.round(leftGap),
      rightGap: Math.round(rightGap),
      difference: Math.round(leftGap - rightGap),
      leftBtnRight: Math.round(leftBtnRect.right),
      timelineLeft: Math.round(timelineRect.left),
      timelineRight: Math.round(timelineRect.right),
      rightBtnLeft: Math.round(rightBtnRect.left)
    };
  });

  console.log(JSON.stringify(spacing, null, 2));

  await browser.close();
})();
