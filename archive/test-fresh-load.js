const { chromium } = require('playwright');

async function testFreshLoad() {
    console.log('🔄 Testing with fresh load and cache disabled...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Disable cache
    await page.route('**/*', route => route.continue());

    // Navigate with no-cache headers
    await page.goto('http://localhost:8000/timeline-dev.html', {
        waitUntil: 'networkidle',
        timeout: 30000
    });

    // Hard reload to bypass cache
    await page.reload({ waitUntil: 'networkidle' });

    // Wait for initialization
    await page.waitForTimeout(4000);

    // Check all cards
    const cardsState = await page.evaluate(() => {
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
                match: shouldGlow === isGlowing,
                borderColor,
                boxShadow: boxShadow === 'none' ? 'none' : boxShadow.substring(0, 30) + '...'
            };
        });
    });

    console.log('📊 Fresh load results:');
    console.log('Index | Title | Should | Is | Match | Border Color');
    console.log('------|-------|--------|----|-     -|-------------');
    cardsState.forEach(card => {
        const matchIcon = card.match ? '✅' : '❌';
        const borderPreview = card.borderColor.substring(0, 25);
        console.log(
            `${card.index.toString().padStart(5)} | ` +
            `${card.title.substring(0, 20).padEnd(20)} | ` +
            `${(card.shouldGlow ? 'YES' : 'NO ').padEnd(6)} | ` +
            `${(card.isGlowing ? 'YES' : 'NO ').padEnd(2)} | ` +
            `${matchIcon} | ${borderPreview}`
        );
    });

    await page.screenshot({
        path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/fresh-load-test.png',
        fullPage: false
    });

    console.log('\n📸 Screenshot saved');
    console.log('⏸️ Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

    await browser.close();
}

testFreshLoad().catch(console.error);
