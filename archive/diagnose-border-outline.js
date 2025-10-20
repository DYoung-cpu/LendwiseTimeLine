const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  // Expand filter
  console.log('🖱️ Expanding filter...');
  await page.click('.new-filter-btn');
  await page.waitForTimeout(700);

  console.log('\n========================================');
  console.log('BORDER OUTLINE AUDIT');
  console.log('========================================\n');

  const analysis = await page.evaluate(() => {
    const borderPath = document.getElementById('border-path');
    const filterSections = document.getElementById('filter-sections');
    const borderSvg = document.getElementById('border-svg');

    if (!borderPath || !filterSections) {
      return { error: 'Elements not found' };
    }

    const borderPathD = borderPath.getAttribute('d');
    const commands = borderPathD.match(/[MLQZ][^MLQZ]*/g);

    // Get filter section bounds
    const sectionPaths = Array.from(filterSections.querySelectorAll('path'));
    const firstSection = sectionPaths[0];
    const lastSection = sectionPaths[sectionPaths.length - 1];

    const firstRect = firstSection.getBoundingClientRect();
    const lastRect = lastSection.getBoundingClientRect();

    return {
      borderCommands: commands.map(cmd => cmd.substring(0, 50) + (cmd.length > 50 ? '...' : '')),
      filterBounds: {
        top: firstRect.top,
        bottom: firstRect.bottom,
        left: firstRect.left,
        right: lastRect.right
      },
      firstSection: {
        hasStroke: !!firstSection.getAttribute('stroke'),
        pathD: firstSection.getAttribute('d').substring(0, 100)
      },
      lastSection: {
        hasStroke: !!lastSection.getAttribute('stroke'),
        pathD: lastSection.getAttribute('d').substring(0, 100)
      }
    };
  });

  if (analysis.error) {
    console.log('❌ ERROR:', analysis.error);
    await browser.close();
    return;
  }

  console.log('📊 BORDER PATH COMMANDS:\n');
  analysis.borderCommands.forEach((cmd, i) => {
    console.log(`${i + 1}. ${cmd}`);
  });

  console.log('\n📊 FILTER SECTION PATHS:\n');
  console.log('First section:');
  console.log(`   Has stroke: ${analysis.firstSection.hasStroke}`);
  console.log(`   Path: ${analysis.firstSection.pathD}...\n`);

  console.log('Last section:');
  console.log(`   Has stroke: ${analysis.lastSection.hasStroke}`);
  console.log(`   Path: ${analysis.lastSection.pathD}...`);

  console.log('\n========================================');
  console.log('ISSUE ANALYSIS');
  console.log('========================================\n');

  console.log('❌ MISSING BORDERS:');
  console.log('1. Top border above filter buttons');
  console.log('2. Bottom border below filter buttons');
  console.log('3. Left/right edges of filter sections');
  console.log('\nRECOMMENDATION:');
  console.log('Add separate border path elements for:');
  console.log('- Top edge of filter container');
  console.log('- Bottom edge of filter container');
  console.log('- OR add stroke to all filter sections (not just first/last)');

  console.log('\n⏸️  Pausing for 5 seconds for visual inspection...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Audit complete!');
})();
