import { test, expect } from 'playwright/test';

test('Praha-2 pobocka — apartment reviews po age gate', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/pobocka/praha-2');
  await page.waitForLoadState('networkidle');
  
  // Handle 18+ age gate if present
  const ageGateButton = page.locator('button:has-text("Souhlasím"), button:has-text("Souhlasim"), a:has-text("Souhlasím"), button:has-text("Vstoupit"), button:has-text("Ano"), [class*="age-gate"] button, [class*="confirm"]');
  const ageGateCount = await ageGateButton.count();
  console.log('Age gate buttons found:', ageGateCount);
  
  if (ageGateCount > 0) {
    await ageGateButton.first().click();
    await page.waitForLoadState('networkidle');
    console.log('Age gate bypassed, URL:', page.url());
  }
  
  await page.screenshot({ path: '/tmp/t3-after-agegate.png' });
  
  const bodyText = await page.locator('body').textContent() || '';
  const hasRating = bodyText.includes('hodnocen') || bodyText.includes('Hodnocen') || bodyText.includes('hvězd') || bodyText.includes('Ohodnotit') || bodyText.includes('recenz');
  console.log('Has rating/reviews after age gate:', hasRating);
  
  // Scroll through page
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/t3-middle.png' });
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/t3-bottom.png' });
  
  const starInputs = await page.locator('input[type="radio"], input[name*="rating"], [class*="star"], [class*="rating"]').count();
  console.log('Star/rating elements after age gate:', starInputs);
  
  const forms = await page.locator('form').all();
  console.log('Forms after age gate:', forms.length);
});
