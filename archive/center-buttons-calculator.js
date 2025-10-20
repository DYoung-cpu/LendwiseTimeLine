const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('http://localhost:8080/timeline-dev.html');
    await page.waitForTimeout(4000); // Wait for intro animation

    // Get button measurements
    const measurements = await page.evaluate(() => {
        const buttons = {
            filter: document.querySelector('.filter-trigger'),
            wisr: document.querySelector('.wisr-button'),
            feed: document.querySelector('.feed-trigger'),
            marketing: document.querySelector('.marketing-button'),
            onboarding: document.querySelector('.onboarding-button')
        };

        const timeline = document.querySelector('.timeline-border-container');
        const timelineRect = timeline.getBoundingClientRect();
        const timelineCenter = timelineRect.left + (timelineRect.width / 2);

        // Get logo position
        const logo = document.querySelector('.lendwise-logo-text');
        const logoRect = logo ? logo.getBoundingClientRect() : null;
        const logoCenter = logoRect ? logoRect.left + (logoRect.width / 2) : null;

        // Get roadmap container (parent of everything)
        const roadmap = document.querySelector('.roadmap-container');
        const roadmapRect = roadmap ? roadmap.getBoundingClientRect() : null;
        const roadmapCenter = roadmapRect ? roadmapRect.left + (roadmapRect.width / 2) : null;

        const buttonData = {};
        for (const [name, btn] of Object.entries(buttons)) {
            if (btn) {
                const rect = btn.getBoundingClientRect();
                buttonData[name] = {
                    width: rect.width,
                    left: rect.left,
                    right: rect.right,
                    centerX: rect.left + (rect.width / 2)
                };
            }
        }

        return {
            buttons: buttonData,
            timelineCenter,
            timelineWidth: timelineRect.width,
            timelineLeft: timelineRect.left,
            logoCenter,
            logoWidth: logoRect ? logoRect.width : null,
            logoLeft: logoRect ? logoRect.left : null,
            roadmapCenter,
            roadmapWidth: roadmapRect ? roadmapRect.width : null
        };
    });

    console.log('\n=== CURRENT BUTTON MEASUREMENTS ===\n');
    console.log('Timeline Center:', measurements.timelineCenter);
    console.log('Timeline Width:', measurements.timelineWidth);
    console.log('Logo Center:', measurements.logoCenter);
    console.log('Logo Width:', measurements.logoWidth);
    console.log('Roadmap Center:', measurements.roadmapCenter);
    console.log('Roadmap Width:', measurements.roadmapWidth);
    console.log('\nButton Positions:');
    for (const [name, data] of Object.entries(measurements.buttons)) {
        console.log(`${name.toUpperCase()}: width=${data.width.toFixed(2)}px, left=${data.left.toFixed(2)}px, centerX=${data.centerX.toFixed(2)}px`);
    }

    // Calculate button group dimensions
    const buttonArray = Object.values(measurements.buttons);
    const leftmost = Math.min(...buttonArray.map(b => b.left));
    const rightmost = Math.max(...buttonArray.map(b => b.right));
    const groupWidth = rightmost - leftmost;
    const currentGroupCenter = leftmost + (groupWidth / 2);

    console.log('\n=== GROUP MEASUREMENTS ===\n');
    console.log('Leftmost position:', leftmost.toFixed(2));
    console.log('Rightmost position:', rightmost.toFixed(2));
    console.log('Group width:', groupWidth.toFixed(2));
    console.log('Current group center:', currentGroupCenter.toFixed(2));
    console.log('Timeline center:', measurements.timelineCenter.toFixed(2));
    console.log('Logo center:', measurements.logoCenter.toFixed(2));
    console.log('Roadmap center:', measurements.roadmapCenter.toFixed(2));
    console.log('Offset from timeline center:', (currentGroupCenter - measurements.timelineCenter).toFixed(2), 'px');
    console.log('Offset from logo center:', (currentGroupCenter - measurements.logoCenter).toFixed(2), 'px');
    console.log('Offset from roadmap center:', (currentGroupCenter - measurements.roadmapCenter).toFixed(2), 'px');

    // Calculate equal spacing
    const GAP = 10; // 10px gap between buttons
    const buttonWidths = [
        measurements.buttons.filter.width,
        measurements.buttons.wisr.width,
        measurements.buttons.feed.width,
        measurements.buttons.marketing.width,
        measurements.buttons.onboarding.width
    ];

    const totalButtonWidth = buttonWidths.reduce((sum, w) => sum + w, 0);
    const totalGapWidth = GAP * 4; // 4 gaps between 5 buttons
    const newGroupWidth = totalButtonWidth + totalGapWidth;

    // Use logo center OR roadmap center as the target (they should be the same)
    const targetCenter = measurements.logoCenter || measurements.roadmapCenter || measurements.timelineCenter;

    // Calculate new positions with equal spacing, centered on logo/roadmap
    const groupStartX = targetCenter - (newGroupWidth / 2);

    let currentX = groupStartX;
    const newPositions = {};
    const buttonNames = ['filter', 'wisr', 'feed', 'marketing', 'onboarding'];

    for (let i = 0; i < buttonNames.length; i++) {
        const name = buttonNames[i];
        const width = buttonWidths[i];

        // Calculate translateX relative to 50% (which is targetCenter in absolute px)
        // Container position = left: 50%, transform: translateX(?)
        // So: targetCenter + translateX = currentX
        // Therefore: translateX = currentX - targetCenter
        const translateX = currentX - targetCenter;

        newPositions[name] = {
            translateX: translateX.toFixed(2),
            absoluteX: currentX.toFixed(2)
        };

        currentX += width + GAP;
    }

    console.log('\n=== NEW CALCULATED POSITIONS (EQUAL SPACING, CENTERED) ===\n');
    console.log('Target center point:', targetCenter.toFixed(2), 'px (logo/roadmap center)');
    console.log('Gap between buttons:', GAP, 'px');
    console.log('New group width:', newGroupWidth.toFixed(2), 'px');
    console.log('New group start X:', groupStartX.toFixed(2), 'px');
    console.log('New group center X:', (groupStartX + newGroupWidth / 2).toFixed(2), 'px');
    console.log('\nNew translateX values:');
    for (const [name, pos] of Object.entries(newPositions)) {
        console.log(`${name.toUpperCase()}: translateX(${pos.translateX}px)`);
    }

    console.log('\n=== CSS/HTML UPDATE VALUES ===\n');
    console.log(`FILTER: translateX(${newPositions.filter.translateX}px)`);
    console.log(`WISR: translateX(${newPositions.wisr.translateX}px)`);
    console.log(`FEED: translateX(${newPositions.feed.translateX}px)`);
    console.log(`MARKETING: translateX(${newPositions.marketing.translateX}px)`);
    console.log(`ONBOARDING: translateX(${newPositions.onboarding.translateX}px)`);

    await page.waitForTimeout(2000);
    await browser.close();
})();
