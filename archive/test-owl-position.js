const { chromium } = require('playwright');

async function checkOwlPosition() {
    console.log('🦉 Checking owl position during initialization...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Monitor when updateCardOpacity is called
    await page.evaluateOnNewDocument(() => {
        window.glowDebugLog = [];

        // Patch updateCardOpacity when it becomes available
        const checkAndPatch = setInterval(() => {
            if (typeof updateCardOpacity === 'function' && !window.updateCardOpacityPatched) {
                window.updateCardOpacityPatched = true;
                const original = updateCardOpacity;

                window.updateCardOpacity = function(card, angle) {
                    const cardIndex = Array.from(document.querySelectorAll('.gallery-card')).indexOf(card);

                    // Get owl info
                    const owl = document.querySelector('.landing-owl .wisr-video-circle') ||
                                 document.querySelector('.landing-owl');

                    let owlInfo = 'NOT FOUND';
                    if (owl) {
                        const rect = owl.getBoundingClientRect();
                        owlInfo = {
                            x: Math.round(rect.left + rect.width / 2),
                            y: Math.round(rect.top + rect.height / 2),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            isZero: rect.width === 0 || rect.height === 0
                        };
                    }

                    window.glowDebugLog.push({
                        timestamp: performance.now(),
                        cardIndex,
                        angle: Math.round(angle),
                        owlInfo
                    });

                    return original.call(this, card, angle);
                };

                console.log('[DEBUG] updateCardOpacity patched');
                clearInterval(checkAndPatch);
            }
        }, 10);
    });

    await page.goto('http://localhost:8000/timeline-dev.html', {
        waitUntil: 'networkidle',
        timeout: 30000
    });

    await page.waitForTimeout(4000);

    const debugLog = await page.evaluate(() => window.glowDebugLog || []);

    console.log(`📝 updateCardOpacity was called ${debugLog.length} times\n`);

    if (debugLog.length > 0) {
        console.log('First 20 calls:');
        debugLog.slice(0, 20).forEach((entry, i) => {
            const owlStatus = typeof entry.owlInfo === 'string' ? entry.owlInfo :
                             entry.owlInfo.isZero ? `ZERO SIZE (${entry.owlInfo.width}x${entry.owlInfo.height})` :
                             `OK (${entry.owlInfo.x}, ${entry.owlInfo.y})`;

            console.log(
                `${(i + 1).toString().padStart(2)}. ` +
                `t=${Math.round(entry.timestamp).toString().padStart(6)}ms ` +
                `Card ${entry.cardIndex.toString().padStart(2)} ` +
                `Angle ${entry.angle.toString().padStart(4)}° ` +
                `Owl: ${owlStatus}`
            );
        });

        // Focus on Card 9
        const card9Calls = debugLog.filter(e => e.cardIndex === 9);
        console.log(`\n🎯 Card 9 calls (${card9Calls.length} total):`);
        card9Calls.forEach((entry, i) => {
            const owlStatus = typeof entry.owlInfo === 'string' ? entry.owlInfo :
                             entry.owlInfo.isZero ? `ZERO SIZE` :
                             `OK at (${entry.owlInfo.x}, ${entry.owlInfo.y})`;

            console.log(
                `  ${(i + 1).toString().padStart(2)}. ` +
                `t=${Math.round(entry.timestamp).toString().padStart(6)}ms ` +
                `Angle ${entry.angle.toString().padStart(4)}° ` +
                `Owl: ${owlStatus}`
            );
        });
    }

    await page.screenshot({
        path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/owl-position-check.png',
        fullPage: false
    });

    console.log('\n⏸️ Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

    await browser.close();
}

checkOwlPosition().catch(console.error);
