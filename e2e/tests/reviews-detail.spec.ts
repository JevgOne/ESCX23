import { test, expect } from 'playwright/test';

test('Praha-2 — najdi reviews sekci detailne', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/pobocka/praha-2');
  await page.waitForLoadState('networkidle');
  
  // Bypass age gate
  const ageGateButton = page.locator('button:has-text("Souhlasím"), button:has-text("Souhlasim"), [class*="age"] button');
  if (await ageGateButton.count() > 0) {
    await ageGateButton.first().click();
    await page.waitForLoadState('networkidle');
  }
  
  // Get total page height
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log('Page height:', pageHeight);
  
  // Take screenshots at 25%, 50%, 75%
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.25));
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/reviews-25pct.png' });
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/reviews-50pct.png' });
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/reviews-75pct.png' });
  
  // Find review-related elements
  const reviewSection = page.locator('[class*="review"], [class*="recenz"], [class*="hodnocen"], [id*="review"], [id*="recenz"]');
  const count = await reviewSection.count();
  console.log('Review section elements:', count);
  for (let i = 0; i < Math.min(count, 5); i++) {
    const el = reviewSection.nth(i);
    const tag = await el.evaluate(e => e.tagName);
    const cls = await el.getAttribute('class');
    console.log(`  [${i}] <${tag}> class="${cls}"`);
  }
  
  // Find star rating form
  const ratingForm = page.locator('[class*="rate"], [class*="star"], input[name*="rating"], input[name="stars"], input[name="score"]');
  console.log('Rating form elements:', await ratingForm.count());
  
  // Full body text extract for review keywords
  const bodyText = await page.locator('body').textContent() || '';
  const idx = bodyText.indexOf('ecenz');
  if (idx > -1) {
    console.log('Context around "recenz":', bodyText.substring(Math.max(0, idx-50), idx+200));
  }
  const idx2 = bodyText.indexOf('Ohodnotit');
  if (idx2 > -1) {
    console.log('Context around "Ohodnotit":', bodyText.substring(Math.max(0, idx2-50), idx2+200));
  }
});
