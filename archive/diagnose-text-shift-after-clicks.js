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
  console.log('TESTING FILTER TEXT POSITION AFTER MULTIPLE CLICKS');
  console.log('========================================\n');

  const captureClosedState = async (cycleNum) => {
    // Wait a bit to ensure animations are complete
    await page.waitForTimeout(800);

    const state = await page.evaluate(() => {
      const filterBtn = document.querySelector('.new-filter-btn');
      const filterSpan = filterBtn?.querySelector('span');
      const filterIcon = filterBtn?.querySelector('.filter-icon');
      const container = document.querySelector('.new-filter-container');

      if (!filterBtn || !filterSpan) {
        return { error: 'Elements not found' };
      }

      const btnRect = filterBtn.getBoundingClientRect();
      const spanRect = filterSpan.getBoundingClientRect();
      const btnStyle = window.getComputedStyle(filterBtn);
      const spanStyle = window.getComputedStyle(filterSpan);

      return {
        button: {
          centerX: Math.round(btnRect.left + btnRect.width / 2),
          cssLeft: btnStyle.left,
          cssTransform: btnStyle.transform,
          inlineStyle: filterBtn.getAttribute('style')
        },
        span: {
          text: filterSpan.textContent,
          centerX: Math.round(spanRect.left + spanRect.width / 2),
          offsetFromButtonCenter: Math.round((spanRect.left + spanRect.width / 2) - (btnRect.left + btnRect.width / 2)),
          cssPosition: spanStyle.position,
          cssLeft: spanStyle.left,
          cssTransform: spanStyle.transform,
          cssOpacity: spanStyle.opacity,
          cssTransition: spanStyle.transition,
          inlineStyle: filterSpan.getAttribute('style')
        },
        container: {
          width: Math.round(container.getBoundingClientRect().width),
          isExpanded: container.classList.contains('filter-expanded')
        }
      };
    });

    return { cycle: cycleNum, ...state };
  };

  const cycles = 5; // Test 5 cycles
  const closedStates = [];

  for (let i = 0; i < cycles; i++) {
    console.log(`\n━━━ CYCLE ${i + 1} ━━━`);

    // Capture closed state before clicking
    console.log('Capturing closed state...');
    const closedState = await captureClosedState(i + 1);
    closedStates.push(closedState);

    // Click to open
    console.log('Clicking to OPEN...');
    await page.click('.new-filter-btn');
    await page.waitForTimeout(700);

    // Click to close
    console.log('Clicking to CLOSE...');
    await page.click('.new-filter-btn');
  }

  // Final closed state
  console.log('\n━━━ FINAL STATE ━━━');
  const finalState = await captureClosedState('FINAL');
  closedStates.push(finalState);

  console.log('\n========================================');
  console.log('ANALYSIS OF CLOSED STATES');
  console.log('========================================\n');

  const baseline = closedStates[0];
  console.log(`📊 BASELINE (Initial Closed):`);
  console.log(`   Button centerX: ${baseline.button.centerX}`);
  console.log(`   Span centerX: ${baseline.span.centerX}`);
  console.log(`   Offset from button center: ${baseline.span.offsetFromButtonCenter}px`);
  console.log(`   Span CSS opacity: ${baseline.span.cssOpacity}`);
  console.log(`   Span CSS transition: ${baseline.span.cssTransition}`);
  if (baseline.span.inlineStyle) {
    console.log(`   ⚠️  Span inline style: ${baseline.span.inlineStyle}`);
  }
  console.log('');

  console.log(`📈 DRIFT ANALYSIS:\n`);

  closedStates.slice(1).forEach(state => {
    const offsetDrift = state.span.offsetFromButtonCenter - baseline.span.offsetFromButtonCenter;
    const btnDrift = state.button.centerX - baseline.button.centerX;
    const spanDrift = state.span.centerX - baseline.span.centerX;

    console.log(`Cycle ${state.cycle}:`);
    console.log(`   Span offset: ${state.span.offsetFromButtonCenter}px (drift: ${offsetDrift}px)`);
    console.log(`   Button centerX: ${state.button.centerX} (drift: ${btnDrift}px)`);
    console.log(`   Span centerX: ${state.span.centerX} (drift: ${spanDrift}px)`);

    if (Math.abs(offsetDrift) > 2) {
      console.log(`   ❌ TEXT MISALIGNMENT DETECTED!`);
    } else {
      console.log(`   ✅ Text aligned correctly`);
    }

    if (state.span.inlineStyle) {
      console.log(`   ⚠️  Span inline style: ${state.span.inlineStyle}`);
    }

    console.log('');
  });

  console.log('\n========================================');
  console.log('INLINE STYLE ACCUMULATION CHECK');
  console.log('========================================\n');

  const statesWithInlineStyles = closedStates.filter(s =>
    !s.error && (s.button.inlineStyle || s.span.inlineStyle)
  );

  if (statesWithInlineStyles.length > 0) {
    console.log('❌ INLINE STYLES FOUND (potential cause of drift):\n');
    statesWithInlineStyles.forEach(s => {
      console.log(`Cycle ${s.cycle}:`);
      if (s.button.inlineStyle) console.log(`   Button: ${s.button.inlineStyle}`);
      if (s.span.inlineStyle) console.log(`   Span: ${s.span.inlineStyle}`);
      console.log('');
    });

    console.log('ISSUE: Inline styles are not being cleared between cycles.');
    console.log('These accumulate and override CSS, causing position drift.\n');
  } else {
    console.log('✅ No inline styles detected\n');
  }

  await browser.close();
  console.log('✅ Diagnosis complete!');
})();
