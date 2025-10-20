const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false }); // Visible to see what happens
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📡 Navigating to timeline page...');
  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(5000);

  console.log('\n========================================');
  console.log('RAPID CLICKING TEST (LIKE A USER)');
  console.log('========================================\n');

  const captureState = async (label) => {
    const state = await page.evaluate(() => {
      const filterBtn = document.querySelector('.new-filter-btn');
      const filterSpan = filterBtn?.querySelector('span');
      const container = document.querySelector('.new-filter-container');

      if (!filterBtn || !filterSpan) {
        return { error: 'Elements not found' };
      }

      const btnRect = filterBtn.getBoundingClientRect();
      const spanRect = filterSpan.getBoundingClientRect();
      const spanStyle = window.getComputedStyle(filterSpan);

      return {
        button: {
          centerX: Math.round(btnRect.left + btnRect.width / 2),
          cssLeft: window.getComputedStyle(filterBtn).left
        },
        span: {
          text: filterSpan.textContent.trim(),
          centerX: Math.round(spanRect.left + spanRect.width / 2),
          offsetFromButtonCenter: Math.round((spanRect.left + spanRect.width / 2) - (btnRect.left + btnRect.width / 2)),
          opacity: spanStyle.opacity,
          inlineStyle: filterSpan.getAttribute('style')
        },
        container: {
          width: Math.round(container.getBoundingClientRect().width),
          isExpanded: container.classList.contains('filter-expanded')
        }
      };
    });

    return { label, timestamp: Date.now(), ...state };
  };

  console.log('Starting rapid click test...\n');
  const states = [];

  // Capture initial
  states.push(await captureState('Initial'));

  // Rapid clicking like a user would (not waiting for full animation)
  for (let i = 1; i <= 6; i++) {
    console.log(`Click ${i}...`);
    await page.click('.new-filter-btn');

    // Capture immediately after click
    await page.waitForTimeout(50);
    states.push(await captureState(`After click ${i} (50ms)`));

    // Capture mid-animation
    await page.waitForTimeout(200);
    states.push(await captureState(`After click ${i} (250ms)`));

    // Capture after animation should be done
    await page.waitForTimeout(350);
    states.push(await captureState(`After click ${i} (600ms)`));
  }

  console.log('\n========================================');
  console.log('ANALYSIS OF ALL STATES');
  console.log('========================================\n');

  states.forEach((state, index) => {
    if (state.error) {
      console.log(`${state.label}: ERROR\n`);
      return;
    }

    const isExpanded = state.container.isExpanded ? '📂 OPEN' : '📁 CLOSED';
    console.log(`${state.label} ${isExpanded}:`);
    console.log(`   Container: ${state.container.width}px`);
    console.log(`   Button centerX: ${state.button.centerX}, CSS left: ${state.button.cssLeft}`);
    console.log(`   Span centerX: ${state.span.centerX}, offset: ${state.span.offsetFromButtonCenter}px`);

    if (state.span.inlineStyle) {
      console.log(`   ⚠️  Span inline: ${state.span.inlineStyle}`);
    }

    // Highlight if text shifted significantly
    if (index > 0 && !state.container.isExpanded) {
      const prevClosed = states.slice(0, index).reverse().find(s => !s.container.isExpanded);
      if (prevClosed) {
        const drift = state.span.offsetFromButtonCenter - prevClosed.span.offsetFromButtonCenter;
        if (Math.abs(drift) > 2) {
          console.log(`   ❌ TEXT SHIFTED ${drift}px from previous closed state!`);
        }
      }
    }

    console.log('');
  });

  console.log('\n========================================');
  console.log('CLOSED STATE COMPARISON');
  console.log('========================================\n');

  const closedStates = states.filter(s => !s.error && !s.container.isExpanded);
  if (closedStates.length > 0) {
    const baseline = closedStates[0];
    console.log(`Baseline: ${baseline.label}`);
    console.log(`   Offset: ${baseline.span.offsetFromButtonCenter}px\n`);

    closedStates.slice(1).forEach(state => {
      const drift = state.span.offsetFromButtonCenter - baseline.span.offsetFromButtonCenter;
      const status = Math.abs(drift) > 2 ? '❌' : '✅';
      console.log(`${status} ${state.label}:`);
      console.log(`   Offset: ${state.span.offsetFromButtonCenter}px (drift: ${drift}px)`);
      console.log('');
    });
  }

  console.log('\n⏸️  Pausing browser for 5 seconds so you can see the final state...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('✅ Diagnosis complete!');
})();
