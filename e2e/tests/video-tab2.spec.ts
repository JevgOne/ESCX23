import { test, expect } from 'playwright/test';

test('Anetta profil — tab sekce + video stav', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/profil/anetta');
  await page.waitForLoadState('networkidle');
  
  // Bypass age gate - try multiple selectors
  const ageButtons = [
    'button:has-text("Souhlasím")',
    'button:has-text("Souhlasim")',
    'button[class*="confirm"]',
    'button[class*="age"]',
    'form button[type="submit"]',
  ];
  
  for (const sel of ageButtons) {
    const btn = page.locator(sel);
    if (await btn.count() > 0) {
      console.log('Age gate bypassed with:', sel);
      await btn.first().click();
      await page.waitForLoadState('networkidle');
      break;
    }
  }
  
  await page.screenshot({ path: '/tmp/v1-after-agegate.png' });
  console.log('URL after age gate:', page.url());
  
  // Find all tab-like elements
  const tabs = await page.locator('[class*="tab"], [class*="media-tab"], nav a, .profile-tabs a').all();
  console.log('Tab elements found:', tabs.length);
  for (const tab of tabs) {
    const text = await tab.textContent();
    const href = await tab.getAttribute('href');
    const cls = await tab.getAttribute('class');
    if (text?.trim()) console.log(`  "${text.trim()}" href="${href}" class="${cls}"`);
  }
  
  // Specifically look for video tab
  const videoTab = page.locator('[class*="tab"]:has-text("Video"), [class*="tab"]:has-text("video"), a:has-text("Video"), a:has-text("video")');
  const videoCount = await videoTab.count();
  console.log('Video tab count:', videoCount);
  
  if (videoCount === 0) {
    console.log('VIDEO TAB NOT VISIBLE — checking if girl has videos in page source');
    const html = await page.content();
    const hasVideoInHtml = html.toLowerCase().includes('video');
    console.log('Video mentioned in HTML:', hasVideoInHtml);
    
    // Check ?tab=video URL approach
    await page.goto('http://localhost:3000/cs/profil/anetta?tab=video');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/v2-video-url-param.png' });
    console.log('?tab=video URL:', page.url());
    const bodyText2 = await page.locator('body').textContent() || '';
    console.log('Body has video content:', bodyText2.includes('Video') || bodyText2.includes('video'));
  } else {
    // Click video tab
    await videoTab.first().click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/v2-video-active.png' });
    console.log('Video tab URL:', page.url());
    
    // Back to photo
    const photoTab = page.locator('[class*="tab"]:has-text("Foto"), a:has-text("Foto")').first();
    if (await photoTab.count() > 0) {
      await photoTab.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '/tmp/v3-photo-back.png' });
      console.log('Photo tab URL:', page.url());
    }
  }
});
