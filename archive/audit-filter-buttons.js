const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Disable cache
  await page.route('**/*', (route) => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  });

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:3005/timeline-dev.html', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('\n========================================');
  console.log('FILTER BUTTON AUDIT');
  console.log('========================================\n');

  const filterButtons = await page.evaluate(() => {
    // Find ALL elements that might be filter buttons
    const allButtons = [];

    // Check for main filter button
    const mainFilter = document.getElementById('main-filter-btn');
    if (mainFilter) {
      const rect = mainFilter.getBoundingClientRect();
      const styles = window.getComputedStyle(mainFilter);
      allButtons.push({
        id: 'main-filter-btn',
        tagName: mainFilter.tagName,
        className: mainFilter.className,
        innerHTML: mainFilter.innerHTML.substring(0, 100),
        visible: styles.display !== 'none' && styles.visibility !== 'hidden',
        position: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        zIndex: styles.zIndex,
        display: styles.display
      });
    }

    // Check for new-filter-btn class
    const newFilterBtns = document.querySelectorAll('.new-filter-btn');
    newFilterBtns.forEach((btn, i) => {
      const rect = btn.getBoundingClientRect();
      const styles = window.getComputedStyle(btn);
      allButtons.push({
        id: btn.id || `new-filter-btn-${i}`,
        tagName: btn.tagName,
        className: btn.className,
        innerHTML: btn.innerHTML.substring(0, 100),
        visible: styles.display !== 'none' && styles.visibility !== 'hidden',
        position: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        zIndex: styles.zIndex,
        display: styles.display
      });
    });

    // Check for filter-icon elements
    const filterIcons = document.querySelectorAll('.filter-icon');
    filterIcons.forEach((icon, i) => {
      const parent = icon.parentElement;
      const rect = parent.getBoundingClientRect();
      const styles = window.getComputedStyle(parent);
      allButtons.push({
        id: parent.id || `filter-icon-parent-${i}`,
        tagName: parent.tagName,
        className: parent.className,
        innerHTML: parent.innerHTML.substring(0, 100),
        visible: styles.display !== 'none' && styles.visibility !== 'hidden',
        position: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        zIndex: styles.zIndex,
        display: styles.display
      });
    });

    // Check new-filter-container
    const container = document.querySelector('.new-filter-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      const styles = window.getComputedStyle(container);
      allButtons.push({
        id: 'new-filter-container',
        tagName: container.tagName,
        className: container.className,
        innerHTML: 'CONTAINER',
        visible: styles.display !== 'none' && styles.visibility !== 'hidden',
        position: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        zIndex: styles.zIndex,
        display: styles.display
      });
    }

    return allButtons;
  });

  console.log('🔍 FOUND FILTER-RELATED ELEMENTS:\n');
  filterButtons.forEach((btn, i) => {
    console.log(`[${i + 1}] ${btn.tagName} - ${btn.className}`);
    console.log(`    ID: ${btn.id}`);
    console.log(`    Visible: ${btn.visible ? '✅ YES' : '❌ NO'}`);
    console.log(`    Position: ${btn.position.top}px (top), ${btn.position.left}px (left)`);
    console.log(`    Size: ${btn.position.width}px × ${btn.position.height}px`);
    console.log(`    Z-Index: ${btn.zIndex}`);
    console.log(`    Display: ${btn.display}`);
    console.log(`    HTML: ${btn.innerHTML.substring(0, 80)}...`);
    console.log('');
  });

  console.log('\n========================================');
  console.log('CSS CACHE CHECK');
  console.log('========================================\n');

  const cssVersion = await page.evaluate(() => {
    const cssLink = document.querySelector('link[href*="timeline-clean-test.css"]');
    return cssLink ? cssLink.href : 'NOT FOUND';
  });

  console.log(`CSS Link: ${cssVersion}`);
  console.log(`Expected: v=20251005070000\n`);

  console.log('⏸️  Browser will stay open for 10 seconds...\n');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('✅ Audit complete!');
})();
