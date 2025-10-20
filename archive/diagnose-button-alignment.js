const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000); // Wait for animations and filter button to appear

  console.log('🖱️ Clicking filter button to expand...');
  await page.click('.new-filter-btn');
  await page.waitForTimeout(500); // Wait for expansion animation

  console.log('\n========================================');
  console.log('BUTTON & SVG SECTION ALIGNMENT ANALYSIS');
  console.log('========================================\n');

  const alignmentData = await page.evaluate(() => {
    const container = document.querySelector('.new-filter-container');
    const svg = document.getElementById('border-svg');
    const filterSections = document.getElementById('filter-sections');

    if (!container || !svg || !filterSections) {
      return { error: 'Required elements not found' };
    }

    const containerRect = container.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const svgPaths = filterSections.querySelectorAll('path');

    // Button selectors and their expected section index
    const buttons = [
      { selector: '.filter-operations', name: 'Operations', sectionIndex: 0 },
      { selector: '.filter-tech', name: 'Tech', sectionIndex: 1 },
      { selector: '.filter-completed', name: 'Completed', sectionIndex: 2 },
      { selector: '.new-filter-btn', name: 'Filter', sectionIndex: 3 },
      { selector: '.filter-in-progress', name: 'In Progress', sectionIndex: 4 },
      { selector: '.filter-future', name: 'Future', sectionIndex: 5 }
    ];

    const results = [];

    buttons.forEach(({ selector, name, sectionIndex }) => {
      const button = document.querySelector(selector);
      const svgPath = svgPaths[sectionIndex];

      if (!button || !svgPath) {
        results.push({
          name,
          error: 'Element not found',
          buttonFound: !!button,
          pathFound: !!svgPath
        });
        return;
      }

      const buttonRect = button.getBoundingClientRect();
      const pathBBox = svgPath.getBBox();

      // Calculate absolute positions
      const buttonCenterX = buttonRect.left + (buttonRect.width / 2);
      const buttonCenterY = buttonRect.top + (buttonRect.height / 2);

      // SVG path center in screen coordinates
      const pathCenterX = svgRect.left + pathBBox.x + (pathBBox.width / 2);
      const pathCenterY = svgRect.top + pathBBox.y + (pathBBox.height / 2);

      // Calculate offsets
      const offsetX = buttonCenterX - pathCenterX;
      const offsetY = buttonCenterY - pathCenterY;

      // Get computed styles
      const buttonStyle = window.getComputedStyle(button);

      results.push({
        name,
        button: {
          rect: {
            left: Math.round(buttonRect.left * 10) / 10,
            top: Math.round(buttonRect.top * 10) / 10,
            width: Math.round(buttonRect.width * 10) / 10,
            height: Math.round(buttonRect.height * 10) / 10,
            centerX: Math.round(buttonCenterX * 10) / 10,
            centerY: Math.round(buttonCenterY * 10) / 10
          },
          computed: {
            left: buttonStyle.left,
            top: buttonStyle.top,
            transform: buttonStyle.transform
          }
        },
        svgSection: {
          bbox: {
            x: Math.round(pathBBox.x * 10) / 10,
            y: Math.round(pathBBox.y * 10) / 10,
            width: Math.round(pathBBox.width * 10) / 10,
            height: Math.round(pathBBox.height * 10) / 10
          },
          screenPosition: {
            centerX: Math.round(pathCenterX * 10) / 10,
            centerY: Math.round(pathCenterY * 10) / 10
          }
        },
        offset: {
          x: Math.round(offsetX * 10) / 10,
          y: Math.round(offsetY * 10) / 10,
          aligned: Math.abs(offsetX) < 2 && Math.abs(offsetY) < 2
        }
      });
    });

    return {
      containerWidth: Math.round(containerRect.width * 10) / 10,
      svgWidth: Math.round(svgRect.width * 10) / 10,
      buttons: results
    };
  });

  if (alignmentData.error) {
    console.log('❌ ERROR:', alignmentData.error);
  } else {
    console.log(`Container Width: ${alignmentData.containerWidth}px`);
    console.log(`SVG Width: ${alignmentData.svgWidth}px\n`);

    alignmentData.buttons.forEach(buttonData => {
      const status = buttonData.offset?.aligned ? '✅' : '❌';
      console.log(`${status} ${buttonData.name}`);

      if (buttonData.error) {
        console.log(`   ERROR: ${buttonData.error}`);
        console.log(`   Button found: ${buttonData.buttonFound}, Path found: ${buttonData.pathFound}`);
      } else {
        console.log(`   Button Center: (${buttonData.button.rect.centerX}, ${buttonData.button.rect.centerY})`);
        console.log(`   Section Center: (${buttonData.svgSection.screenPosition.centerX}, ${buttonData.svgSection.screenPosition.centerY})`);
        console.log(`   Offset: X=${buttonData.offset.x}px, Y=${buttonData.offset.y}px`);
        console.log(`   Button CSS: left=${buttonData.button.computed.left}, top=${buttonData.button.computed.top}`);
        console.log(`   Transform: ${buttonData.button.computed.transform}`);
        console.log(`   Section BBox: x=${buttonData.svgSection.bbox.x}, width=${buttonData.svgSection.bbox.width}\n`);
      }
    });

    console.log('========================================');
    console.log('CORRECTIONS NEEDED');
    console.log('========================================\n');

    alignmentData.buttons.forEach(buttonData => {
      if (buttonData.offset && !buttonData.offset.aligned) {
        const correction = Math.round((buttonData.svgSection.bbox.x + buttonData.svgSection.bbox.width / 2) * 10) / 10;
        console.log(`${buttonData.name}:`);
        console.log(`   Current offset: ${buttonData.offset.x}px off horizontally`);
        console.log(`   Section center (relative to container): ${correction}px`);
        console.log(`   Suggested CSS: left: ${correction}px; transform: translateX(-50%);\n`);
      }
    });
  }

  await page.waitForTimeout(2000);
  await browser.close();
  console.log('✅ Diagnosis complete!');
})();
