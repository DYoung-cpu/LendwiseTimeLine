const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  console.log('\n========================================');
  console.log('ANALYZING FILTER ANIMATION');
  console.log('========================================\n');

  // Function to capture button states
  const captureState = async (label) => {
    const state = await page.evaluate(() => {
      const buttons = [
        { selector: '.new-filter-btn', name: 'Filter' },
        { selector: '.filter-operations', name: 'Operations' },
        { selector: '.filter-tech', name: 'Tech' },
        { selector: '.filter-completed', name: 'Completed' },
        { selector: '.filter-in-progress', name: 'In Progress' },
        { selector: '.filter-future', name: 'Future' }
      ];

      const results = [];

      buttons.forEach(({ selector, name }) => {
        const element = document.querySelector(selector);
        if (!element) {
          results.push({ name, error: 'Not found' });
          return;
        }

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        results.push({
          name,
          position: {
            left: Math.round(rect.left * 10) / 10,
            top: Math.round(rect.top * 10) / 10,
            centerX: Math.round((rect.left + rect.width / 2) * 10) / 10,
            centerY: Math.round((rect.top + rect.height / 2) * 10) / 10
          },
          css: {
            left: style.left,
            top: style.top,
            transform: style.transform,
            opacity: style.opacity,
            visibility: style.visibility
          },
          text: element.textContent.trim().substring(0, 20)
        });
      });

      const container = document.querySelector('.new-filter-container');
      const isExpanded = container?.classList.contains('filter-expanded');

      return {
        buttons: results,
        isExpanded,
        containerWidth: container?.getBoundingClientRect().width
      };
    });

    return { label, ...state };
  };

  // Capture initial state
  console.log('📸 Capturing CLOSED state...');
  const closedState = await captureState('CLOSED');

  // Click to open
  console.log('🖱️ Clicking to OPEN...');
  await page.click('.new-filter-btn');

  // Capture states during animation
  console.log('📸 Capturing states during OPENING...');
  await page.waitForTimeout(50); // Immediate after click
  const opening1 = await captureState('OPENING (50ms)');

  await page.waitForTimeout(150); // Mid-animation
  const opening2 = await captureState('OPENING (200ms)');

  await page.waitForTimeout(200); // Near end
  const opening3 = await captureState('OPENING (400ms)');

  await page.waitForTimeout(200); // After animation complete
  const openedState = await captureState('OPENED (600ms)');

  // Click to close
  console.log('🖱️ Clicking to CLOSE...');
  await page.click('.new-filter-btn');

  // Capture states during close animation
  console.log('📸 Capturing states during CLOSING...');
  await page.waitForTimeout(50);
  const closing1 = await captureState('CLOSING (50ms)');

  await page.waitForTimeout(150);
  const closing2 = await captureState('CLOSING (200ms)');

  await page.waitForTimeout(200);
  const closing3 = await captureState('CLOSING (400ms)');

  await page.waitForTimeout(200);
  const closedAgain = await captureState('CLOSED AGAIN (600ms)');

  // Analyze the captured states
  console.log('\n========================================');
  console.log('ANIMATION ANALYSIS');
  console.log('========================================\n');

  const allStates = [closedState, opening1, opening2, opening3, openedState, closing1, closing2, closing3, closedAgain];

  // Track Operations button as reference (should be visible when expanded)
  console.log('📊 Operations Button Movement:\n');
  allStates.forEach(state => {
    const ops = state.buttons.find(b => b.name === 'Operations');
    if (ops && !ops.error) {
      console.log(`${state.label}:`);
      console.log(`   Position: (${ops.position.centerX}, ${ops.position.centerY})`);
      console.log(`   CSS Left: ${ops.css.left}, Top: ${ops.css.top}`);
      console.log(`   Transform: ${ops.css.transform}`);
      console.log(`   Opacity: ${ops.css.opacity}, Visibility: ${ops.css.visibility}`);
      console.log('');
    }
  });

  console.log('📊 Filter Button Movement:\n');
  allStates.forEach(state => {
    const filter = state.buttons.find(b => b.name === 'Filter');
    if (filter && !filter.error) {
      console.log(`${state.label}:`);
      console.log(`   Position: (${filter.position.centerX}, ${filter.position.centerY})`);
      console.log(`   CSS Left: ${filter.css.left}, Top: ${filter.css.top}`);
      console.log(`   Transform: ${filter.css.transform}`);
      console.log(`   Container expanded: ${state.isExpanded}, Width: ${state.containerWidth}px`);
      console.log('');
    }
  });

  console.log('\n========================================');
  console.log('ISSUES DETECTED');
  console.log('========================================\n');

  // Check for position jumps
  const detectJumps = (buttonName) => {
    const buttonStates = allStates.map(s => {
      const btn = s.buttons.find(b => b.name === buttonName);
      return btn && !btn.error ? { label: s.label, x: btn.position.centerX, y: btn.position.centerY, transform: btn.css.transform } : null;
    }).filter(b => b !== null);

    const issues = [];
    for (let i = 1; i < buttonStates.length; i++) {
      const prev = buttonStates[i - 1];
      const curr = buttonStates[i];
      const jumpX = Math.abs(curr.x - prev.x);
      const jumpY = Math.abs(curr.y - prev.y);

      // Detect sudden jumps (>50px is suspicious)
      if (jumpX > 50 || jumpY > 50) {
        issues.push({
          button: buttonName,
          from: prev.label,
          to: curr.label,
          jumpX,
          jumpY,
          prevTransform: prev.transform,
          currTransform: curr.transform
        });
      }
    }
    return issues;
  };

  const buttonNames = ['Filter', 'Operations', 'Tech', 'Completed', 'In Progress', 'Future'];
  const allIssues = [];

  buttonNames.forEach(name => {
    const issues = detectJumps(name);
    allIssues.push(...issues);
  });

  if (allIssues.length > 0) {
    console.log('❌ POSITION JUMPS DETECTED:\n');
    allIssues.forEach(issue => {
      console.log(`   ${issue.button}: ${issue.from} → ${issue.to}`);
      console.log(`      Jump: X=${Math.round(issue.jumpX)}px, Y=${Math.round(issue.jumpY)}px`);
      console.log(`      Transform changed: ${issue.prevTransform} → ${issue.currTransform}`);
      console.log('');
    });
  } else {
    console.log('✅ No significant position jumps detected');
  }

  // Check transform consistency
  console.log('\n========================================');
  console.log('TRANSFORM ANALYSIS');
  console.log('========================================\n');

  const checkTransforms = (buttonName) => {
    const buttonStates = allStates.map(s => {
      const btn = s.buttons.find(b => b.name === buttonName);
      return btn && !btn.error ? { label: s.label, transform: btn.css.transform } : null;
    }).filter(b => b !== null);

    console.log(`${buttonName}:`);
    buttonStates.forEach(state => {
      console.log(`   ${state.label}: ${state.transform}`);
    });
    console.log('');
  };

  ['Operations', 'Filter'].forEach(checkTransforms);

  await browser.close();
  console.log('✅ Animation diagnosis complete!');
})();
