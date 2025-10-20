const { test } = require('@playwright/test');

test('Debug owl video frozen', async ({ page }) => {
  await page.goto('http://localhost:3005/timeline-dev.html');

  await page.waitForTimeout(3000);

  // Check center owl video
  const centerVideo = await page.locator('#center-owl-video').evaluate(video => ({
    paused: video.paused,
    currentTime: video.currentTime,
    duration: video.duration,
    readyState: video.readyState,
    networkState: video.networkState,
    error: video.error ? video.error.message : null,
    src: video.src,
    autoplay: video.autoplay,
    muted: video.muted,
    loop: video.loop
  }));

  console.log('=== CENTER OWL VIDEO STATUS ===');
  console.log('Paused:', centerVideo.paused);
  console.log('Current Time:', centerVideo.currentTime);
  console.log('Duration:', centerVideo.duration);
  console.log('Ready State:', centerVideo.readyState, '(4 = HAVE_ENOUGH_DATA)');
  console.log('Network State:', centerVideo.networkState, '(2 = NETWORK_LOADING, 3 = NETWORK_IDLE)');
  console.log('Error:', centerVideo.error);
  console.log('Src:', centerVideo.src);
  console.log('Autoplay:', centerVideo.autoplay);
  console.log('Muted:', centerVideo.muted);
  console.log('Loop:', centerVideo.loop);

  // Wait a bit and check if time changes
  await page.waitForTimeout(2000);

  const centerVideoAfter = await page.locator('#center-owl-video').evaluate(video => ({
    currentTime: video.currentTime,
    paused: video.paused
  }));

  console.log('');
  console.log('After 2 seconds:');
  console.log('Current Time:', centerVideoAfter.currentTime);
  console.log('Paused:', centerVideoAfter.paused);
  console.log('Time changed:', centerVideoAfter.currentTime !== centerVideo.currentTime);

  // Try to play manually
  await page.locator('#center-owl-video').evaluate(video => video.play());

  await page.waitForTimeout(1000);

  const centerVideoAfterPlay = await page.locator('#center-owl-video').evaluate(video => ({
    currentTime: video.currentTime,
    paused: video.paused
  }));

  console.log('');
  console.log('After manual play():');
  console.log('Current Time:', centerVideoAfterPlay.currentTime);
  console.log('Paused:', centerVideoAfterPlay.paused);

  await page.screenshot({ path: 'test-results/owl-video-debug.png' });
});
