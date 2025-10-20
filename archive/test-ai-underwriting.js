const { chromium } = require('playwright');

(async () => {
  console.log('🔍 TESTING AI UNDERWRITING CARD GLOW\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/timeline-dev.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);

  console.log('='.repeat(80));
  console.log('ROTATING CAROUSEL TO BRING AI UNDERWRITING TO FRONT');
  console.log('='.repeat(80));

  // Get initial state
  const initial = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const track = document.getElementById('galleryTrack');
    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');

    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterX = owlRect.left + owlRect.width / 2;
    const owlCenterY = owlRect.top + owlRect.height / 2;

    const transform = track.style.transform;
    const rotationMatch = transform.match(/rotateY\(([\d.-]+)deg\)/);
    const rotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
    const anglePerCard = 360 / cards.length;

    const aiCard = cards[10]; // AI Underwriting is card 10
    const cardAngle = 10 * anglePerCard;
    let relativeAngle = cardAngle - rotation;
    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;

    const cardRect = aiCard.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;

    const distance = Math.sqrt(
      Math.pow(cardCenterX - owlCenterX, 2) +
      Math.pow(cardCenterY - owlCenterY, 2)
    );

    return {
      rotation,
      angle: relativeAngle.toFixed(1),
      distance: Math.round(distance),
      owlCenter: { x: Math.round(owlCenterX), y: Math.round(owlCenterY) },
      cardCenter: { x: Math.round(cardCenterX), y: Math.round(cardCenterY) },
      owlDiameter: Math.round(owlRect.width),
      hasGlow: aiCard.style.borderColor?.includes('215, 0'),
      borderColor: aiCard.style.borderColor || 'not set'
    };
  });

  console.log(`\nInitial State:`);
  console.log(`  Carousel rotation: ${initial.rotation}°`);
  console.log(`  AI Underwriting angle: ${initial.angle}°`);
  console.log(`  Owl center: (${initial.owlCenter.x}, ${initial.owlCenter.y})`);
  console.log(`  Owl diameter: ${initial.owlDiameter}px`);
  console.log(`  Card center: (${initial.cardCenter.x}, ${initial.cardCenter.y})`);
  console.log(`  Distance to owl: ${initial.distance}px`);
  console.log(`  Has gold glow: ${initial.hasGlow ? 'YES ✨' : 'NO ❌'}`);
  console.log(`  Border color: ${initial.borderColor}`);

  // Calculate how much to rotate to bring AI Underwriting to 0°
  const targetRotation = 10 * 30; // Card 10 at 300°
  const currentRotation = parseFloat(initial.rotation);
  const rotationNeeded = targetRotation - currentRotation;

  console.log(`\n\nRotating carousel to bring AI Underwriting to front (0°)...`);
  console.log(`  Need to rotate by: ${rotationNeeded.toFixed(1)}°`);

  const carouselContainer = page.locator('.circular-gallery-container').first();
  const box = await carouselContainer.boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Drag to rotate (approximate rotation based on pixel movement)
  const dragAmount = rotationNeeded * 2; // Rough estimate: 1px = 0.5°
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + dragAmount, centerY, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  console.log('\n' + '='.repeat(80));
  console.log('AFTER ROTATION - AI UNDERWRITING AT FRONT');
  console.log('='.repeat(80));

  const afterRotation = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const track = document.getElementById('galleryTrack');
    const owlElement = document.querySelector('.landing-owl .wisr-video-circle') ||
                       document.querySelector('.landing-owl');

    const owlRect = owlElement.getBoundingClientRect();
    const owlCenterX = owlRect.left + owlRect.width / 2;
    const owlCenterY = owlRect.top + owlRect.height / 2;

    const transform = track.style.transform;
    const rotationMatch = transform.match(/rotateY\(([\d.-]+)deg\)/);
    const rotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
    const anglePerCard = 360 / cards.length;

    const aiCard = cards[10];
    const cardAngle = 10 * anglePerCard;
    let relativeAngle = cardAngle - rotation;
    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;

    const cardRect = aiCard.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;

    const distance = Math.sqrt(
      Math.pow(cardCenterX - owlCenterX, 2) +
      Math.pow(cardCenterY - owlCenterY, 2)
    );

    const hasGlow = aiCard.style.borderColor?.includes('215, 0');

    return {
      rotation: rotation.toFixed(2),
      angle: relativeAngle.toFixed(1),
      distance: Math.round(distance),
      cardCenter: { x: Math.round(cardCenterX), y: Math.round(cardCenterY) },
      hasGlow,
      borderColor: aiCard.style.borderColor || 'not set',
      boxShadow: aiCard.style.boxShadow || 'not set',
      absAngle: Math.abs(relativeAngle).toFixed(1)
    };
  });

  console.log(`\nAfter Rotation:`);
  console.log(`  New carousel rotation: ${afterRotation.rotation}°`);
  console.log(`  AI Underwriting angle: ${afterRotation.angle}° (abs: ${afterRotation.absAngle}°)`);
  console.log(`  Card center: (${afterRotation.cardCenter.x}, ${afterRotation.cardCenter.y})`);
  console.log(`  Distance to owl: ${afterRotation.distance}px`);
  console.log(`  Has gold glow: ${afterRotation.hasGlow ? 'YES ✨' : 'NO ❌'}`);
  console.log(`  Border color: ${afterRotation.borderColor}`);
  console.log(`  Box shadow: ${afterRotation.boxShadow.substring(0, 60)}...`);

  // Calculate glow intensity (using quadratic curve like the actual code)
  const normalizedDistance = afterRotation.distance / 450;
  const glowIntensity = 1 - Math.pow(normalizedDistance, 2);
  const glowStrength = glowIntensity * 1.0;

  console.log(`\n  Calculated glow intensity: ${glowIntensity.toFixed(3)} (${(glowIntensity * 100).toFixed(1)}%)`);
  console.log(`  Calculated glow strength: ${glowStrength.toFixed(3)}`);

  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSIS');
  console.log('='.repeat(80));

  if (!afterRotation.hasGlow) {
    console.log('\n❌ AI Underwriting is NOT glowing!');
    console.log('   Checking conditions:');
    console.log(`   - Front-facing (angle ≤ 90°): ${parseFloat(afterRotation.absAngle) <= 90 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   - Within distance (≤ 450px): ${afterRotation.distance <= 450 ? 'YES ✓' : 'NO ✗'}`);

    if (parseFloat(afterRotation.absAngle) <= 90 && afterRotation.distance <= 450) {
      console.log('\n   Both conditions met but still not glowing!');
      console.log('   Possible issues:');
      console.log('   - updateCardOpacity not being called');
      console.log('   - CSS override preventing border color');
      console.log('   - JavaScript error preventing glow application');
    }
  } else {
    const intensity = parseFloat(glowIntensity.toFixed(3));
    if (intensity < 0.2) {
      console.log('\n⚠️  AI Underwriting IS glowing but intensity is too low!');
      console.log(`   Current intensity: ${(intensity * 100).toFixed(1)}% (barely visible)`);
      console.log(`   Distance: ${afterRotation.distance}px out of 450px threshold`);
      console.log('\n   SOLUTION: Card is too far from owl - glow is too faint to see');
      console.log('   Need to either:');
      console.log('   1. Make glow intensity curve non-linear (more aggressive)');
      console.log('   2. Increase minimum glow visibility');
      console.log('   3. Check actual distance when card passes closest to owl');
    } else {
      console.log(`\n✅ AI Underwriting is glowing with ${(intensity * 100).toFixed(1)}% intensity`);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

  await browser.close();
})();
