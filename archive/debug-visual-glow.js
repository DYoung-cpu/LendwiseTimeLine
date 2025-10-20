const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to console
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  console.log('Taking initial screenshot...');
  await page.screenshot({ path: 'glow-initial.png', fullPage: false });

  // Check if updateCardOpacity function has the new code
  const codeCheck = await page.evaluate(() => {
    const fnString = updateCardOpacity.toString();
    return {
      hasExponential: fnString.includes('Math.pow'),
      hasDistance450: fnString.includes('450'),
      hasFrontCheck: fnString.includes('absAngle <= 90'),
      functionPreview: fnString.substring(0, 500)
    };
  });

  console.log('\nCode Check:');
  console.log('Has exponential curve:', codeCheck.hasExponential);
  console.log('Has 450px distance:', codeCheck.hasDistance450);
  console.log('Has front-facing check:', codeCheck.hasFrontCheck);
  console.log('Function preview:', codeCheck.functionPreview);

  console.log('\nWaiting 10 seconds - observe the carousel...');
  await page.waitForTimeout(10000);

  await browser.close();
})();
