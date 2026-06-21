import { test, expect } from 'playwright/test';

test('Anetta profil — VIDEO tab a zpet PHOTO', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/profil/anetta');
  await page.waitForLoadState('networkidle');
  
  // Handle age gate if present
  const ageGateButton = page.locator('button:has-text("Souhlasím")');
  if (await ageGateButton.count() > 0) {
    await ageGateButton.first().click();
    await page.waitForLoadState('networkidle');
  }
  
  await page.screenshot({ path: '/tmp/v1-profile-default.png' });
  
  // Find tabs - look for FOTO/VIDEO tab buttons or links
  const allTabs = await page.locator('a, button').filter({ hasText: /foto|video|photo/i }).all();
  console.log('Tab elements found:', allTabs.length);
  for (const tab of allTabs) {
    const text = await tab.textContent();
    const href = await tab.getAttribute('href').catch(() => null);
    const cls = await tab.getAttribute('class').catch(() => null);
    console.log(`  Tab: "${text?.trim()}" href="${href}" class="${cls}"`);
  }
  
  // Check current URL and tab state
  console.log('Initial URL:', page.url());
  
  // Click VIDEO tab
  const videoTab = page.locator('a, button').filter({ hasText: /^video$/i }).first();
  const videoTabAlt = page.locator('a[href*="video"], a[href*="tab=video"], [data-tab="video"], [href*="?tab=video"]').first();
  
  let videoTabEl = null;
  if (await videoTab.count() > 0) {
    videoTabEl = videoTab;
    console.log('Found video tab by text');
  } else if (await videoTabAlt.count() > 0) {
    videoTabEl = videoTabAlt;
    console.log('Found video tab by href/attr');
  }
  
  if (videoTabEl) {
    await videoTabEl.click();
    await page.waitForLoadState('networkidle');
    console.log('After VIDEO click, URL:', page.url());
    await page.screenshot({ path: '/tmp/v2-video-tab.png' });
    
    // Check video content appeared
    const bodyText = await page.locator('body').textContent() || '';
    const hasVideoContent = bodyText.includes('Video') || bodyText.includes('video') || 
                             bodyText.includes('vimeo') || bodyText.includes('Vimeo') ||
                             bodyText.includes('iframe');
    const videoElements = await page.locator('video, iframe, [class*="video"]').count();
    console.log('Has video content in text:', hasVideoContent);
    console.log('Video/iframe elements:', videoElements);
    
    // Now click PHOTO/FOTO tab
    const photoTab = page.locator('a, button').filter({ hasText: /^foto$/i }).first();
    const photoTabAlt = page.locator('a[href*="foto"], a[href*="photo"], [data-tab="foto"]').first();
    
    let photoTabEl = null;
    if (await photoTab.count() > 0) {
      photoTabEl = photoTab;
    } else if (await photoTabAlt.count() > 0) {
      photoTabEl = photoTabAlt;
    }
    
    if (photoTabEl) {
      await photoTabEl.click();
      await page.waitForLoadState('networkidle');
      console.log('After PHOTO click, URL:', page.url());
      await page.screenshot({ path: '/tmp/v3-photo-tab.png' });
      
      const photoElements = await page.locator('img[class*="photo"], img[class*="gallery"], [class*="photo"], [class*="gallery"]').count();
      console.log('Photo elements:', photoElements);
    } else {
      console.log('PHOTO tab not found');
    }
  } else {
    console.log('VIDEO tab not found — listing all links:');
    const links = await page.locator('a').all();
    for (const link of links.slice(0, 20)) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      if (text?.trim()) console.log(`  "${text.trim()}" -> ${href}`);
    }
  }
});
