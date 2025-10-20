const { test, expect } = require('@playwright/test');

/**
 * Visual Validation Test for Filter Button Gradient Styling
 *
 * Purpose: Ensure filter buttons use EXACT same gradient styling as timeline milestone buttons
 * Reference: project-memory.md "Filter Button Design Specification"
 *
 * This test validates that the filter button gradient matches the timeline milestone
 * button gradients (LOS, OPTIMAL BLUE, DEFI AI, POS, MISSION CRM, WISR AI)
 */

test.describe('Filter Button Visual Design Validation', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to timeline-dev.html
        await page.goto('http://localhost:3005/timeline-dev.html');

        // Wait for page to load completely
        await page.waitForLoadState('networkidle');

        // Wait for intro animation to complete (3 seconds)
        await page.waitForTimeout(3500);

        // Wait for filter button to appear
        await page.waitForSelector('.new-filter-btn', { state: 'visible', timeout: 10000 });
    });

    test('Filter button should have timeline milestone gradient structure', async ({ page }) => {
        const filterBtn = page.locator('.new-filter-btn');

        // Get computed styles
        const filterStyles = await filterBtn.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
                background: styles.getPropertyValue('background'),
                backgroundImage: styles.getPropertyValue('background-image'),
                // Get CSS custom properties
                posX: styles.getPropertyValue('--pos-x'),
                posY: styles.getPropertyValue('--pos-y'),
                spreadX: styles.getPropertyValue('--spread-x'),
                spreadY: styles.getPropertyValue('--spread-y'),
                color1: styles.getPropertyValue('--color-1'),
                color2: styles.getPropertyValue('--color-2'),
                color3: styles.getPropertyValue('--color-3'),
                color4: styles.getPropertyValue('--color-4'),
                color5: styles.getPropertyValue('--color-5'),
            };
        });

        // Validate gradient structure - should be radial-gradient
        expect(filterStyles.backgroundImage).toContain('radial-gradient');

        // Validate initial position values match specification
        expect(filterStyles.posX.trim()).toBe('11.14%');
        expect(filterStyles.posY.trim()).toBe('140%');
        expect(filterStyles.spreadX.trim()).toBe('150%');
        expect(filterStyles.spreadY.trim()).toBe('180.06%');

        // Validate Technology/Blue color scheme
        expect(filterStyles.color1.trim()).toBe('#000');
        expect(filterStyles.color2.trim()).toBe('#08122c');
        expect(filterStyles.color3.trim()).toBe('#1e3a6a');
        expect(filterStyles.color4.trim()).toBe('#4678b8');
        expect(filterStyles.color5.trim()).toBe('#4488ff');

        console.log('✅ Filter button gradient structure matches specification');
    });

    test('Filter button should match timeline milestone button visually', async ({ page }) => {
        // Take screenshot of filter button (closed state)
        await page.locator('.new-filter-btn').screenshot({
            path: 'test-results/filter-btn-closed-after-fix.png'
        });

        // Find a technology milestone button for comparison
        const techMilestone = page.locator('.timeline-milestone.technology .milestone-dot').first();

        if (await techMilestone.count() > 0) {
            // Take screenshot of reference milestone button
            await techMilestone.screenshot({
                path: 'test-results/milestone-tech-reference.png'
            });

            // Get computed styles of both
            const filterStyles = await page.locator('.new-filter-btn').evaluate((el) => {
                const styles = window.getComputedStyle(el);
                return {
                    posX: styles.getPropertyValue('--pos-x').trim(),
                    posY: styles.getPropertyValue('--pos-y').trim(),
                    color1: styles.getPropertyValue('--color-1').trim(),
                    color5: styles.getPropertyValue('--color-5').trim(),
                };
            });

            const milestoneStyles = await techMilestone.evaluate((el) => {
                const styles = window.getComputedStyle(el);
                return {
                    posX: styles.getPropertyValue('--pos-x').trim(),
                    posY: styles.getPropertyValue('--pos-y').trim(),
                    color1: styles.getPropertyValue('--color-1').trim(),
                    color5: styles.getPropertyValue('--color-5').trim(),
                };
            });

            // Compare key gradient properties
            expect(filterStyles.posX).toBe(milestoneStyles.posX);
            expect(filterStyles.posY).toBe(milestoneStyles.posY);
            expect(filterStyles.color1).toBe(milestoneStyles.color1);
            expect(filterStyles.color5).toBe(milestoneStyles.color5);

            console.log('✅ Filter button gradient matches timeline milestone gradient');
        } else {
            console.log('⚠️  No technology milestone found for comparison');
        }
    });

    test('Filter option buttons should have correct gradient themes', async ({ page }) => {
        // Expand filter
        await page.locator('.new-filter-btn').click();
        await page.waitForTimeout(500);

        // Take screenshot of expanded filter
        await page.locator('.new-filter-container').screenshot({
            path: 'test-results/filter-expanded-after-fix.png'
        });

        // Test Operations button (Purple theme)
        const operationsBtn = page.locator('.filter-option-btn.filter-operations');
        if (await operationsBtn.count() > 0) {
            const opStyles = await operationsBtn.evaluate((el) => {
                const styles = window.getComputedStyle(el);
                return {
                    color1: styles.getPropertyValue('--color-1').trim(),
                    color5: styles.getPropertyValue('--color-5').trim(),
                };
            });
            expect(opStyles.color1).toBe('#000');
            expect(opStyles.color5).toBe('#9944ff'); // Purple
            console.log('✅ Operations button has correct purple theme');
        }

        // Test Tech button (Blue theme)
        const techBtn = page.locator('.filter-option-btn.filter-tech');
        if (await techBtn.count() > 0) {
            const techStyles = await techBtn.evaluate((el) => {
                const styles = window.getComputedStyle(el);
                return {
                    color5: styles.getPropertyValue('--color-5').trim(),
                };
            });
            expect(techStyles.color5).toBe('#4488ff'); // Blue
            console.log('✅ Tech button has correct blue theme');
        }

        // Test Completed button (Green theme)
        const completedBtn = page.locator('.filter-option-btn.filter-completed');
        if (await completedBtn.count() > 0) {
            const completedStyles = await completedBtn.evaluate((el) => {
                const styles = window.getComputedStyle(el);
                return {
                    color5: styles.getPropertyValue('--color-5').trim(),
                };
            });
            expect(completedStyles.color5).toBe('#00ff96'); // Green
            console.log('✅ Completed button has correct green theme');
        }

        // Test In Progress button (Gray theme)
        const inProgressBtn = page.locator('.filter-option-btn.filter-in-progress');
        if (await inProgressBtn.count() > 0) {
            const inProgressStyles = await inProgressBtn.evaluate((el) => {
                const styles = window.getComputedStyle(el);
                return {
                    color5: styles.getPropertyValue('--color-5').trim(),
                };
            });
            expect(inProgressStyles.color5).toBe('#d0d0d0'); // Silver
            console.log('✅ In Progress button has correct gray theme');
        }

        // Test Future button (Gold theme)
        const futureBtn = page.locator('.filter-option-btn.filter-future');
        if (await futureBtn.count() > 0) {
            const futureStyles = await futureBtn.evaluate((el) => {
                const styles = window.getComputedStyle(el);
                return {
                    color5: styles.getPropertyValue('--color-5').trim(),
                };
            });
            expect(futureStyles.color5).toBe('#ffdd44'); // Gold
            console.log('✅ Future button has correct gold theme');
        }
    });

    test('Hover states should match milestone hover gradients', async ({ page }) => {
        // Hover over filter button
        const filterBtn = page.locator('.new-filter-btn');
        await filterBtn.hover();
        await page.waitForTimeout(600); // Wait for transition

        // Get hover state styles
        const hoverStyles = await filterBtn.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
                posX: styles.getPropertyValue('--pos-x').trim(),
                posY: styles.getPropertyValue('--pos-y').trim(),
                spreadX: styles.getPropertyValue('--spread-x').trim(),
                spreadY: styles.getPropertyValue('--spread-y').trim(),
            };
        });

        // Validate hover positions match specification
        expect(hoverStyles.posX).toBe('0%');
        expect(hoverStyles.posY).toBe('91.51%');
        expect(hoverStyles.spreadX).toBe('120.24%');
        expect(hoverStyles.spreadY).toBe('103.18%');

        // Take screenshot of hover state
        await filterBtn.screenshot({
            path: 'test-results/filter-btn-hover-after-fix.png'
        });

        console.log('✅ Filter button hover state matches milestone specification');
    });
});
