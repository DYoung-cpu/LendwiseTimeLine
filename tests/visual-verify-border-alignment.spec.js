const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('Vision-guided border alignment - Auto-correction attempt', async ({ page }) => {
  // Navigate and wait for page load
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForTimeout(5000); // Wait for animations and JS initialization

  const timestamp = Date.now();

  // STEP 1: Capture BEFORE state (current broken state)
  await page.screenshot({
    path: `test-results/border-before-${timestamp}.png`,
    fullPage: false
  });

  const beforeState = await page.evaluate(() => {
    const filterContainer = document.querySelector('.new-filter-container');
    const filterBtn = document.querySelector('.new-filter-btn');
    const borderSvg = document.querySelector('.border-svg');
    const timeline = document.querySelector('.timeline-main-line');
    const borderPath = document.querySelector('#main-border-path');

    const getRect = (el) => el ? el.getBoundingClientRect() : null;
    const getComputedStyle = (el, prop) => el ? window.getComputedStyle(el).getPropertyValue(prop) : null;

    return {
      filterContainer: {
        rect: getRect(filterContainer),
        top: getComputedStyle(filterContainer, 'top'),
        transform: getComputedStyle(filterContainer, 'transform')
      },
      filterBtn: getRect(filterBtn),
      borderSvg: {
        rect: getRect(borderSvg),
        top: getComputedStyle(borderSvg, 'top'),
        height: getComputedStyle(borderSvg, 'height')
      },
      timeline: getRect(timeline),
      borderPath: borderPath ? borderPath.getAttribute('d') : null
    };
  });

  console.log('BEFORE state:', JSON.stringify(beforeState, null, 2));

  // STEP 2: Apply CSS fix via injection (Testing: .border-svg top: -35px)
  // This should move the border UP so the notch aligns with the filter button
  await page.addStyleTag({
    content: `
      .border-svg {
        top: -35px !important;
        height: calc(100% + 35px) !important;
      }
    `
  });

  console.log('CSS INJECTED: .border-svg { top: -35px; height: calc(100% + 35px); }');

  // STEP 3: Wait for rendering
  await page.waitForTimeout(1000);

  // STEP 4: Capture AFTER state
  await page.screenshot({
    path: `test-results/border-after-${timestamp}.png`,
    fullPage: false
  });

  const afterState = await page.evaluate(() => {
    const filterContainer = document.querySelector('.new-filter-container');
    const filterBtn = document.querySelector('.new-filter-btn');
    const borderSvg = document.querySelector('.border-svg');
    const timeline = document.querySelector('.timeline-main-line');

    const getRect = (el) => el ? el.getBoundingClientRect() : null;
    const getComputedStyle = (el, prop) => el ? window.getComputedStyle(el).getPropertyValue(prop) : null;

    return {
      filterContainer: {
        rect: getRect(filterContainer),
        top: getComputedStyle(filterContainer, 'top')
      },
      filterBtn: getRect(filterBtn),
      borderSvg: {
        rect: getRect(borderSvg),
        top: getComputedStyle(borderSvg, 'top'),
        height: getComputedStyle(borderSvg, 'height')
      },
      timeline: getRect(timeline)
    };
  });

  console.log('AFTER state:', JSON.stringify(afterState, null, 2));

  // STEP 5: Calculate analysis
  const analysis = {
    borderSvgTopChange: {
      before: beforeState.borderSvg.top,
      after: afterState.borderSvg.top,
      changed: beforeState.borderSvg.top !== afterState.borderSvg.top
    },
    borderSvgHeightChange: {
      before: beforeState.borderSvg.height,
      after: afterState.borderSvg.height,
      changed: beforeState.borderSvg.height !== afterState.borderSvg.height
    },
    timelineShift: beforeState.timeline && afterState.timeline ?
      afterState.timeline.top - beforeState.timeline.top : 0,
    filterButtonShift: beforeState.filterBtn && afterState.filterBtn ?
      afterState.filterBtn.top - beforeState.filterBtn.top : 0
  };

  console.log('ANALYSIS:', JSON.stringify(analysis, null, 2));

  // STEP 6: Determine pass/fail
  // The CSS injection should have moved the border up (negative top value)
  // The timeline should NOT have shifted (unintended layout shift)
  // The filter button should remain in same position (only border should move)

  const cssApplied = afterState.borderSvg.top === '-35px';
  const noTimelineShift = Math.abs(analysis.timelineShift) < 2;
  const noFilterShift = Math.abs(analysis.filterButtonShift) < 2;

  console.log('VERIFICATION:');
  console.log('  CSS Applied:', cssApplied);
  console.log('  No Timeline Shift:', noTimelineShift, `(shift: ${analysis.timelineShift}px)`);
  console.log('  No Filter Button Shift:', noFilterShift, `(shift: ${analysis.filterButtonShift}px)`);

  const passed = cssApplied && noTimelineShift && noFilterShift;

  if (!passed) {
    const correction = {
      issue: !cssApplied ? 'CSS injection failed' :
             !noTimelineShift ? 'Unintended timeline shift detected' :
             'Unintended filter button shift detected',
      cssApplied: cssApplied,
      timelineShift: analysis.timelineShift,
      filterButtonShift: analysis.filterButtonShift,
      recommendation: !cssApplied ? 'Check CSS specificity - may need more specific selector' :
                      !noTimelineShift ? 'Border positioning affecting timeline - investigate layout' :
                      'Filter button moved unexpectedly - investigate container positioning'
    };

    console.log('CORRECTION NEEDED:', JSON.stringify(correction, null, 2));

    throw new Error(JSON.stringify({
      passed: false,
      correction: correction,
      screenshots: {
        before: `test-results/border-before-${timestamp}.png`,
        after: `test-results/border-after-${timestamp}.png`
      },
      analysis: analysis
    }, null, 2));
  }

  console.log('TEST PASSED ✅');
  console.log('Screenshots:', {
    before: `test-results/border-before-${timestamp}.png`,
    after: `test-results/border-after-${timestamp}.png`
  });
  console.log('READY TO WRITE TO FILES: .border-svg { top: -35px; height: calc(100% + 35px); }');
});
