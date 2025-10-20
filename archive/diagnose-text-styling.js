const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  console.log('🖱️ Clicking filter button to expand...');
  await page.click('.new-filter-btn');
  await page.waitForTimeout(600);

  console.log('\n========================================');
  console.log('TEXT STYLING COMPARISON');
  console.log('========================================\n');

  const textComparison = await page.evaluate(() => {
    // Get timeline milestone button text
    const timelineButton = document.querySelector('.timeline-milestone .milestone-icon-small');

    // Get filter buttons
    const filterBtn = document.querySelector('.new-filter-btn');
    const operationsBtn = document.querySelector('.filter-operations');
    const techBtn = document.querySelector('.filter-tech');

    if (!timelineButton || !filterBtn || !operationsBtn) {
      return {
        error: 'Required elements not found',
        found: {
          timelineButton: !!timelineButton,
          filterBtn: !!filterBtn,
          operationsBtn: !!operationsBtn
        }
      };
    }

    const timelineStyle = window.getComputedStyle(timelineButton);
    const filterBtnStyle = window.getComputedStyle(filterBtn);
    const operationsBtnStyle = window.getComputedStyle(operationsBtn);

    // Get bounding boxes for alignment check
    const timelineRect = timelineButton.getBoundingClientRect();
    const filterBtnRect = filterBtn.getBoundingClientRect();
    const operationsRect = operationsBtn.getBoundingClientRect();

    // Calculate text vertical position within button
    const filterTextPosInButton = {
      top: filterBtnStyle.paddingTop,
      display: filterBtnStyle.display,
      alignItems: filterBtnStyle.alignItems,
      justifyContent: filterBtnStyle.justifyContent,
      lineHeight: filterBtnStyle.lineHeight
    };

    return {
      timeline: {
        fontFamily: timelineStyle.fontFamily,
        fontSize: timelineStyle.fontSize,
        fontWeight: timelineStyle.fontWeight,
        letterSpacing: timelineStyle.letterSpacing,
        textTransform: timelineStyle.textTransform,
        lineHeight: timelineStyle.lineHeight,
        color: timelineStyle.color,
        display: timelineStyle.display,
        alignItems: timelineStyle.alignItems,
        justifyContent: timelineStyle.justifyContent,
        verticalAlign: timelineStyle.verticalAlign,
        paddingTop: timelineStyle.paddingTop,
        paddingBottom: timelineStyle.paddingBottom,
        textContent: timelineButton.textContent.trim()
      },
      filterButton: {
        fontFamily: filterBtnStyle.fontFamily,
        fontSize: filterBtnStyle.fontSize,
        fontWeight: filterBtnStyle.fontWeight,
        letterSpacing: filterBtnStyle.letterSpacing,
        textTransform: filterBtnStyle.textTransform,
        lineHeight: filterBtnStyle.lineHeight,
        color: filterBtnStyle.color,
        display: filterBtnStyle.display,
        alignItems: filterBtnStyle.alignItems,
        justifyContent: filterBtnStyle.justifyContent,
        gap: filterBtnStyle.gap,
        paddingTop: filterBtnStyle.paddingTop,
        paddingBottom: filterBtnStyle.paddingBottom,
        verticalAlign: filterBtnStyle.verticalAlign,
        textContent: filterBtn.textContent.trim()
      },
      operationsButton: {
        fontFamily: operationsBtnStyle.fontFamily,
        fontSize: operationsBtnStyle.fontSize,
        fontWeight: operationsBtnStyle.fontWeight,
        letterSpacing: operationsBtnStyle.letterSpacing,
        textTransform: operationsBtnStyle.textTransform,
        lineHeight: operationsBtnStyle.lineHeight,
        color: operationsBtnStyle.color,
        display: operationsBtnStyle.display,
        alignItems: operationsBtnStyle.alignItems,
        justifyContent: operationsBtnStyle.justifyContent,
        paddingTop: operationsBtnStyle.paddingTop,
        paddingBottom: operationsBtnStyle.paddingBottom,
        verticalAlign: operationsBtnStyle.verticalAlign,
        textContent: operationsBtn.textContent.trim()
      },
      alignment: {
        filterButton: {
          height: filterBtnRect.height,
          textPosition: filterTextPosInButton
        }
      }
    };
  });

  if (textComparison.error) {
    console.log('❌ ERROR:', textComparison.error);
  } else {
    console.log('📊 TIMELINE BUTTON TEXT:');
    console.log('   Text:', textComparison.timeline.textContent);
    console.log('   Font Family:', textComparison.timeline.fontFamily);
    console.log('   Font Size:', textComparison.timeline.fontSize);
    console.log('   Font Weight:', textComparison.timeline.fontWeight);
    console.log('   Letter Spacing:', textComparison.timeline.letterSpacing);
    console.log('   Text Transform:', textComparison.timeline.textTransform);
    console.log('   Line Height:', textComparison.timeline.lineHeight);
    console.log('   Vertical Align:', textComparison.timeline.verticalAlign);
    console.log('   Display:', textComparison.timeline.display);
    console.log('   Align Items:', textComparison.timeline.alignItems);

    console.log('\n📊 FILTER BUTTON TEXT:');
    console.log('   Text:', textComparison.filterButton.textContent);
    console.log('   Font Family:', textComparison.filterButton.fontFamily);
    console.log('   Font Size:', textComparison.filterButton.fontSize);
    console.log('   Font Weight:', textComparison.filterButton.fontWeight);
    console.log('   Letter Spacing:', textComparison.filterButton.letterSpacing);
    console.log('   Text Transform:', textComparison.filterButton.textTransform);
    console.log('   Line Height:', textComparison.filterButton.lineHeight);
    console.log('   Vertical Align:', textComparison.filterButton.verticalAlign);
    console.log('   Display:', textComparison.filterButton.display);
    console.log('   Align Items:', textComparison.filterButton.alignItems);
    console.log('   Gap:', textComparison.filterButton.gap);

    console.log('\n📊 OPERATIONS BUTTON TEXT:');
    console.log('   Text:', textComparison.operationsButton.textContent);
    console.log('   Font Family:', textComparison.operationsButton.fontFamily);
    console.log('   Font Size:', textComparison.operationsButton.fontSize);
    console.log('   Font Weight:', textComparison.operationsButton.fontWeight);
    console.log('   Letter Spacing:', textComparison.operationsButton.letterSpacing);
    console.log('   Text Transform:', textComparison.operationsButton.textTransform);
    console.log('   Line Height:', textComparison.operationsButton.lineHeight);

    console.log('\n========================================');
    console.log('DIFFERENCES DETECTED');
    console.log('========================================\n');

    const diffs = [];

    if (textComparison.timeline.fontFamily !== textComparison.filterButton.fontFamily) {
      diffs.push(`Font Family: Timeline="${textComparison.timeline.fontFamily}" vs Filter="${textComparison.filterButton.fontFamily}"`);
    }
    if (textComparison.timeline.fontSize !== textComparison.filterButton.fontSize) {
      diffs.push(`Font Size: Timeline="${textComparison.timeline.fontSize}" vs Filter="${textComparison.filterButton.fontSize}"`);
    }
    if (textComparison.timeline.fontWeight !== textComparison.filterButton.fontWeight) {
      diffs.push(`Font Weight: Timeline="${textComparison.timeline.fontWeight}" vs Filter="${textComparison.filterButton.fontWeight}"`);
    }
    if (textComparison.timeline.letterSpacing !== textComparison.filterButton.letterSpacing) {
      diffs.push(`Letter Spacing: Timeline="${textComparison.timeline.letterSpacing}" vs Filter="${textComparison.filterButton.letterSpacing}"`);
    }
    if (textComparison.timeline.textTransform !== textComparison.filterButton.textTransform) {
      diffs.push(`Text Transform: Timeline="${textComparison.timeline.textTransform}" vs Filter="${textComparison.filterButton.textTransform}"`);
    }
    if (textComparison.timeline.lineHeight !== textComparison.filterButton.lineHeight) {
      diffs.push(`Line Height: Timeline="${textComparison.timeline.lineHeight}" vs Filter="${textComparison.filterButton.lineHeight}"`);
    }

    if (diffs.length > 0) {
      diffs.forEach(diff => console.log(`❌ ${diff}`));
    } else {
      console.log('✅ All text properties match!');
    }

    console.log('\n========================================');
    console.log('RECOMMENDED CSS UPDATES');
    console.log('========================================\n');

    console.log('.new-filter-btn, .filter-option-btn {');
    console.log(`    font-family: ${textComparison.timeline.fontFamily};`);
    console.log(`    font-size: ${textComparison.timeline.fontSize};`);
    console.log(`    font-weight: ${textComparison.timeline.fontWeight};`);
    console.log(`    letter-spacing: ${textComparison.timeline.letterSpacing};`);
    console.log(`    text-transform: ${textComparison.timeline.textTransform};`);
    console.log(`    line-height: ${textComparison.timeline.lineHeight};`);
    console.log('}');
  }

  await page.waitForTimeout(1000);
  await browser.close();
  console.log('\n✅ Diagnosis complete!');
})();
