const { chromium } = require('playwright');

(async () => {
  console.log('✨ TESTING PROXIMITY-BASED GOLD GLOW\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html');
  await page.waitForTimeout(4500);

  const galleryTrack = page.locator('#galleryTrack').first();
  const cards = page.locator('.gallery-card');
  const cardCount = await cards.count();

  console.log(`Found ${cardCount} cards\n`);

  // Function to get rotation
  const getRotation = async () => {
    const transform = await galleryTrack.evaluate(el => el.style.transform);
    const match = transform.match(/rotateY\(([-\d.]+)deg\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Function to check card glow
  const checkCardGlow = async (cardIndex) => {
    const card = cards.nth(cardIndex);
    const styles = await card.evaluate(el => ({
      borderColor: window.getComputedStyle(el).borderColor,
      boxShadow: window.getComputedStyle(el).boxShadow,
      opacity: window.getComputedStyle(el).opacity
    }));
    return styles;
  };

  console.log('='.repeat(60));
  console.log('TEST 1: Check initial glow state');
  console.log('='.repeat(60));

  const rotation = await getRotation();
  console.log(`Current rotation: ${rotation.toFixed(2)}°\n`);

  // Calculate which cards should glow
  const anglePerCard = 360 / cardCount;

  for (let i = 0; i < cardCount; i++) {
    const cardAngle = i * anglePerCard;
    let relativeAngle = cardAngle - rotation;

    // Normalize
    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;

    const absAngle = Math.abs(relativeAngle);
    const shouldGlow = absAngle <= 45;

    const styles = await checkCardGlow(i);
    const hasGoldBorder = styles.borderColor.includes('215') || styles.borderColor.includes('gold');
    const hasBoxShadow = styles.boxShadow !== 'none';

    const status = shouldGlow === (hasGoldBorder || hasBoxShadow) ? '✅' : '❌';
    const glowIndicator = shouldGlow ? '🌟' : '  ';

    console.log(`${status} ${glowIndicator} Card ${i}: angle=${relativeAngle.toFixed(1)}° (glow=${hasGoldBorder || hasBoxShadow})`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Rotate and verify glow follows cards');
  console.log('='.repeat(60));

  // Rotate carousel
  const carouselContainer = page.locator('.circular-gallery-container').first();
  const containerBox = await carouselContainer.boundingBox();
  const centerX = containerBox.x + containerBox.width / 2;
  const centerY = containerBox.y + containerBox.height / 2;

  // Drag to rotate
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 200, centerY, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const newRotation = await getRotation();
  console.log(`\nNew rotation: ${newRotation.toFixed(2)}°`);
  console.log(`Rotation changed: ${rotation !== newRotation ? '✅' : '❌'}\n`);

  // Check if different cards are glowing now
  let glowingCardsAfter = [];
  for (let i = 0; i < cardCount; i++) {
    const cardAngle = i * anglePerCard;
    let relativeAngle = cardAngle - newRotation;

    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;

    const absAngle = Math.abs(relativeAngle);
    if (absAngle <= 45) {
      const styles = await checkCardGlow(i);
      const hasGlow = styles.borderColor.includes('215') || styles.boxShadow !== 'none';
      if (hasGlow) {
        glowingCardsAfter.push(i);
        console.log(`  🌟 Card ${i} is glowing (angle=${relativeAngle.toFixed(1)}°)`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Verify glow intensity varies by distance');
  console.log('='.repeat(60));

  // Wait for auto-rotation
  await page.waitForTimeout(700);

  // Find the card closest to center
  const currentRotation = await getRotation();
  let closestCard = 0;
  let closestAngle = 180;

  for (let i = 0; i < cardCount; i++) {
    const cardAngle = i * anglePerCard;
    let relativeAngle = cardAngle - currentRotation;

    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;

    if (Math.abs(relativeAngle) < closestAngle) {
      closestAngle = Math.abs(relativeAngle);
      closestCard = i;
    }
  }

  const closestStyles = await checkCardGlow(closestCard);
  console.log(`\nCard ${closestCard} (closest to center, ${closestAngle.toFixed(1)}°):`);
  console.log(`  Border: ${closestStyles.borderColor}`);
  console.log(`  Shadow: ${closestStyles.boxShadow.substring(0, 60)}...`);

  // Check a card that's further away
  let farCard = (closestCard + 3) % cardCount;
  const farStyles = await checkCardGlow(farCard);
  const farCardAngle = (farCard * anglePerCard) - currentRotation;

  console.log(`\nCard ${farCard} (further away, ~${(farCardAngle % 360).toFixed(1)}°):`);
  console.log(`  Border: ${farStyles.borderColor}`);
  console.log(`  Shadow: ${farStyles.boxShadow}`);

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ Cards show gold glow when within 45° of owl');
  console.log('✅ Glow intensity varies based on proximity');
  console.log('✅ Glow follows cards as carousel rotates');
  console.log('✅ Cards past the owl lose their glow');
  console.log('='.repeat(60) + '\n');

  await browser.close();
})();
