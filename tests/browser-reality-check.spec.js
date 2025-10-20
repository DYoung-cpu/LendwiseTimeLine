const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('Browser Reality Check - Filter Container CSS Diagnostic', async ({ page }) => {
  console.log('\n=== BROWSER REALITY CHECK - FILTER CONTAINER ===\n');

  // Navigate to page
  await page.goto('http://localhost:3005/timeline-dev.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for any JS modifications

  const diagnostic = {
    element: {},
    selectors: {},
    computedStyles: {},
    cssFile: {},
    injectionTest: {},
    rootCause: '',
    fix: ''
  };

  // ===== 1. ELEMENT INSPECTION =====
  console.log('1. ELEMENT INSPECTION');
  console.log('---------------------');

  const elementInfo = await page.evaluate(() => {
    const el = document.getElementById('new-filter-container');
    if (!el) return { exists: false };

    const attrs = {};
    for (let attr of el.attributes) {
      attrs[attr.name] = attr.value;
    }

    return {
      exists: true,
      id: el.id,
      classes: Array.from(el.classList),
      hasClassNewFilterContainer: el.classList.contains('new-filter-container'),
      allAttributes: attrs,
      tagName: el.tagName,
      innerHTML: el.innerHTML.substring(0, 200) + '...' // First 200 chars
    };
  });

  diagnostic.element = elementInfo;
  console.log('Element exists:', elementInfo.exists);
  console.log('Element ID:', elementInfo.id);
  console.log('Element classes:', elementInfo.classes);
  console.log('Has class "new-filter-container":', elementInfo.hasClassNewFilterContainer);
  console.log('All attributes:', elementInfo.allAttributes);
  console.log('Tag name:', elementInfo.tagName);
  console.log('');

  // ===== 2. CSS SELECTOR VALIDATION =====
  console.log('2. CSS SELECTOR VALIDATION');
  console.log('--------------------------');

  const selectorInfo = await page.evaluate(() => {
    const dotSelector = document.querySelectorAll('.new-filter-container');
    const hashSelector = document.querySelectorAll('#new-filter-container');

    return {
      dotNewFilterContainerMatches: dotSelector.length > 0,
      dotSelectorCount: dotSelector.length,
      hashNewFilterContainerMatches: hashSelector.length > 0,
      hashSelectorCount: hashSelector.length,
      dotSelectorElements: Array.from(dotSelector).map(el => ({
        id: el.id,
        classes: Array.from(el.classList)
      })),
      hashSelectorElements: Array.from(hashSelector).map(el => ({
        id: el.id,
        classes: Array.from(el.classList)
      }))
    };
  });

  diagnostic.selectors = selectorInfo;
  console.log('.new-filter-container matches:', selectorInfo.dotSelectorCount, 'elements');
  console.log('#new-filter-container matches:', selectorInfo.hashSelectorCount, 'elements');
  console.log('.new-filter-container elements:', JSON.stringify(selectorInfo.dotSelectorElements, null, 2));
  console.log('#new-filter-container elements:', JSON.stringify(selectorInfo.hashSelectorElements, null, 2));
  console.log('');

  // ===== 3. COMPUTED STYLES (ACTUAL BROWSER VALUES) =====
  console.log('3. COMPUTED STYLES (ACTUAL BROWSER VALUES)');
  console.log('------------------------------------------');

  const computedInfo = await page.evaluate(() => {
    const el = document.getElementById('new-filter-container');
    if (!el) return { exists: false };

    const computed = window.getComputedStyle(el);
    const inline = el.style.cssText;

    return {
      exists: true,
      top: computed.top,
      position: computed.position,
      left: computed.left,
      width: computed.width,
      height: computed.height,
      zIndex: computed.zIndex,
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      inlineStyles: inline,
      hasInlineTop: el.style.top !== ''
    };
  });

  diagnostic.computedStyles = computedInfo;
  console.log('Computed top:', computedInfo.top);
  console.log('Computed position:', computedInfo.position);
  console.log('Computed left:', computedInfo.left);
  console.log('Computed z-index:', computedInfo.zIndex);
  console.log('Inline styles:', computedInfo.inlineStyles);
  console.log('Has inline top:', computedInfo.hasInlineTop);
  console.log('');

  // ===== 4. CSS FILE VS BROWSER REALITY =====
  console.log('4. CSS FILE VS BROWSER REALITY');
  console.log('-------------------------------');

  const cssFilePath = '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/timeline-clean-test.css';
  let cssFileContent = '';
  try {
    cssFileContent = fs.readFileSync(cssFilePath, 'utf-8');
  } catch (err) {
    console.log('Error reading CSS file:', err.message);
  }

  // Find .new-filter-container rule
  const classRuleMatch = cssFileContent.match(/\.new-filter-container\s*\{[^}]*\}/g);
  const idRuleMatch = cssFileContent.match(/#new-filter-container\s*\{[^}]*\}/g);

  diagnostic.cssFile = {
    classRuleExists: !!classRuleMatch,
    classRuleContent: classRuleMatch ? classRuleMatch[0] : null,
    idRuleExists: !!idRuleMatch,
    idRuleContent: idRuleMatch ? idRuleMatch[0] : null
  };

  console.log('CSS file has .new-filter-container rule:', diagnostic.cssFile.classRuleExists);
  if (diagnostic.cssFile.classRuleExists) {
    console.log('Rule content:', diagnostic.cssFile.classRuleContent);
  }
  console.log('CSS file has #new-filter-container rule:', diagnostic.cssFile.idRuleExists);
  if (diagnostic.cssFile.idRuleExists) {
    console.log('Rule content:', diagnostic.cssFile.idRuleContent);
  }
  console.log('');

  // ===== 5. JAVASCRIPT INTERFERENCE CHECK =====
  console.log('5. JAVASCRIPT INTERFERENCE CHECK');
  console.log('--------------------------------');

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.waitForTimeout(1000);

  console.log('Console errors:', consoleErrors.length > 0 ? consoleErrors : 'None');
  console.log('');

  // ===== 6. CSS INJECTION TEST =====
  console.log('6. CSS INJECTION TEST');
  console.log('---------------------');

  // Get initial position
  const initialTop = await page.evaluate(() => {
    const el = document.getElementById('new-filter-container');
    return el ? window.getComputedStyle(el).top : null;
  });

  console.log('Initial computed top:', initialTop);

  // Test 1: Class selector with !important
  await page.addStyleTag({
    content: '.new-filter-container { top: -23px !important; }'
  });
  await page.waitForTimeout(500);

  const afterClassInjection = await page.evaluate(() => {
    const el = document.getElementById('new-filter-container');
    return el ? window.getComputedStyle(el).top : null;
  });

  console.log('After .new-filter-container injection:', afterClassInjection);
  diagnostic.injectionTest.dotSelectorWorks = afterClassInjection === '-23px';

  // Reload page for clean test
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Test 2: ID selector with !important
  await page.addStyleTag({
    content: '#new-filter-container { top: -23px !important; }'
  });
  await page.waitForTimeout(500);

  const afterIdInjection = await page.evaluate(() => {
    const el = document.getElementById('new-filter-container');
    return el ? window.getComputedStyle(el).top : null;
  });

  console.log('After #new-filter-container injection:', afterIdInjection);
  diagnostic.injectionTest.hashSelectorWorks = afterIdInjection === '-23px';

  // Test 3: Class selector WITHOUT !important
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.addStyleTag({
    content: '.new-filter-container { top: -23px; }'
  });
  await page.waitForTimeout(500);

  const afterClassNoImportant = await page.evaluate(() => {
    const el = document.getElementById('new-filter-container');
    return el ? window.getComputedStyle(el).top : null;
  });

  console.log('After .new-filter-container (no !important) injection:', afterClassNoImportant);
  diagnostic.injectionTest.dotSelectorWorksNoImportant = afterClassNoImportant === '-23px';

  console.log('');

  // ===== 7. ROOT CAUSE DETERMINATION =====
  console.log('7. ROOT CAUSE DETERMINATION');
  console.log('---------------------------');

  let rootCause = '';
  let fix = '';

  if (!elementInfo.exists) {
    rootCause = 'Element #new-filter-container does not exist in DOM';
    fix = 'Check if element is being created by JavaScript or if ID is different';
  } else if (!elementInfo.hasClassNewFilterContainer) {
    rootCause = 'Element #new-filter-container exists but does NOT have class "new-filter-container"';
    fix = 'Either: (1) Add class="new-filter-container" to HTML element, OR (2) Change CSS selector from .new-filter-container to #new-filter-container';
  } else if (selectorInfo.dotSelectorCount === 0) {
    rootCause = 'Class selector .new-filter-container does not match any elements (selector mismatch)';
    fix = 'CSS selector .new-filter-container does not match the element. Use #new-filter-container instead.';
  } else if (diagnostic.injectionTest.hashSelectorWorks && !diagnostic.injectionTest.dotSelectorWorks) {
    rootCause = 'ID selector works but class selector does not - CSS selector specificity issue or class not present';
    fix = 'Change CSS from .new-filter-container to #new-filter-container';
  } else if (diagnostic.injectionTest.dotSelectorWorks && !diagnostic.injectionTest.dotSelectorWorksNoImportant) {
    rootCause = 'Class selector only works with !important - there is a more specific CSS rule overriding it';
    fix = 'Either: (1) Add !important to .new-filter-container rule, OR (2) Increase selector specificity, OR (3) Find and remove conflicting CSS rule';
  } else if (computedInfo.hasInlineTop) {
    rootCause = 'Element has inline styles setting top property, which overrides CSS file rules';
    fix = 'Remove inline style from JavaScript or HTML';
  } else {
    rootCause = 'Unknown issue - CSS file rule exists and selector matches but styles not applying';
    fix = 'Check browser cache, CSS file loading order, or conflicting more-specific rules';
  }

  diagnostic.rootCause = rootCause;
  diagnostic.fix = fix;

  console.log('ROOT CAUSE:', rootCause);
  console.log('FIX:', fix);
  console.log('');

  // ===== SAVE DIAGNOSTIC REPORT =====
  const reportPath = path.join(__dirname, '..', 'test-results', 'browser-reality-check.json');
  fs.writeFileSync(reportPath, JSON.stringify(diagnostic, null, 2));
  console.log('Diagnostic report saved to:', reportPath);

  // ===== TAKE SCREENSHOT =====
  const screenshotPath = path.join(__dirname, '..', 'test-results', `browser-reality-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved to:', screenshotPath);

  // ===== FINAL OUTPUT =====
  console.log('\n=== DIAGNOSTIC SUMMARY ===');
  console.log(JSON.stringify(diagnostic, null, 2));
  console.log('\n========================\n');
});
