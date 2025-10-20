const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);

    const analysis = await page.evaluate(() => {
        // Get all relevant containers
        const borderContainer = document.querySelector('.timeline-border-container');
        const lineContainer = document.querySelector('.timeline-line-container');
        const milestonesContainer = document.querySelector('.timeline-milestones');

        const borderRect = borderContainer?.getBoundingClientRect();
        const lineRect = lineContainer?.getBoundingClientRect();
        const milestonesRect = milestonesContainer?.getBoundingClientRect();

        // Get first milestone to inspect
        const firstMilestone = document.querySelector('.timeline-milestone');
        const firstRect = firstMilestone?.getBoundingClientRect();
        const firstStyle = firstMilestone?.getAttribute('style');
        const firstComputed = window.getComputedStyle(firstMilestone);

        return {
            containers: {
                borderContainer: {
                    width: borderRect?.width,
                    left: borderRect?.left,
                    computedWidth: window.getComputedStyle(borderContainer).width
                },
                lineContainer: {
                    width: lineRect?.width,
                    left: lineRect?.left,
                    computedWidth: window.getComputedStyle(lineContainer).width
                },
                milestonesContainer: {
                    width: milestonesRect?.width,
                    left: milestonesRect?.left,
                    computedWidth: window.getComputedStyle(milestonesContainer).width,
                    computedPosition: window.getComputedStyle(milestonesContainer).position
                }
            },
            firstMilestone: {
                htmlStyle: firstStyle,
                computedLeft: firstComputed.left,
                computedPosition: firstComputed.position,
                boundingLeft: firstRect?.left,
                parentElement: firstMilestone?.parentElement?.className
            },
            // Check if there's a transform on the parent
            transforms: {
                borderTransform: window.getComputedStyle(borderContainer).transform,
                lineTransform: window.getComputedStyle(lineContainer).transform,
                milestonesTransform: window.getComputedStyle(milestonesContainer).transform
            }
        };
    });

    console.log('=== CONTAINER WIDTHS ===');
    console.log('Border Container:', analysis.containers.borderContainer);
    console.log('Line Container:', analysis.containers.lineContainer);
    console.log('Milestones Container:', analysis.containers.milestonesContainer);

    console.log('\n=== FIRST MILESTONE ===');
    console.log('HTML Style:', analysis.firstMilestone.htmlStyle);
    console.log('Computed Left:', analysis.firstMilestone.computedLeft);
    console.log('Computed Position:', analysis.firstMilestone.computedPosition);
    console.log('Bounding Left:', analysis.firstMilestone.boundingLeft);
    console.log('Parent Element:', analysis.firstMilestone.parentElement);

    console.log('\n=== TRANSFORMS ===');
    console.log(analysis.transforms);

    // Calculate what the left should be
    const milestonesWidth = parseFloat(analysis.containers.milestonesContainer.computedWidth);
    const expected5Percent = milestonesWidth * 0.05;
    const actualComputedPx = parseFloat(analysis.firstMilestone.computedLeft);

    console.log('\n=== CALCULATION CHECK ===');
    console.log(`Milestones container width: ${milestonesWidth}px`);
    console.log(`Expected 5% of ${milestonesWidth}px = ${expected5Percent}px`);
    console.log(`Actual computed left: ${actualComputedPx}px`);
    console.log(`Difference: ${actualComputedPx - expected5Percent}px`);

    if (Math.abs(actualComputedPx - expected5Percent) > 1) {
        console.log('\n⚠️  PROBLEM: Computed left does NOT match 5% of container width!');
        console.log('This means the percentage is being calculated against a different container.');
    } else {
        console.log('\n✓ Percentages are being calculated correctly');
    }

    await browser.close();
})();
