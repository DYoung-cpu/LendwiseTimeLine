const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,  // Keep browser open for visual inspection
    slowMo: 500
  });

  const page = await browser.newPage();

  // Disable cache
  await page.route('**/*', (route) => route.continue({
    headers: { ...route.request().headers(), 'Cache-Control': 'no-cache' }
  }));

  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(3000);

  console.log('\n=== NAVIGATION BUTTON AUDIT ===\n');

  // 1. CHECK LEFT BUTTON
  console.log('1. LEFT NAVIGATION BUTTON:');
  const leftBtnInfo = await page.evaluate(() => {
    const btn = document.querySelector('.timeline-nav-left');
    if (!btn) return { exists: false };

    const rect = btn.getBoundingClientRect();
    const styles = window.getComputedStyle(btn);

    return {
      exists: true,
      classList: Array.from(btn.classList),
      boundingRect: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      },
      computedStyles: {
        width: styles.width,
        height: styles.height,
        minWidth: styles.minWidth,
        maxWidth: styles.maxWidth,
        minHeight: styles.minHeight,
        maxHeight: styles.maxHeight,
        borderRadius: styles.borderRadius,
        aspectRatio: styles.aspectRatio,
        display: styles.display,
        flexShrink: styles.flexShrink,
        transform: styles.transform
      }
    };
  });

  console.log(JSON.stringify(leftBtnInfo, null, 2));

  // 2. CHECK RIGHT BUTTON
  console.log('\n2. RIGHT NAVIGATION BUTTON:');
  const rightBtnInfo = await page.evaluate(() => {
    const btn = document.querySelector('.timeline-nav-right');
    if (!btn) return { exists: false };

    const rect = btn.getBoundingClientRect();
    const styles = window.getComputedStyle(btn);

    return {
      exists: true,
      classList: Array.from(btn.classList),
      boundingRect: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      },
      computedStyles: {
        width: styles.width,
        height: styles.height,
        minWidth: styles.minWidth,
        maxWidth: styles.maxWidth,
        minHeight: styles.minHeight,
        maxHeight: styles.maxHeight,
        borderRadius: styles.borderRadius,
        aspectRatio: styles.aspectRatio,
        display: styles.display,
        flexShrink: styles.flexShrink,
        transform: styles.transform
      }
    };
  });

  console.log(JSON.stringify(rightBtnInfo, null, 2));

  // 3. CHECK FOR CONFLICTING CSS RULES
  console.log('\n3. CHECKING CSS SPECIFICITY:');
  const cssCheck = await page.evaluate(() => {
    const btn = document.querySelector('.timeline-nav-left');
    if (!btn) return { error: 'Button not found' };

    // Get all applied CSS rules
    const allRules = [];
    const sheets = document.styleSheets;

    for (let sheet of sheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (let rule of rules) {
          if (rule.selectorText && btn.matches(rule.selectorText)) {
            allRules.push({
              selector: rule.selectorText,
              width: rule.style.width,
              height: rule.style.height
            });
          }
        }
      } catch (e) {
        // CORS or other access issues
      }
    }

    return { rulesMatching: allRules };
  });

  console.log(JSON.stringify(cssCheck, null, 2));

  // 4. CHECK ASPECT RATIO CALCULATION
  console.log('\n4. ASPECT RATIO CHECK:');
  const aspectCheck = await page.evaluate(() => {
    const leftBtn = document.querySelector('.timeline-nav-left');
    const rightBtn = document.querySelector('.timeline-nav-right');

    const getAspectRatio = (btn) => {
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        aspectRatio: (rect.width / rect.height).toFixed(3),
        isCircular: Math.abs(rect.width - rect.height) < 1
      };
    };

    return {
      left: getAspectRatio(leftBtn),
      right: getAspectRatio(rightBtn)
    };
  });

  console.log(JSON.stringify(aspectCheck, null, 2));

  if (aspectCheck.left && !aspectCheck.left.isCircular) {
    console.log(`\n❌ LEFT BUTTON NOT CIRCULAR: ${aspectCheck.left.width}px x ${aspectCheck.left.height}px (ratio: ${aspectCheck.left.aspectRatio})`);
  } else {
    console.log('\n✅ LEFT BUTTON IS CIRCULAR');
  }

  if (aspectCheck.right && !aspectCheck.right.isCircular) {
    console.log(`❌ RIGHT BUTTON NOT CIRCULAR: ${aspectCheck.right.width}px x ${aspectCheck.right.height}px (ratio: ${aspectCheck.right.aspectRatio})`);
  } else {
    console.log('\n✅ RIGHT BUTTON IS CIRCULAR');
  }

  // 5. CHECK PARENT CONTAINER INFLUENCE
  console.log('\n5. PARENT CONTAINER CHECK:');
  const parentCheck = await page.evaluate(() => {
    const btn = document.querySelector('.timeline-nav-left');
    if (!btn) return { error: 'Button not found' };

    const parent = btn.parentElement;
    const parentStyles = window.getComputedStyle(parent);

    return {
      parentTag: parent.tagName,
      parentClass: parent.className,
      parentStyles: {
        display: parentStyles.display,
        flexDirection: parentStyles.flexDirection,
        alignItems: parentStyles.alignItems,
        transform: parentStyles.transform
      }
    };
  });

  console.log(JSON.stringify(parentCheck, null, 2));

  console.log('\n=== DIAGNOSIS ===\n');

  if (aspectCheck.left && aspectCheck.right) {
    const leftRatio = parseFloat(aspectCheck.left.aspectRatio);
    const rightRatio = parseFloat(aspectCheck.right.aspectRatio);

    if (leftRatio !== 1.000 || rightRatio !== 1.000) {
      console.log('PROBLEM IDENTIFIED:');
      console.log(`- Buttons are being stretched (not 1:1 aspect ratio)`);
      console.log(`- Left ratio: ${leftRatio}`);
      console.log(`- Right ratio: ${rightRatio}`);
      console.log('\nLIKELY CAUSES:');
      console.log('1. Transform scale or parent container stretching');
      console.log('2. CSS aspect-ratio not supported or overridden');
      console.log('3. Flex or grid layout affecting dimensions');
    }
  }

  console.log('\nBrowser will stay open for 30 seconds for visual inspection...\n');

  await page.waitForTimeout(30000);
  await browser.close();
})();
