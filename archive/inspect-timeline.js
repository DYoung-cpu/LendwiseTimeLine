const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', {
    waitUntil: 'networkidle'
  });

  // Wait for animations
  await page.waitForTimeout(4000);

  console.log('\n========================================');
  console.log('CSS FILES LOADED:');
  console.log('========================================');

  // Check what CSS files are loaded
  const cssFiles = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return links.map(link => ({
      href: link.href,
      loaded: link.sheet !== null
    }));
  });

  cssFiles.forEach(css => {
    console.log(`${css.loaded ? '✅' : '❌'} ${css.href}`);
  });

  console.log('\n========================================');
  console.log('COMPUTED STYLES - .timeline-nav');
  console.log('========================================');

  // Get computed styles for navigation arrows
  const navStyles = await page.evaluate(() => {
    const nav = document.querySelector('.timeline-nav');
    if (!nav) return { error: 'Element not found' };

    const computed = window.getComputedStyle(nav);
    return {
      display: computed.display,
      position: computed.position,
      width: computed.width,
      height: computed.height,
      borderRadius: computed.borderRadius,
      overflow: computed.overflow,
      boxSizing: computed.boxSizing,
      background: computed.background,
      border: computed.border,
      top: computed.top,
      left: computed.left,
      transform: computed.transform
    };
  });

  console.log(JSON.stringify(navStyles, null, 2));

  console.log('\n========================================');
  console.log('COMPUTED STYLES - .timeline-border-container');
  console.log('========================================');

  // Get computed styles for border container
  const borderStyles = await page.evaluate(() => {
    const border = document.querySelector('.timeline-border-container');
    if (!border) return { error: 'Element not found' };

    const computed = window.getComputedStyle(border);
    return {
      position: computed.position,
      border: computed.border,
      borderRadius: computed.borderRadius,
      borderTop: computed.borderTop,
      borderLeft: computed.borderLeft,
      borderRight: computed.borderRight,
      borderBottom: computed.borderBottom,
      overflow: computed.overflow,
      clipPath: computed.clipPath,
      padding: computed.padding
    };
  });

  console.log(JSON.stringify(borderStyles, null, 2));

  console.log('\n========================================');
  console.log('PSEUDO-ELEMENT STYLES - ::before and ::after');
  console.log('========================================');

  // Get computed styles for pseudo-elements
  const pseudoStyles = await page.evaluate(() => {
    const border = document.querySelector('.timeline-border-container');
    if (!border) return { error: 'Element not found' };

    const before = window.getComputedStyle(border, '::before');
    const after = window.getComputedStyle(border, '::after');

    return {
      before: {
        content: before.content,
        position: before.position,
        width: before.width,
        height: before.height,
        top: before.top,
        left: before.left,
        borderTop: before.borderTop,
        borderLeft: before.borderLeft,
        borderRadius: before.borderRadius
      },
      after: {
        content: after.content,
        position: after.position,
        width: after.width,
        height: after.height,
        top: before.top,
        right: after.right,
        borderTop: after.borderTop,
        borderRight: after.borderRight,
        borderRadius: after.borderRadius
      }
    };
  });

  console.log('::before', JSON.stringify(pseudoStyles.before, null, 2));
  console.log('::after', JSON.stringify(pseudoStyles.after, null, 2));

  console.log('\n========================================');
  console.log('ELEMENT EXISTENCE CHECK');
  console.log('========================================');

  // Check if elements exist
  const elements = await page.evaluate(() => {
    return {
      timelineNav: !!document.querySelector('.timeline-nav'),
      timelineBorder: !!document.querySelector('.timeline-border-container'),
      filterContainer: !!document.querySelector('.new-filter-container'),
      filterBtn: !!document.querySelector('.new-filter-btn'),
      timelineNavCount: document.querySelectorAll('.timeline-nav').length
    };
  });

  console.log(JSON.stringify(elements, null, 2));

  console.log('\n========================================');
  console.log('TAKING SCREENSHOT...');
  console.log('========================================');

  // Take screenshot
  await page.screenshot({
    path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/timeline-debug-screenshot.png',
    fullPage: true
  });

  console.log('✅ Screenshot saved: timeline-debug-screenshot.png');

  await browser.close();
  console.log('\n✅ Inspection complete!');
})();
