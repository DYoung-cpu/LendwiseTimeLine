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
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('\n========================================');
  console.log('TIMELINE LINE VISIBILITY AUDIT');
  console.log('========================================\n');

  // Get all element dimensions and positions
  const audit = await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    const lineContainer = document.querySelector('.timeline-line-container');
    const mainLine = document.querySelector('.timeline-main-line');
    const milestones = document.querySelector('.timeline-milestones');

    // Get all milestone positions
    const allMilestones = Array.from(document.querySelectorAll('.timeline-milestone'));
    const milestoneData = allMilestones.map(m => {
      const computedStyle = window.getComputedStyle(m);
      const rect = m.getBoundingClientRect();
      const label = m.querySelector('.milestone-label')?.textContent || 'Unknown';
      return {
        label,
        left: computedStyle.left,
        leftPx: parseInt(computedStyle.left),
        rect: {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        }
      };
    });

    // Get styles
    const lineContainerStyle = window.getComputedStyle(lineContainer);
    const mainLineStyle = window.getComputedStyle(mainLine);
    const milestonesStyle = window.getComputedStyle(milestones);
    const viewportStyle = window.getComputedStyle(viewport);

    return {
      viewport: {
        clientWidth: viewport.clientWidth,
        scrollWidth: viewport.scrollWidth,
        scrollLeft: viewport.scrollLeft
      },
      lineContainer: {
        width: lineContainerStyle.width,
        widthPx: parseInt(lineContainerStyle.width),
        paddingLeft: lineContainerStyle.paddingLeft,
        paddingRight: lineContainerStyle.paddingRight
      },
      mainLine: {
        width: mainLineStyle.width,
        widthPx: parseInt(mainLineStyle.width),
        left: mainLineStyle.left,
        background: mainLineStyle.background
      },
      milestones: {
        width: milestonesStyle.width,
        widthPx: parseInt(milestonesStyle.width)
      },
      milestoneData: milestoneData,
      rightmostMilestone: milestoneData.reduce((max, m) => m.leftPx > max.leftPx ? m : max, milestoneData[0])
    };
  });

  console.log('📊 Container Dimensions:');
  console.log(`   Viewport: ${audit.viewport.clientWidth}px (scrollable: ${audit.viewport.scrollWidth}px)`);
  console.log(`   Line Container: ${audit.lineContainer.width}`);
  console.log(`   Padding: L=${audit.lineContainer.paddingLeft} R=${audit.lineContainer.paddingRight}\n`);

  console.log('📏 Timeline Elements:');
  console.log(`   Main Line Width: ${audit.mainLine.width}`);
  console.log(`   Main Line Left: ${audit.mainLine.left}`);
  console.log(`   Milestones Container: ${audit.milestones.width}\n`);

  console.log('🎯 Milestone Positions:');
  audit.milestoneData.forEach(m => {
    console.log(`   ${m.label}: ${m.left} (${m.leftPx}px)`);
  });

  console.log(`\n🔍 Rightmost Milestone: ${audit.rightmostMilestone.label}`);
  console.log(`   Position: ${audit.rightmostMilestone.leftPx}px`);
  console.log(`   Main Line Ends At: ${audit.mainLine.widthPx}px\n`);

  const coverage = audit.mainLine.widthPx - audit.rightmostMilestone.leftPx;
  if (coverage < 0) {
    console.log(`❌ PROBLEM: Main line is ${Math.abs(coverage)}px SHORT of rightmost milestone!`);
    console.log(`   Main line needs to be at least ${audit.rightmostMilestone.leftPx}px wide\n`);
  } else {
    console.log(`✅ Main line extends ${coverage}px beyond rightmost milestone\n`);
  }

  // Test at scroll position 0 (left)
  console.log('========================================');
  console.log('TEST 1: Scrolled to LEFT (scroll=0)');
  console.log('========================================\n');

  await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    viewport.scrollLeft = 0;
  });

  await page.waitForTimeout(500);

  const leftTest = await page.evaluate(() => {
    const mainLine = document.querySelector('.timeline-main-line');
    const viewportRect = document.querySelector('.timeline-viewport').getBoundingClientRect();
    const lineRect = mainLine.getBoundingClientRect();

    return {
      viewport: {
        left: Math.round(viewportRect.left),
        right: Math.round(viewportRect.right),
        width: Math.round(viewportRect.width)
      },
      line: {
        left: Math.round(lineRect.left),
        right: Math.round(lineRect.right),
        width: Math.round(lineRect.width)
      },
      isVisible: lineRect.width > 0 && lineRect.right > viewportRect.left && lineRect.left < viewportRect.right
    };
  });

  console.log(`Viewport: ${leftTest.viewport.left}px → ${leftTest.viewport.right}px`);
  console.log(`Line:     ${leftTest.line.left}px → ${leftTest.line.right}px`);
  console.log(`${leftTest.isVisible ? '✅' : '❌'} Timeline line ${leftTest.isVisible ? 'IS' : 'IS NOT'} visible\n`);

  // Test scrolled to right
  console.log('========================================');
  console.log('TEST 2: Scrolled to RIGHT (max scroll)');
  console.log('========================================\n');

  await page.evaluate(() => {
    const viewport = document.querySelector('.timeline-viewport');
    viewport.scrollLeft = 999999; // Scroll all the way right
  });

  await page.waitForTimeout(500);

  const rightTest = await page.evaluate(() => {
    const mainLine = document.querySelector('.timeline-main-line');
    const viewportRect = document.querySelector('.timeline-viewport').getBoundingClientRect();
    const lineRect = mainLine.getBoundingClientRect();
    const viewport = document.querySelector('.timeline-viewport');

    return {
      scrollLeft: viewport.scrollLeft,
      viewport: {
        left: Math.round(viewportRect.left),
        right: Math.round(viewportRect.right),
        width: Math.round(viewportRect.width)
      },
      line: {
        left: Math.round(lineRect.left),
        right: Math.round(lineRect.right),
        width: Math.round(lineRect.width)
      },
      isVisible: lineRect.width > 0 && lineRect.right > viewportRect.left && lineRect.left < viewportRect.right,
      lineEndsBeforeViewportEnds: lineRect.right < viewportRect.right
    };
  });

  console.log(`Scroll Position: ${rightTest.scrollLeft}px`);
  console.log(`Viewport: ${rightTest.viewport.left}px → ${rightTest.viewport.right}px`);
  console.log(`Line:     ${rightTest.line.left}px → ${rightTest.line.right}px`);
  console.log(`${rightTest.isVisible ? '✅' : '❌'} Timeline line ${rightTest.isVisible ? 'IS' : 'IS NOT'} visible`);

  if (rightTest.lineEndsBeforeViewportEnds) {
    const shortfall = rightTest.viewport.right - rightTest.line.right;
    console.log(`❌ PROBLEM: Line ends ${shortfall}px BEFORE viewport right edge!`);
    console.log(`   This is why the line disappears when scrolling right.\n`);
  } else {
    console.log(`✅ Line extends to or beyond viewport right edge\n`);
  }

  // Summary
  console.log('========================================');
  console.log('DIAGNOSIS');
  console.log('========================================\n');

  console.log('Current widths:');
  console.log(`   Line Container: ${audit.lineContainer.widthPx}px`);
  console.log(`   Main Line: ${audit.mainLine.widthPx}px`);
  console.log(`   Rightmost Milestone: ${audit.rightmostMilestone.leftPx}px\n`);

  if (audit.mainLine.widthPx < audit.rightmostMilestone.leftPx) {
    console.log('❌ ISSUE IDENTIFIED:');
    console.log('   The main timeline line is too short!');
    console.log(`   It needs to extend at least to ${audit.rightmostMilestone.leftPx}px`);
    console.log(`   Current: ${audit.mainLine.widthPx}px`);
    console.log(`   Shortfall: ${audit.rightmostMilestone.leftPx - audit.mainLine.widthPx}px\n`);
    console.log('💡 SOLUTION:');
    console.log(`   Increase .timeline-main-line width to at least ${audit.rightmostMilestone.leftPx + 100}px`);
    console.log(`   (or keep it at the original container width to match all milestones)\n`);
  }

  console.log('⏸️  Browser will stay open for 10 seconds for visual inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('✅ Audit complete!');
})();
