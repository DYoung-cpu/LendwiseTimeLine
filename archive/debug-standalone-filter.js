const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Disable cache
  await page.route('**/*', (route) => route.continue({
    headers: { ...route.request().headers(), 'Cache-Control': 'no-cache' }
  }));

  await page.goto('http://localhost:3005/timeline-dev.html');

  await page.waitForTimeout(2000); // Wait for page to fully load

  // Check standalone filter button
  const standaloneInfo = await page.evaluate(() => {
    const btn = document.querySelector('.standalone-filter-btn');
    if (!btn) return { exists: false };

    const rect = btn.getBoundingClientRect();
    const styles = window.getComputedStyle(btn);

    return {
      exists: true,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      styles: {
        position: styles.position,
        top: styles.top,
        left: styles.left,
        transform: styles.transform,
        display: styles.display,
        zIndex: styles.zIndex,
        minWidth: styles.minWidth,
        height: styles.height
      },
      innerHTML: btn.innerHTML,
      parent: btn.parentElement?.className
    };
  });

  console.log('\n=== STANDALONE FILTER BUTTON ===');
  console.log(JSON.stringify(standaloneInfo, null, 2));

  // Check timeline-border-container positioning
  const containerInfo = await page.evaluate(() => {
    const container = document.querySelector('.timeline-border-container');
    if (!container) return { exists: false };

    const rect = container.getBoundingClientRect();
    const styles = window.getComputedStyle(container);

    return {
      exists: true,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      styles: {
        position: styles.position
      }
    };
  });

  console.log('\n=== TIMELINE BORDER CONTAINER ===');
  console.log(JSON.stringify(containerInfo, null, 2));

  // Check if filter icon exists separately
  const filterIconInfo = await page.evaluate(() => {
    const icon = document.querySelector('.filter-icon');
    if (!icon) return { exists: false };

    const rect = icon.getBoundingClientRect();
    const parent = icon.parentElement;

    return {
      exists: true,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      parentClass: parent?.className,
      parentRect: parent ? {
        top: parent.getBoundingClientRect().top,
        left: parent.getBoundingClientRect().left
      } : null
    };
  });

  console.log('\n=== FILTER ICON ===');
  console.log(JSON.stringify(filterIconInfo, null, 2));

  await browser.close();
})();
