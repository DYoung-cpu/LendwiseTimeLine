const { chromium } = require('playwright');

async function deepDiveGlow() {
    console.log('🔬 Deep dive into glow issue...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Listen for console messages
    page.on('console', msg => {
        if (!msg.text().includes('GL Driver') && !msg.text().includes('WebGL')) {
            console.log(`[Browser] ${msg.type()}: ${msg.text()}`);
        }
    });

    await page.goto('http://localhost:8000/timeline-dev.html', {
        waitUntil: 'networkidle',
        timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Check Card 9 (Google Analytics) specifically
    const card9Analysis = await page.evaluate(() => {
        const card = document.querySelectorAll('.gallery-card')[9];
        const owl = document.querySelector('.landing-owl .wisr-video-circle') ||
                     document.querySelector('.landing-owl');

        if (!card || !owl) return { error: 'Elements not found' };

        const owlRect = owl.getBoundingClientRect();
        const owlCenterX = owlRect.left + owlRect.width / 2;
        const owlCenterY = owlRect.top + owlRect.height / 2;

        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;

        const distance = Math.sqrt(
            Math.pow(cardCenterX - owlCenterX, 2) +
            Math.pow(cardCenterY - owlCenterY, 2)
        );

        // Calculate angle
        const anglePerCard = 360 / 12;
        const cardAngle = 9 * anglePerCard; // 270°
        const currentRotation = window.galleryConfig?.currentRotation || 0;

        let relativeAngle = cardAngle - currentRotation;
        while (relativeAngle > 180) relativeAngle -= 360;
        while (relativeAngle < -180) relativeAngle += 360;
        const absAngle = Math.abs(relativeAngle);

        // Check if condition passes
        const glowDistanceThreshold = 450;
        const shouldGlow = distance <= glowDistanceThreshold && absAngle <= 90;

        // Get computed styles
        const styles = getComputedStyle(card);
        const borderColor = styles.borderColor;
        const boxShadow = styles.boxShadow;

        // Get inline styles (what JavaScript set)
        const inlineBorderColor = card.style.borderColor;
        const inlineBoxShadow = card.style.boxShadow;

        return {
            cardTitle: card.querySelector('h3')?.textContent,
            distance: Math.round(distance),
            relativeAngle,
            absAngle,
            glowDistanceThreshold,
            distanceCheck: distance <= glowDistanceThreshold,
            angleCheck: absAngle <= 90,
            shouldGlow,
            computedBorderColor: borderColor,
            computedBoxShadow: boxShadow,
            inlineBorderColor,
            inlineBoxShadow,
            hasGoldInComputed: borderColor.includes('255, 215, 0') || borderColor.includes('gold'),
            hasGoldInInline: (inlineBorderColor?.includes('255, 215, 0') || inlineBorderColor?.includes('gold')) || false
        };
    });

    console.log('📊 Card 9 (Google Analytics) Deep Analysis:');
    console.log(JSON.stringify(card9Analysis, null, 2));

    // Now manually trigger updateCardOpacity and watch what happens
    console.log('\n🔧 Manually calling updateCardOpacity on Card 9...');

    const manualUpdateResult = await page.evaluate(() => {
        const card = document.querySelectorAll('.gallery-card')[9];
        const anglePerCard = 360 / 12;
        const cardAngle = 9 * anglePerCard;
        const currentRotation = window.galleryConfig?.currentRotation || 0;
        const relativeAngle = cardAngle - currentRotation;

        // Call the function
        if (typeof updateCardOpacity === 'function') {
            updateCardOpacity(card, relativeAngle);

            // Check styles immediately after
            return {
                inlineBorderColor: card.style.borderColor,
                inlineBoxShadow: card.style.boxShadow,
                computedBorderColor: getComputedStyle(card).borderColor,
                computedBoxShadow: getComputedStyle(card).boxShadow
            };
        } else {
            return { error: 'updateCardOpacity function not found' };
        }
    });

    console.log('After manual updateCardOpacity call:');
    console.log(JSON.stringify(manualUpdateResult, null, 2));

    // Check if the element is being affected by CSS transitions or animations
    const cssTransitionInfo = await page.evaluate(() => {
        const card = document.querySelectorAll('.gallery-card')[9];
        const styles = getComputedStyle(card);

        return {
            transition: styles.transition,
            animation: styles.animation,
            transform: styles.transform,
            willChange: styles.willChange
        };
    });

    console.log('\n🎨 CSS Transition/Animation Info for Card 9:');
    console.log(JSON.stringify(cssTransitionInfo, null, 2));

    // Check all CSS rules affecting border-color
    const cssRulesAffectingBorder = await page.evaluate(() => {
        const card = document.querySelectorAll('.gallery-card')[9];
        const matchingRules = [];

        // Get all stylesheets
        Array.from(document.styleSheets).forEach((sheet, sheetIndex) => {
            try {
                Array.from(sheet.cssRules || []).forEach((rule, ruleIndex) => {
                    if (rule.selectorText) {
                        // Check if rule matches our card
                        if (card.matches(rule.selectorText)) {
                            const borderColor = rule.style.borderColor;
                            const boxShadow = rule.style.boxShadow;

                            if (borderColor || boxShadow) {
                                matchingRules.push({
                                    selector: rule.selectorText,
                                    borderColor: borderColor || 'not set',
                                    boxShadow: boxShadow || 'not set',
                                    specificity: rule.selectorText.split(' ').length,
                                    sheetIndex,
                                    ruleIndex
                                });
                            }
                        }
                    }
                });
            } catch (e) {
                // Cross-origin or other errors
            }
        });

        return matchingRules;
    });

    console.log('\n📜 CSS Rules affecting border-color/box-shadow for Card 9:');
    cssRulesAffectingBorder.forEach(rule => {
        console.log(`  ${rule.selector}:`);
        console.log(`    border-color: ${rule.borderColor}`);
        console.log(`    box-shadow: ${rule.boxShadow}`);
    });

    // Take a screenshot focusing on Card 9
    await page.screenshot({
        path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/card9-deep-dive.png',
        fullPage: false
    });
    console.log('\n📸 Screenshot saved: card9-deep-dive.png');

    console.log('\n⏸️ Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

    await browser.close();
}

deepDiveGlow().catch(console.error);
