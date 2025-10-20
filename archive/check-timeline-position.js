const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.route('**/*', (route) => route.continue({
    headers: { ...route.request().headers(), 'Cache-Control': 'no-cache' }
  }));

  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(2000);

  const positions = await page.evaluate(() => {
    const timelineLine = document.querySelector('.timeline-main-line');
    const navBtn = document.querySelector('.timeline-nav-left');
    const roadmapTimeline = document.querySelector('.roadmap-timeline');

    const getPosition = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        height: rect.height,
        centerY: rect.top + (rect.height / 2)
      };
    };

    return {
      timelineLine: getPosition(timelineLine),
      navButton: getPosition(navBtn),
      roadmapTimeline: getPosition(roadmapTimeline),
      difference: navBtn && timelineLine ?
        (navBtn.getBoundingClientRect().top + 16) - (timelineLine.getBoundingClientRect().top + (timelineLine.getBoundingClientRect().height / 2)) : null
    };
  });

  console.log('Timeline Line Center Y:', positions.timelineLine?.centerY);
  console.log('Nav Button Center Y:', positions.navButton?.centerY);
  console.log('Roadmap Timeline Top:', positions.roadmapTimeline?.top);
  console.log('Difference (button center - line center):', positions.difference);

  if (positions.difference !== null) {
    const adjustment = Math.round(positions.difference);
    console.log(`\nTo align buttons with timeline, reduce top by ${adjustment}px`);
    console.log(`Current: top: 240px`);
    console.log(`New: top: ${240 - adjustment}px`);
  }

  await browser.close();
})();
