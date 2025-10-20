const { chromium } = require('playwright');

async function diagnoseGlow() {
    console.log('🔍 Starting glow diagnostic...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Listen for console messages
    page.on('console', msg => {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // Listen for JavaScript errors
    page.on('pageerror', error => {
        console.error(`[JS Error] ${error.message}`);
    });

    // Navigate to the page
    console.log('📂 Opening http://localhost:8000/timeline-dev.html...\n');
    await page.goto('http://localhost:8000/timeline-dev.html', {
        waitUntil: 'networkidle',
        timeout: 30000
    });

    // Wait for carousel to initialize
    await page.waitForTimeout(3000);

    // Check if modern-timeline.js is loaded
    const scriptLoaded = await page.evaluate(() => {
        const script = document.querySelector('script[src*="modern-timeline.js"]');
        return script ? script.src : 'NOT FOUND';
    });
    console.log('✅ Script tag found:', scriptLoaded);

    // Check if updateCardOpacity function exists
    const functionExists = await page.evaluate(() => {
        return typeof updateCardOpacity !== 'undefined';
    });
    console.log('✅ updateCardOpacity function exists:', functionExists);

    // Get the actual function code to verify it has the latest changes
    const functionCode = await page.evaluate(() => {
        if (typeof updateCardOpacity === 'undefined') return 'FUNCTION NOT FOUND';
        return updateCardOpacity.toString();
    });
    console.log('\n📝 Current updateCardOpacity function code:');
    console.log('Contains "450" threshold:', functionCode.includes('450'));
    console.log('Contains exponential curve:', functionCode.includes('Math.pow'));
    console.log('Contains front-facing check:', functionCode.includes('absAngle <= 90'));

    // Get owl position
    const owlInfo = await page.evaluate(() => {
        const owl = document.querySelector('.landing-owl .wisr-video-circle') ||
                     document.querySelector('.landing-owl');
        if (!owl) return 'OWL NOT FOUND';

        const rect = owl.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height
        };
    });
    console.log('\n🦉 Owl position:', owlInfo);

    // Get all card positions and check which should glow
    const cardAnalysis = await page.evaluate(() => {
        const owl = document.querySelector('.landing-owl .wisr-video-circle') ||
                     document.querySelector('.landing-owl');
        const owlRect = owl.getBoundingClientRect();
        const owlCenterX = owlRect.left + owlRect.width / 2;
        const owlCenterY = owlRect.top + owlRect.height / 2;

        const cards = document.querySelectorAll('.gallery-card');
        const anglePerCard = 360 / cards.length;
        const currentRotation = 0; // Initial rotation

        return Array.from(cards).map((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenterX = cardRect.left + cardRect.width / 2;
            const cardCenterY = cardRect.top + cardRect.height / 2;

            const distance = Math.sqrt(
                Math.pow(cardCenterX - owlCenterX, 2) +
                Math.pow(cardCenterY - owlCenterY, 2)
            );

            // Calculate angle
            const cardAngle = index * anglePerCard;
            let relativeAngle = cardAngle - currentRotation;
            while (relativeAngle > 180) relativeAngle -= 360;
            while (relativeAngle < -180) relativeAngle += 360;
            const absAngle = Math.abs(relativeAngle);

            const shouldGlow = distance <= 450 && absAngle <= 90;

            const currentBorderColor = getComputedStyle(card).borderColor;
            const currentBoxShadow = getComputedStyle(card).boxShadow;
            const isActuallyGlowing = currentBorderColor.includes('255, 215, 0') ||
                                      currentBoxShadow.includes('255, 215, 0');

            return {
                index,
                title: card.querySelector('h3')?.textContent || 'Unknown',
                distance: Math.round(distance),
                angle: Math.round(relativeAngle),
                absAngle: Math.round(absAngle),
                shouldGlow,
                isActuallyGlowing,
                borderColor: currentBorderColor,
                boxShadow: currentBoxShadow === 'none' ? 'none' : 'has shadow'
            };
        });
    });

    console.log('\n📊 Card Analysis (Initial Position):');
    console.log('Index | Title | Distance | Angle | Should Glow | Actually Glowing');
    console.log('------|-------|----------|-------|-------------|------------------');
    cardAnalysis.forEach(card => {
        const status = card.shouldGlow === card.isActuallyGlowing ? '✅' : '❌';
        console.log(
            `${card.index.toString().padEnd(5)} | ` +
            `${card.title.substring(0, 20).padEnd(20)} | ` +
            `${card.distance.toString().padEnd(8)} | ` +
            `${card.angle.toString().padEnd(5)} | ` +
            `${(card.shouldGlow ? 'YES' : 'NO').padEnd(11)} | ` +
            `${(card.isActuallyGlowing ? 'YES' : 'NO').padEnd(16)} ${status}`
        );
    });

    // Take initial screenshot
    await page.screenshot({
        path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/glow-diagnostic-initial.png',
        fullPage: false
    });
    console.log('\n📸 Screenshot saved: glow-diagnostic-initial.png');

    // Now slowly rotate and check glow at different positions
    console.log('\n🔄 Testing rotation at 90-degree intervals...\n');

    for (let rotation = 0; rotation <= 270; rotation += 90) {
        await page.evaluate((rot) => {
            const galleryTrack = document.getElementById('galleryTrack');
            if (galleryTrack) {
                window.galleryConfig = window.galleryConfig || { currentRotation: 0 };
                window.galleryConfig.currentRotation = rot;
                window.galleryConfig.isAutoRotating = false;
                galleryTrack.style.transform = `rotateY(${rot}deg)`;

                // Manually trigger opacity update
                const cards = document.querySelectorAll('.gallery-card');
                const anglePerCard = 360 / cards.length;
                cards.forEach((card, index) => {
                    const cardAngle = index * anglePerCard;
                    const relativeAngle = cardAngle - rot;
                    if (typeof updateCardOpacity === 'function') {
                        updateCardOpacity(card, relativeAngle);
                    }
                });
            }
        }, rotation);

        await page.waitForTimeout(1000);

        const rotatedCardAnalysis = await page.evaluate(() => {
            const owl = document.querySelector('.landing-owl .wisr-video-circle') ||
                         document.querySelector('.landing-owl');
            const owlRect = owl.getBoundingClientRect();
            const owlCenterX = owlRect.left + owlRect.width / 2;
            const owlCenterY = owlRect.top + owlRect.height / 2;

            const cards = document.querySelectorAll('.gallery-card');
            const anglePerCard = 360 / cards.length;
            const currentRotation = window.galleryConfig?.currentRotation || 0;

            return Array.from(cards).map((card, index) => {
                const cardRect = card.getBoundingClientRect();
                const cardCenterX = cardRect.left + cardRect.width / 2;
                const cardCenterY = cardRect.top + cardRect.height / 2;

                const distance = Math.sqrt(
                    Math.pow(cardCenterX - owlCenterX, 2) +
                    Math.pow(cardCenterY - owlCenterY, 2)
                );

                const cardAngle = index * anglePerCard;
                let relativeAngle = cardAngle - currentRotation;
                while (relativeAngle > 180) relativeAngle -= 360;
                while (relativeAngle < -180) relativeAngle += 360;
                const absAngle = Math.abs(relativeAngle);

                const shouldGlow = distance <= 450 && absAngle <= 90;

                const currentBorderColor = getComputedStyle(card).borderColor;
                const currentBoxShadow = getComputedStyle(card).boxShadow;
                const isActuallyGlowing = currentBorderColor.includes('255, 215, 0') ||
                                          currentBoxShadow.includes('255, 215, 0');

                return {
                    index,
                    title: card.querySelector('h3')?.textContent || 'Unknown',
                    distance: Math.round(distance),
                    absAngle: Math.round(absAngle),
                    shouldGlow,
                    isActuallyGlowing
                };
            }).filter(c => c.shouldGlow || c.isActuallyGlowing); // Only show cards that should glow or are glowing
        });

        console.log(`Rotation: ${rotation}° - Cards that should glow or are glowing:`);
        if (rotatedCardAnalysis.length === 0) {
            console.log('  None');
        } else {
            rotatedCardAnalysis.forEach(card => {
                const status = card.shouldGlow === card.isActuallyGlowing ? '✅' : '❌';
                console.log(
                    `  ${card.index}: ${card.title.substring(0, 25).padEnd(25)} - ` +
                    `Dist: ${card.distance}px, Angle: ${card.absAngle}° - ` +
                    `Should: ${card.shouldGlow ? 'YES' : 'NO'}, Is: ${card.isActuallyGlowing ? 'YES' : 'NO'} ${status}`
                );
            });
        }

        await page.screenshot({
            path: `/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/glow-diagnostic-${rotation}deg.png`,
            fullPage: false
        });
        console.log(`📸 Screenshot saved: glow-diagnostic-${rotation}deg.png\n`);
    }

    // Check for CSS overrides
    const cssIssues = await page.evaluate(() => {
        const cards = document.querySelectorAll('.gallery-card');
        const issues = [];

        cards.forEach((card, index) => {
            const styles = getComputedStyle(card);
            const borderColor = styles.borderColor;
            const boxShadow = styles.boxShadow;

            // Check if there's a CSS rule overriding with !important
            const allRules = Array.from(document.styleSheets)
                .flatMap(sheet => {
                    try {
                        return Array.from(sheet.cssRules || []);
                    } catch (e) {
                        return [];
                    }
                })
                .filter(rule => {
                    return rule.selectorText &&
                           (rule.selectorText.includes('gallery-card') ||
                            rule.selectorText.includes(card.className));
                });

            const importantBorder = allRules.find(rule =>
                rule.style.borderColor && rule.style.borderColor.includes('!important')
            );

            const importantShadow = allRules.find(rule =>
                rule.style.boxShadow && rule.style.boxShadow.includes('!important')
            );

            if (importantBorder || importantShadow) {
                issues.push({
                    index,
                    title: card.querySelector('h3')?.textContent,
                    hasImportantBorder: !!importantBorder,
                    hasImportantShadow: !!importantShadow
                });
            }
        });

        return issues;
    });

    if (cssIssues.length > 0) {
        console.log('\n⚠️ CSS Override Issues Detected:');
        cssIssues.forEach(issue => {
            console.log(`  Card ${issue.index} (${issue.title}): ` +
                       `Border override: ${issue.hasImportantBorder}, ` +
                       `Shadow override: ${issue.hasImportantShadow}`);
        });
    } else {
        console.log('\n✅ No CSS override issues detected');
    }

    console.log('\n🔍 Diagnostic complete! Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

    await browser.close();
}

diagnoseGlow().catch(console.error);
