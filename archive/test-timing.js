const { chromium } = require('playwright');

async function testTiming() {
    console.log('⏱️ Testing initialization timing...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Inject monitoring code BEFORE page loads
    await page.addInitScript(() => {
        const originalUpdateCardOpacity = window.updateCardOpacity;
        const callLog = [];

        // Override updateCardOpacity to log all calls
        window.updateCardOpacity = function(card, angle) {
            const cardIndex = Array.from(document.querySelectorAll('.gallery-card')).indexOf(card);
            const cardTitle = card.querySelector('h3')?.textContent || 'Unknown';

            // Normalize angle
            let normalizedAngle = angle;
            while (normalizedAngle > 180) normalizedAngle -= 360;
            while (normalizedAngle < -180) normalizedAngle += 360;
            const absAngle = Math.abs(normalizedAngle);

            // Get distance
            const owl = document.querySelector('.landing-owl .wisr-video-circle') ||
                         document.querySelector('.landing-owl');

            let distance = 'N/A';
            if (owl) {
                const owlRect = owl.getBoundingClientRect();
                const cardRect = card.getBoundingClientRect();
                const owlCenterX = owlRect.left + owlRect.width / 2;
                const owlCenterY = owlRect.top + owlRect.height / 2;
                const cardCenterX = cardRect.left + cardRect.width / 2;
                const cardCenterY = cardRect.top + cardRect.height / 2;

                distance = Math.sqrt(
                    Math.pow(cardCenterX - owlCenterX, 2) +
                    Math.pow(cardCenterY - owlCenterY, 2)
                );
            }

            const shouldGlow = distance !== 'N/A' && distance <= 450 && absAngle <= 90;

            callLog.push({
                timestamp: Date.now(),
                cardIndex,
                cardTitle,
                angle: normalizedAngle,
                absAngle,
                distance: typeof distance === 'number' ? Math.round(distance) : distance,
                shouldGlow
            });

            // Call original function
            if (typeof originalUpdateCardOpacity === 'function') {
                return originalUpdateCardOpacity.call(this, card, angle);
            }
        };

        // Store the log globally so we can access it
        window.glowCallLog = callLog;

        // Also patch updateAllCardOpacities to log when it's called
        window.updateAllCardOpacitiesCallCount = 0;
        const originalUpdateAll = window.updateAllCardOpacities;
        window.updateAllCardOpacities = function(cards) {
            window.updateAllCardOpacitiesCallCount++;
            console.log(`[MONITOR] updateAllCardOpacities called (call #${window.updateAllCardOpacitiesCallCount})`);
            if (typeof originalUpdateAll === 'function') {
                return originalUpdateAll.call(this, cards);
            }
        };
    });

    await page.goto('http://localhost:8000/timeline-dev.html', {
        waitUntil: 'networkidle',
        timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Get the call log
    const callLog = await page.evaluate(() => window.glowCallLog || []);
    const updateAllCount = await page.evaluate(() => window.updateAllCardOpacitiesCallCount || 0);

    console.log(`📊 updateAllCardOpacities was called ${updateAllCount} times\n`);

    console.log('📋 updateCardOpacity call log (first 20 calls):');
    callLog.slice(0, 20).forEach((entry, i) => {
        console.log(
            `${i + 1}. Card ${entry.cardIndex} (${entry.cardTitle.substring(0, 20).padEnd(20)}) - ` +
            `Angle: ${entry.angle.toFixed(1).padStart(6)}°, Distance: ${String(entry.distance).padStart(3)}, ` +
            `Should glow: ${entry.shouldGlow ? 'YES' : 'NO'}`
        );
    });

    // Focus on Card 9 calls
    const card9Calls = callLog.filter(entry => entry.cardIndex === 9);
    console.log(`\n🎯 Card 9 (Google Analytics) was updated ${card9Calls.length} times:`);
    card9Calls.slice(0, 10).forEach((entry, i) => {
        console.log(
            `  ${i + 1}. Angle: ${entry.angle.toFixed(1)}°, Distance: ${entry.distance}, Should glow: ${entry.shouldGlow ? 'YES' : 'NO'}`
        );
    });

    // Check current state of Card 9
    const card9State = await page.evaluate(() => {
        const card = document.querySelectorAll('.gallery-card')[9];
        return {
            borderColor: card.style.borderColor,
            boxShadow: card.style.boxShadow,
            computedBorderColor: getComputedStyle(card).borderColor
        };
    });

    console.log('\n🔍 Card 9 current state:');
    console.log(JSON.stringify(card9State, null, 2));

    await page.screenshot({
        path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/timing-test.png',
        fullPage: false
    });

    console.log('\n⏸️ Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

    await browser.close();
}

testTiming().catch(console.error);
