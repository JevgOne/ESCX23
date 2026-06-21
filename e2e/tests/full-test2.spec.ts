import { test, expect } from 'playwright/test';

test('2. Studio login — remember me checkbox', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/studio/login');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/t2-studio-login.png' });
  
  const checkbox = page.locator('input[name="remember"]');
  await expect(checkbox).toBeVisible({ timeout: 10000 });
  await expect(checkbox).not.toBeChecked();
  
  // Use timeout-safe textContent
  const labelText = await page.locator('label.escx-login-remember').textContent({ timeout: 5000 }).catch(() => 'N/A');
  console.log('Studio remember label:', labelText);
  
  await page.fill('input[name="email"]', 'anetta@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Anetta2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/cs\/studio(?!\/login)/, { timeout: 15000 });
  console.log('Studio login OK:', page.url());
  await page.screenshot({ path: '/tmp/t2-studio-dashboard.png' });
});

test('3. Pobocka Praha-2 — apartment reviews sekce', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/pobocka/praha-2');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/t3-praha2-top.png' });
  
  const title = await page.title();
  console.log('Page title:', title);
  console.log('Page URL:', page.url());
  
  const bodyText = await page.locator('body').textContent() || '';
  
  // Check for reviews section keywords
  const hasRating = bodyText.includes('hodnocen') || bodyText.includes('Hodnocen') || bodyText.includes('hvězd') || bodyText.includes('★') || bodyText.includes('Ohodnotit');
  const hasForm = bodyText.includes('Ohodnotit') || bodyText.includes('Napsat recenzi') || bodyText.includes('recenz') || bodyText.includes('Recenz');
  
  console.log('Has rating/reviews section:', hasRating);
  console.log('Has review form:', hasForm);
  
  // Scroll to find reviews section
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/t3-praha2-bottom.png' });
  
  // Look for stars or rating inputs
  const starInputs = await page.locator('input[type="radio"], input[name*="rating"], [class*="star"], [class*="rating"]').count();
  console.log('Star/rating inputs:', starInputs);
  
  const forms = await page.locator('form').all();
  console.log('Forms on page:', forms.length);
  for (const form of forms) {
    const action = await form.getAttribute('action').catch(() => 'n/a');
    const method = await form.getAttribute('method').catch(() => 'n/a');
    console.log('  Form action:', action, 'method:', method);
  }
});
