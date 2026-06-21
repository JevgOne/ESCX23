import { test } from 'playwright/test';

test('Anetta ?tab=video — jak vypada strana', async ({ page }) => {
  // Set cookie to skip age gate
  await page.goto('http://localhost:3000/cs');
  await page.waitForLoadState('domcontentloaded');
  
  // Set age confirmation cookie
  await page.context().addCookies([{
    name: 'age_confirmed',
    value: '1',
    domain: 'localhost',
    path: '/',
  }]);
  
  await page.goto('http://localhost:3000/cs/profil/anetta?tab=video');
  await page.waitForLoadState('networkidle');
  
  // Handle age gate if still showing
  const ageGateButton = page.locator('button:has-text("Souhlasím")');
  if (await ageGateButton.count() > 0) {
    await ageGateButton.first().click();
    await page.waitForLoadState('networkidle');
  }
  
  await page.screenshot({ path: '/tmp/v-tab-video-param.png' });
  console.log('URL:', page.url());
  
  // Check what tabs are visible
  const tabs = await page.locator('[class*="media-tab"]').all();
  console.log('Media tabs:', tabs.length);
  for (const tab of tabs) {
    const text = await tab.textContent();
    const cls = await tab.getAttribute('class');
    const href = await tab.getAttribute('href').catch(() => null);
    console.log(`  "${text?.trim()}" class="${cls}" href="${href}"`);
  }
  
  // Check page content area
  const mediaArea = await page.locator('[class*="media-"], [class*="gallery"], [class*="photos"]').count();
  console.log('Media area elements:', mediaArea);
  
  // Scroll down to see tab area
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/v-tab-video-scrolled.png' });
});
