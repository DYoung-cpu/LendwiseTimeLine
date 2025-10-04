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
  console.log('TIMELINE HEIGHT AUDIT - BEFORE CHANGES');
  console.log('========================================\n');

  const measurements = await page.evaluate(() => {
    const getStyles = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        height: styles.height,
        heightPx: parseInt(styles.height),
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        rect: {
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom)
        }
      };
    };

    // Get all milestone connector heights
    const milestoneConnectors = Array.from(document.querySelectorAll('.milestone-connector')).map((el, i) => {
      const styles = window.getComputedStyle(el);
      const label = el.closest('.timeline-milestone')?.querySelector('.milestone-label')?.textContent || `Milestone ${i+1}`;
      return {
        label,
        height: styles.height,
        heightPx: parseInt(styles.height)
      };
    });

    // Get milestone button heights
    const milestoneDots = Array.from(document.querySelectorAll('.milestone-dot')).map(el => {
      const styles = window.getComputedStyle(el);
      return {
        height: styles.height,
        heightPx: parseInt(styles.height),
        padding: styles.padding
      };
    });

    // Get star canvas dimensions
    const starCanvas = document.getElementById('timeline-stars');
    const starCanvasStyles = starCanvas ? {
      width: starCanvas.style.width,
      height: starCanvas.style.height,
      actualWidth: starCanvas.width,
      actualHeight: starCanvas.height
    } : null;

    return {
      roadmapTimeline: getStyles('.roadmap-timeline'),
      borderContainer: getStyles('.timeline-border-container'),
      viewport: getStyles('.timeline-viewport'),
      lineContainer: getStyles('.timeline-line-container'),
      navArrows: getStyles('.timeline-nav'),
      milestoneConnectors,
      milestoneDots,
      starCanvas: starCanvasStyles
    };
  });

  console.log('📊 MAIN CONTAINERS:');
  console.log('─────────────────────────────────────────\n');

  console.log('.roadmap-timeline:');
  console.log(`   Height: ${measurements.roadmapTimeline.rect.height}px`);
  console.log(`   Padding: ${measurements.roadmapTimeline.paddingTop} (top), ${measurements.roadmapTimeline.paddingBottom} (bottom)`);
  console.log(`   Margin: ${measurements.roadmapTimeline.marginTop} (top)\n`);

  console.log('.timeline-border-container:');
  console.log(`   Height: ${measurements.borderContainer.rect.height}px`);
  console.log(`   Padding: ${measurements.borderContainer.paddingTop} (top), ${measurements.borderContainer.paddingBottom} (bottom)`);
  console.log(`   Margin: ${measurements.borderContainer.marginTop} (top)\n`);

  console.log('.timeline-viewport:');
  console.log(`   Height: ${measurements.viewport.rect.height}px`);
  console.log(`   Padding: ${measurements.viewport.paddingTop} (top), ${measurements.viewport.paddingBottom} (bottom)\n`);

  console.log('.timeline-line-container:');
  console.log(`   Height: ${measurements.lineContainer.heightPx}px`);
  console.log(`   Padding: ${measurements.lineContainer.paddingLeft} (horizontal)\n`);

  console.log('📊 MILESTONE BUTTONS:');
  console.log('─────────────────────────────────────────\n');

  const uniqueDots = [...new Set(measurements.milestoneDots.map(d => JSON.stringify({h: d.heightPx, p: d.padding})))];
  uniqueDots.forEach(dotStr => {
    const dot = JSON.parse(dotStr);
    const count = measurements.milestoneDots.filter(d => d.heightPx === dot.h).length;
    console.log(`   ${count} buttons: ${dot.h}px height, padding: ${dot.p}`);
  });

  console.log('\n📊 MILESTONE CONNECTORS:');
  console.log('─────────────────────────────────────────\n');

  // Group by height
  const connectorHeights = {};
  measurements.milestoneConnectors.forEach(c => {
    if (!connectorHeights[c.heightPx]) {
      connectorHeights[c.heightPx] = [];
    }
    connectorHeights[c.heightPx].push(c.label);
  });

  Object.keys(connectorHeights).sort((a,b) => a-b).forEach(height => {
    console.log(`   ${height}px: ${connectorHeights[height].join(', ')}`);
  });

  if (measurements.navArrows) {
    console.log('\n📊 NAVIGATION ARROWS:');
    console.log('─────────────────────────────────────────\n');
    console.log(`   Size: ${measurements.navArrows.heightPx}px × ${measurements.navArrows.heightPx}px\n`);
  }

  if (measurements.starCanvas) {
    console.log('📊 STAR CANVAS (Background Animation):');
    console.log('─────────────────────────────────────────\n');
    console.log(`   Display size: ${measurements.starCanvas.width} × ${measurements.starCanvas.height}`);
    console.log(`   Actual canvas: ${measurements.starCanvas.actualWidth}px × ${measurements.starCanvas.actualHeight}px`);
    console.log(`   ✅ Canvas auto-resizes with container\n`);
  }

  console.log('📊 TOTAL HEIGHT CALCULATION:');
  console.log('─────────────────────────────────────────\n');
  console.log(`   roadmap-timeline total: ${measurements.roadmapTimeline.rect.height}px`);
  console.log(`   = border-container (${measurements.borderContainer.rect.height}px)`);
  console.log(`   + top/bottom spacing\n`);

  console.log('💡 HEIGHT REDUCTION OPPORTUNITIES:');
  console.log('─────────────────────────────────────────\n');

  const lineContainerReduction = Math.round(measurements.lineContainer.heightPx * 0.25);
  const paddingReduction = {
    top: Math.round(parseInt(measurements.roadmapTimeline.paddingTop) * 0.3),
    bottom: Math.round(parseInt(measurements.roadmapTimeline.paddingBottom) * 0.3)
  };

  console.log('   Timeline container height:');
  console.log(`     Current: ${measurements.lineContainer.heightPx}px`);
  console.log(`     Proposed: ${measurements.lineContainer.heightPx - lineContainerReduction}px (25% reduction)\n`);

  console.log('   Container padding:');
  console.log(`     Current: ${measurements.roadmapTimeline.paddingTop} top, ${measurements.roadmapTimeline.paddingBottom} bottom`);
  console.log(`     Proposed: ${parseInt(measurements.roadmapTimeline.paddingTop) - paddingReduction.top}px top, ${parseInt(measurements.roadmapTimeline.paddingBottom) - paddingReduction.bottom}px bottom\n`);

  console.log('   Estimated total height reduction: ~25-30%\n');

  console.log('⚠️  IMPORTANT CHECKS:');
  console.log('─────────────────────────────────────────\n');
  console.log('   ✅ Star canvas will auto-resize (uses getBoundingClientRect)');
  console.log('   ✅ Only changing HEIGHT/PADDING (no styling changes)');
  console.log('   ✅ All milestone connectors identified for proportional scaling');
  console.log('   ⚠️  Must verify after: buttons remain readable & clickable');
  console.log('   ⚠️  Must verify after: star density still looks good\n');

  console.log('⏸️  Browser will stay open for 10 seconds for visual inspection...\n');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('✅ Audit complete!');
})();
