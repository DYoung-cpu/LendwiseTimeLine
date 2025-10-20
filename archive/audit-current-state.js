const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser with cache disabled...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Disable cache to ensure fresh load
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  // Disable cache at page level
  await page.route('**/*', (route) => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  });

  console.log('📡 Navigating to timeline page (cache bypassed)...');
  await page.goto('http://localhost:8000/timeline-dev.html', {
    waitUntil: 'networkidle',
    timeout: 10000
  });
  await page.waitForTimeout(2000);

  console.log('\n========================================');
  console.log('AUDIT: CURRENT STATE ANALYSIS');
  console.log('========================================\n');

  const fullAnalysis = await page.evaluate(() => {
    const borderContainer = document.querySelector('.timeline-border-container');
    const filterContainer = document.querySelector('.new-filter-container');
    const timeline = document.querySelector('.timeline-viewport');

    // Get all CSS files loaded
    const cssFiles = Array.from(document.styleSheets).map(sheet => ({
      href: sheet.href,
      disabled: sheet.disabled
    }));

    // Get computed styles
    const containerStyle = window.getComputedStyle(borderContainer);
    const containerRect = borderContainer.getBoundingClientRect();
    const filterRect = filterContainer.getBoundingClientRect();
    const timelineRect = timeline.getBoundingClientRect();

    // Extract version from CSS link
    const cssLink = document.querySelector('link[rel="stylesheet"][href*="timeline-clean-test.css"]');
    const cssVersion = cssLink ? cssLink.href.match(/v=(\d+)/)?.[1] : 'NOT FOUND';

    return {
      cssInfo: {
        version: cssVersion,
        fullHref: cssLink ? cssLink.href : 'NOT FOUND',
        allStylesheets: cssFiles
      },
      borderContainer: {
        paddingTop: containerStyle.paddingTop,
        paddingBottom: containerStyle.paddingBottom,
        paddingLeft: containerStyle.paddingLeft,
        paddingRight: containerStyle.paddingRight,
        height: containerStyle.height,
        position: {
          top: Math.round(containerRect.top),
          bottom: Math.round(containerRect.bottom),
          height: Math.round(containerRect.height)
        }
      },
      filterContainer: {
        position: {
          bottom: Math.round(filterRect.bottom)
        }
      },
      timeline: {
        position: {
          top: Math.round(timelineRect.top)
        }
      },
      spacing: {
        filterToTimeline: Math.round(timelineRect.top - filterRect.bottom)
      }
    };
  });

  console.log('📄 CSS FILE INFO:\n');
  console.log(`   Version Parameter: ${fullAnalysis.cssInfo.version}`);
  console.log(`   Full URL: ${fullAnalysis.cssInfo.fullHref}`);
  console.log(`\n   Expected Version: 20251003135600`);
  console.log(`   ${fullAnalysis.cssInfo.version === '20251003135600' ? '✅ MATCHES' : '❌ MISMATCH - CACHE ISSUE!'}\n`);

  console.log('📊 TIMELINE BORDER CONTAINER:\n');
  console.log('   Padding:');
  console.log(`      Top: ${fullAnalysis.borderContainer.paddingTop}`);
  console.log(`      Bottom: ${fullAnalysis.borderContainer.paddingBottom}`);
  console.log(`      Left: ${fullAnalysis.borderContainer.paddingLeft}`);
  console.log(`      Right: ${fullAnalysis.borderContainer.paddingRight}`);

  console.log(`\n   Expected Padding: 19px (after reductions)`);
  console.log(`   Actual Top: ${fullAnalysis.borderContainer.paddingTop} ${fullAnalysis.borderContainer.paddingTop === '19px' ? '✅' : '❌ WRONG!'}`);
  console.log(`   Actual Bottom: ${fullAnalysis.borderContainer.paddingBottom} ${fullAnalysis.borderContainer.paddingBottom === '19px' ? '✅' : '❌ WRONG!'}`);

  console.log(`\n   Height: ${fullAnalysis.borderContainer.position.height}px`);

  console.log('\n📊 SPACING MEASUREMENTS:\n');
  console.log(`   Filter Bottom: ${fullAnalysis.filterContainer.position.bottom}px`);
  console.log(`   Timeline Top: ${fullAnalysis.timeline.position.top}px`);
  console.log(`   Gap: ${fullAnalysis.spacing.filterToTimeline}px`);

  // Now check what the CSS file actually says
  console.log('\n========================================');
  console.log('CHECKING CSS FILE DIRECTLY');
  console.log('========================================\n');

  const cssContent = await page.evaluate(async () => {
    try {
      const cssLink = document.querySelector('link[rel="stylesheet"][href*="timeline-clean-test.css"]');
      const response = await fetch(cssLink.href, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const text = await response.text();

      // Extract .timeline-border-container padding rules
      const containerMatch = text.match(/\.timeline-border-container\s*{[^}]*padding:\s*([^;]+);/);
      const expandedMatch = text.match(/\.timeline-border-container\.filter-expanded\s*{[^}]*padding:\s*([^;]+);/);

      return {
        containerPadding: containerMatch ? containerMatch[1] : 'NOT FOUND',
        expandedPadding: expandedMatch ? expandedMatch[1] : 'NOT FOUND'
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('CSS File Contents:');
  console.log(`   .timeline-border-container padding: ${cssContent.containerPadding}`);
  console.log(`   .timeline-border-container.filter-expanded padding: ${cssContent.expandedPadding}`);

  console.log('\n========================================');
  console.log('DIAGNOSIS');
  console.log('========================================\n');

  const versionMatch = fullAnalysis.cssInfo.version === '20251003135600';
  const paddingMatch = fullAnalysis.borderContainer.paddingTop === '19px';

  if (!versionMatch) {
    console.log('❌ CSS VERSION MISMATCH');
    console.log('   The browser is loading an OLD cached version of the CSS file.');
    console.log(`   Browser has: v=${fullAnalysis.cssInfo.version}`);
    console.log('   Expected: v=20251003135600');
    console.log('\n   SOLUTIONS:');
    console.log('   1. Server-side cache needs to be cleared');
    console.log('   2. Use a timestamp-based versioning system');
    console.log('   3. Check if local server is caching files\n');
  } else if (!paddingMatch) {
    console.log('❌ PADDING MISMATCH');
    console.log('   CSS version is correct but padding value is wrong.');
    console.log(`   CSS file says: ${cssContent.containerPadding}`);
    console.log(`   Browser computed: ${fullAnalysis.borderContainer.paddingTop}`);
    console.log('\n   POSSIBLE CAUSES:');
    console.log('   1. CSS specificity conflict (another rule overriding)');
    console.log('   2. Inline styles overriding CSS');
    console.log('   3. JavaScript dynamically changing padding\n');
  } else {
    console.log('✅ ALL CHECKS PASSED');
    console.log('   CSS version is correct');
    console.log('   Padding values are correct (19px)');
    console.log('\n   If visual change is still not apparent, the 37% reduction');
    console.log('   from 30px to 19px may be too subtle to notice visually.');
  }

  console.log('\n⏸️  Pausing for visual inspection (browser will stay open)...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Audit complete!');
})();
