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
  console.log('TESTING MULTIPLE OPEN/CLOSE CYCLES');
  console.log('========================================\n');

  const captureFilterState = async (label) => {
    const state = await page.evaluate(() => {
      const filterBtn = document.querySelector('.new-filter-btn');
      const filterSpan = filterBtn?.querySelector('span');
      const filterIcon = filterBtn?.querySelector('.filter-icon');
      const container = document.querySelector('.new-filter-container');

      if (!filterBtn) return { error: 'Filter button not found' };

      const btnRect = filterBtn.getBoundingClientRect();
      const btnStyle = window.getComputedStyle(filterBtn);

      let spanInfo = null;
      if (filterSpan) {
        const spanRect = filterSpan.getBoundingClientRect();
        const spanStyle = window.getComputedStyle(filterSpan);
        spanInfo = {
          text: filterSpan.textContent,
          position: {
            left: Math.round(spanRect.left * 10) / 10,
            top: Math.round(spanRect.top * 10) / 10,
            centerX: Math.round((spanRect.left + spanRect.width / 2) * 10) / 10
          },
          css: {
            position: spanStyle.position,
            left: spanStyle.left,
            top: spanStyle.top,
            transform: spanStyle.transform,
            display: spanStyle.display
          },
          inlineStyle: filterSpan.getAttribute('style')
        };
      }

      let iconInfo = null;
      if (filterIcon) {
        const iconRect = filterIcon.getBoundingClientRect();
        iconInfo = {
          position: {
            left: Math.round(iconRect.left * 10) / 10,
            width: Math.round(iconRect.width * 10) / 10
          }
        };
      }

      const containerStyle = window.getComputedStyle(container);

      return {
        button: {
          position: {
            left: Math.round(btnRect.left * 10) / 10,
            centerX: Math.round((btnRect.left + btnRect.width / 2) * 10) / 10,
            width: Math.round(btnRect.width * 10) / 10
          },
          css: {
            left: btnStyle.left,
            transform: btnStyle.transform,
            gap: btnStyle.gap
          },
          inlineStyle: filterBtn.getAttribute('style')
        },
        span: spanInfo,
        icon: iconInfo,
        container: {
          width: Math.round(container.getBoundingClientRect().width * 10) / 10,
          isExpanded: container.classList.contains('filter-expanded')
        }
      };
    });

    return { label, ...state };
  };

  // Test multiple cycles
  const cycles = 3;
  const allStates = [];

  for (let i = 0; i < cycles; i++) {
    console.log(`\n━━━ CYCLE ${i + 1} ━━━\n`);

    // Capture closed state
    const closedState = await captureFilterState(`Cycle ${i + 1} - CLOSED`);
    allStates.push(closedState);

    // Click to open
    console.log(`Clicking to OPEN (cycle ${i + 1})...`);
    await page.click('.new-filter-btn');
    await page.waitForTimeout(700); // Wait for animation to complete

    // Capture opened state
    const openedState = await captureFilterState(`Cycle ${i + 1} - OPENED`);
    allStates.push(openedState);

    // Click to close
    console.log(`Clicking to CLOSE (cycle ${i + 1})...`);
    await page.click('.new-filter-btn');
    await page.waitForTimeout(700); // Wait for animation to complete
  }

  // Final closed state
  const finalClosed = await captureFilterState('FINAL CLOSED');
  allStates.push(finalClosed);

  console.log('\n========================================');
  console.log('STATE ANALYSIS');
  console.log('========================================\n');

  allStates.forEach(state => {
    if (state.error) {
      console.log(`❌ ${state.label}: ${state.error}\n`);
      return;
    }

    console.log(`📊 ${state.label}:`);
    console.log(`   Container: width=${state.container.width}px, expanded=${state.container.isExpanded}`);
    console.log(`   Button: centerX=${state.button.position.centerX}, css.left=${state.button.css.left}`);
    console.log(`   Button transform: ${state.button.css.transform}`);
    if (state.button.inlineStyle) {
      console.log(`   ⚠️  Button inline style: ${state.button.inlineStyle}`);
    }

    if (state.span) {
      console.log(`   Span text: "${state.span.text}"`);
      console.log(`   Span centerX: ${state.span.position.centerX}`);
      console.log(`   Span css.transform: ${state.span.css.transform}`);
      if (state.span.inlineStyle) {
        console.log(`   ⚠️  Span inline style: ${state.span.inlineStyle}`);
      }
    }

    if (state.icon) {
      console.log(`   Icon left: ${state.icon.position.left}, width: ${state.icon.position.width}`);
    }
    console.log('');
  });

  console.log('\n========================================');
  console.log('ISSUES DETECTED');
  console.log('========================================\n');

  // Check for accumulating inline styles
  const inlineStyleIssues = allStates.filter(s =>
    !s.error && (s.button.inlineStyle || (s.span && s.span.inlineStyle))
  );

  if (inlineStyleIssues.length > 0) {
    console.log('❌ INLINE STYLES DETECTED (may cause accumulation issues):\n');
    inlineStyleIssues.forEach(s => {
      console.log(`   ${s.label}:`);
      if (s.button.inlineStyle) console.log(`      Button: ${s.button.inlineStyle}`);
      if (s.span?.inlineStyle) console.log(`      Span: ${s.span.inlineStyle}`);
      console.log('');
    });
  }

  // Check for text position drift across cycles
  const closedStates = allStates.filter(s => !s.error && !s.container.isExpanded);
  if (closedStates.length > 1) {
    console.log('📈 CLOSED STATE COMPARISON:\n');
    const firstClosed = closedStates[0];
    console.log(`   Initial (${firstClosed.label}):`);
    console.log(`      Span centerX: ${firstClosed.span?.position.centerX}`);
    console.log(`      Button centerX: ${firstClosed.button.position.centerX}`);
    console.log('');

    closedStates.slice(1).forEach(state => {
      const spanDrift = state.span && firstClosed.span
        ? state.span.position.centerX - firstClosed.span.position.centerX
        : 0;
      const btnDrift = state.button.position.centerX - firstClosed.button.position.centerX;

      console.log(`   ${state.label}:`);
      console.log(`      Span centerX: ${state.span?.position.centerX} (drift: ${Math.round(spanDrift * 10) / 10}px)`);
      console.log(`      Button centerX: ${state.button.position.centerX} (drift: ${Math.round(btnDrift * 10) / 10}px)`);

      if (Math.abs(spanDrift) > 5 || Math.abs(btnDrift) > 5) {
        console.log(`      ❌ SIGNIFICANT DRIFT DETECTED!`);
      }
      console.log('');
    });
  }

  await browser.close();
  console.log('✅ Multi-click diagnosis complete!');
})();
