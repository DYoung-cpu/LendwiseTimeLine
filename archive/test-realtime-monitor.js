const { chromium } = require('playwright');

async function monitorRealtime() {
    console.log('👁️ Real-time glow monitoring...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    await page.goto('http://localhost:8000/timeline-dev.html', {
        waitUntil: 'networkidle',
        timeout: 30000
    });

    // Wait for carousel to initialize
    await page.waitForTimeout(4000);

    // Now check the state of all cards
    const allCardsState = await page.evaluate(() => {
        const cards = document.querySelectorAll('.gallery-card');
        const owl = document.querySelector('.landing-owl .wisr-video-circle') ||
                     document.querySelector('.landing-owl');

        if (!owl) return { error: 'Owl not found' };

        const owlRect = owl.getBoundingClientRect();
        const owlCenterX = owlRect.left + owlRect.width / 2;
        const owlCenterY = owlRect.top + owlRect.height / 2;

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

            const borderColor = card.style.borderColor;
            const boxShadow = card.style.boxShadow;
            const isGlowing = borderColor.includes('255, 215, 0') || boxShadow.includes('255, 215, 0');

            return {
                index,
                title: card.querySelector('h3')?.textContent,
                distance: Math.round(distance),
                angle: Math.round(relativeAngle),
                absAngle: Math.round(absAngle),
                shouldGlow,
                isGlowing,
                borderColor,
                boxShadow: boxShadow === 'none' ? 'none' : 'has shadow',
                match: shouldGlow === isGlowing
            };
        });
    });

    console.log('📊 Current state of all cards:');
    console.log('Index | Title | Dist | Angle | Should | Is | Match');
    console.log('------|-------|------|-------|--------|----|-     |');
    allCardsState.forEach(card => {
        const matchIcon = card.match ? '✅' : '❌';
        console.log(
            `${card.index.toString().padStart(5)} | ` +
            `${card.title.substring(0, 20).padEnd(20)} | ` +
            `${card.distance.toString().padStart(4)} | ` +
            `${card.angle.toString().padStart(5)} | ` +
            `${(card.shouldGlow ? 'YES' : 'NO ').padEnd(6)} | ` +
            `${(card.isGlowing ? 'YES' : 'NO ').padEnd(2)} | ` +
            `${matchIcon}`
        );
    });

    // Now manually call updateCardOpacity on ALL cards and see what changes
    console.log('\n🔧 Manually calling updateCardOpacity on ALL cards...\n');

    await page.evaluate(() => {
        const cards = document.querySelectorAll('.gallery-card');
        const anglePerCard = 360 / cards.length;
        const currentRotation = window.galleryConfig?.currentRotation || 0;

        cards.forEach((card, index) => {
            const cardAngle = index * anglePerCard;
            const relativeAngle = cardAngle - currentRotation;
            if (typeof updateCardOpacity === 'function') {
                updateCardOpacity(card, relativeAngle);
            }
        });
    });

    // Check state again
    const afterManualUpdate = await page.evaluate(() => {
        const cards = document.querySelectorAll('.gallery-card');
        const owl = document.querySelector('.landing-owl .wisr-video-circle') ||
                     document.querySelector('.landing-owl');

        const owlRect = owl.getBoundingClientRect();
        const owlCenterX = owlRect.left + owlRect.width / 2;
        const owlCenterY = owlRect.top + owlRect.height / 2;

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

            const borderColor = card.style.borderColor;
            const boxShadow = card.style.boxShadow;
            const isGlowing = borderColor.includes('255, 215, 0') || boxShadow.includes('255, 215, 0');

            return {
                index,
                title: card.querySelector('h3')?.textContent,
                shouldGlow,
                isGlowing,
                match: shouldGlow === isGlowing
            };
        });
    });

    console.log('📊 After manual updateCardOpacity:');
    console.log('Index | Title | Should | Is | Match');
    console.log('------|-------|--------|----|-     |');
    afterManualUpdate.forEach(card => {
        const matchIcon = card.match ? '✅' : '❌';
        console.log(
            `${card.index.toString().padStart(5)} | ` +
            `${card.title.substring(0, 20).padEnd(20)} | ` +
            `${(card.shouldGlow ? 'YES' : 'NO ').padEnd(6)} | ` +
            `${(card.isGlowing ? 'YES' : 'NO ').padEnd(2)} | ` +
            `${matchIcon}`
        );
    });

    await page.screenshot({
        path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/before-manual-fix.png',
        fullPage: false
    });

    console.log('\n📸 Screenshot saved: before-manual-fix.png');
    console.log('\n⏸️ Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

    await browser.close();
}

monitorRealtime().catch(console.error);
