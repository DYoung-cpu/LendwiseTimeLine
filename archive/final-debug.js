const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    await page.goto('http://localhost:8000/timeline-dev.html?nocache=' + Date.now());
    await page.waitForTimeout(5000);

    const result = await page.evaluate(() => {
        const cards = [3, 9]; // Card 3 (+90°) and Card 9 (-90°)
        const owl = document.querySelector('.landing-owl .wisr-video-circle') || document.querySelector('.landing-owl');

        if (!owl) return { error: 'No owl' };

        const owlRect = owl.getBoundingClientRect();
        const owlX = owlRect.left + owlRect.width / 2;
        const owlY = owlRect.top + owlRect.height / 2;

        return cards.map(idx => {
            const card = document.querySelectorAll('.gallery-card')[idx];
            const cardRect = card.getBoundingClientRect();
            const cardX = cardRect.left + cardRect.width / 2;
            const cardY = cardRect.top + cardRect.height / 2;

            const distance = Math.sqrt(Math.pow(cardX - owlX, 2) + Math.pow(cardY - owlY, 2));

            const angle = idx * 30; // 360/12 = 30
            let relAngle = angle;
            while (relAngle > 180) relAngle -= 360;
            const absAngle = Math.abs(relAngle);

            return {
                idx,
                title: card.querySelector('h3')?.textContent,
                angle,
                relAngle,
                absAngle,
                cardX: Math.round(cardX),
                cardY: Math.round(cardY),
                owlX: Math.round(owlX),
                owlY: Math.round(owlY),
                distance: Math.round(distance),
                shouldGlow: distance <= 450 && absAngle <= 90,
                borderColor: card.style.borderColor,
                hasGold: (card.style.borderColor || '').includes('255, 215, 0')
            };
        });
    });

    console.log('\n📊 Card 3 vs Card 9 comparison:');
    console.log(JSON.stringify(result, null, 2));

    await page.screenshot({ path: '/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/card-comparison.png' });

    await page.waitForTimeout(10000);
    await browser.close();
})();
