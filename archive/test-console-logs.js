const { chromium } = require('playwright');

(async () => {
  console.log('📋 CAPTURING CONSOLE LOGS FROM BROWSER\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleLogs = [];

  // Capture ALL console messages from the browser
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log(text);
  });

  await page.goto('http://localhost:3005/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);

  console.log('\n' + '='.repeat(80));
  console.log('CONSOLE LOG SUMMARY');
  console.log('='.repeat(80));

  const glowOnLogs = consoleLogs.filter(log => log.includes('✨ GLOW ON:'));
  const glowOffLogs = consoleLogs.filter(log => log.includes('⚫ GLOW OFF:'));

  console.log(`\nTotal console messages: ${consoleLogs.length}`);
  console.log(`GLOW ON messages: ${glowOnLogs.length}`);
  console.log(`GLOW OFF messages: ${glowOffLogs.length}`);

  if (glowOnLogs.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('Last few GLOW ON events:');
    console.log('-'.repeat(80));
    glowOnLogs.slice(-10).forEach(log => console.log(log));
  }

  if (glowOffLogs.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('Last few GLOW OFF events:');
    console.log('-'.repeat(80));
    glowOffLogs.slice(-10).forEach(log => console.log(log));
  }

  console.log('\n' + '='.repeat(80));

  await browser.close();
})();
