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
  console.log('TRACKING TEXT MOVEMENT DURING ANIMATION');
  console.log('========================================\n');

  const captureTextPosition = async (label) => {
    const state = await page.evaluate(() => {
      const filterBtn = document.querySelector('.new-filter-btn');
      const filterSpan = filterBtn?.querySelector('span');

      if (!filterBtn || !filterSpan) {
        return { error: 'Elements not found' };
      }

      const btnRect = filterBtn.getBoundingClientRect();
      const spanRect = filterSpan.getBoundingClientRect();
      const spanStyle = window.getComputedStyle(filterSpan);

      return {
        button: {
          left: Math.round(btnRect.left),
          centerX: Math.round(btnRect.left + btnRect.width / 2),
          width: Math.round(btnRect.width)
        },
        span: {
          left: Math.round(spanRect.left),
          centerX: Math.round(spanRect.left + spanRect.width / 2),
          width: Math.round(spanRect.width),
          text: filterSpan.textContent,
          opacity: spanStyle.opacity
        },
        offset: Math.round((spanRect.left + spanRect.width / 2) - (btnRect.left + btnRect.width / 2))
      };
    });

    return { label, timestamp: Date.now(), ...state };
  };

  // Capture during opening
  console.log('Capturing CLOSED state...');
  const states = [];
  states.push(await captureTextPosition('Initial Closed'));

  console.log('Clicking to OPEN...');
  await page.click('.new-filter-btn');

  // Rapid sampling during animation
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(40);
    states.push(await captureTextPosition(`Opening ${i * 40}ms`));
  }

  await page.waitForTimeout(200);
  states.push(await captureTextPosition('Opened Final'));

  console.log('\n📊 TEXT POSITION DURING OPENING:\n');

  const firstState = states[0];
  states.forEach((state, index) => {
    if (state.error) {
      console.log(`${state.label}: ERROR`);
      return;
    }

    const btnMovement = state.button.centerX - firstState.button.centerX;
    const spanMovement = state.span.centerX - firstState.span.centerX;

    console.log(`${state.label}:`);
    console.log(`   Button centerX: ${state.button.centerX} (moved ${btnMovement}px)`);
    console.log(`   Span centerX: ${state.span.centerX} (moved ${spanMovement}px, opacity: ${state.span.opacity})`);
    console.log(`   Offset from button center: ${state.offset}px`);

    if (index > 0) {
      const prevState = states[index - 1];
      const btnDelta = state.button.centerX - prevState.button.centerX;
      const spanDelta = state.span.centerX - prevState.span.centerX;

      if (Math.abs(btnDelta) > 0 || Math.abs(spanDelta) > 0) {
        console.log(`   → Button moved ${btnDelta}px, Span moved ${spanDelta}px from previous`);
      }
    }
    console.log('');
  });

  console.log('\n========================================');
  console.log('ISSUE ANALYSIS');
  console.log('========================================\n');

  // Check if span moves with button or independently
  const movements = states.slice(1).map((state, i) => {
    const prev = states[i];
    return {
      label: state.label,
      buttonDelta: state.button.centerX - prev.button.centerX,
      spanDelta: state.span.centerX - prev.span.centerX,
      matching: Math.abs((state.button.centerX - prev.button.centerX) - (state.span.centerX - prev.span.centerX)) < 2
    };
  });

  const movingTogether = movements.filter(m => Math.abs(m.buttonDelta) > 0).every(m => m.matching);

  if (movingTogether) {
    console.log('❌ ISSUE: Text moves horizontally WITH the button during opening');
    console.log('   This creates a sliding effect instead of fade-in');
    console.log('   Solution: Text should fade while button slides, not move with it\n');
  } else {
    console.log('✅ Text movement is independent from button movement\n');
  }

  // Check for offset issues
  const offsets = states.map(s => s.offset);
  const minOffset = Math.min(...offsets);
  const maxOffset = Math.max(...offsets);

  if (maxOffset - minOffset > 5) {
    console.log(`❌ ISSUE: Text offset varies by ${maxOffset - minOffset}px during animation`);
    console.log(`   Min: ${minOffset}px, Max: ${maxOffset}px\n`);
  } else {
    console.log(`✅ Text offset consistent: ${offsets[0]}px (±${Math.round((maxOffset - minOffset) * 10) / 10}px)\n`);
  }

  await browser.close();
  console.log('✅ Text movement diagnosis complete!');
})();
