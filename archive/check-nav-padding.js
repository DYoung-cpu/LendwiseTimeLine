const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.route('**/*', (route) => route.continue({
    headers: { ...route.request().headers(), 'Cache-Control': 'no-cache' }
  }));

  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(2000);

  const paddingCheck = await page.evaluate(() => {
    const btn = document.querySelector('.timeline-nav-left');
    if (!btn) return { error: 'Not found' };

    const styles = window.getComputedStyle(btn);
    const rect = btn.getBoundingClientRect();

    return {
      boundingRect: {
        width: rect.width,
        height: rect.height
      },
      boxSizing: styles.boxSizing,
      padding: {
        top: styles.paddingTop,
        right: styles.paddingRight,
        bottom: styles.paddingBottom,
        left: styles.paddingLeft
      },
      border: {
        top: styles.borderTopWidth,
        right: styles.borderRightWidth,
        bottom: styles.borderBottomWidth,
        left: styles.borderLeftWidth
      },
      width: styles.width,
      height: styles.height,
      inlineStyle: btn.getAttribute('style')
    };
  });

  console.log(JSON.stringify(paddingCheck, null, 2));

  await browser.close();
})();
