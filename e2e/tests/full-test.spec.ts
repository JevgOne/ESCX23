import { test, expect } from 'playwright/test';

test('1. Admin login — remember me checkbox', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/admin/login');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/t1-admin-login.png' });
  
  const checkbox = page.locator('input[name="remember"]');
  await expect(checkbox).toBeVisible({ timeout: 10000 });
  await expect(checkbox).not.toBeChecked();
  
  const labelText = await page.locator('label.escx-login-remember').textContent();
  console.log('Admin remember label:', labelText);

  // Login
  await page.fill('input[name="email"]', 'info@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Admin2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/cs\/admin(?!\/login)/, { timeout: 15000 });
  console.log('Admin login OK:', page.url());
  await page.screenshot({ path: '/tmp/t1-admin-dashboard.png' });
  
  // Check sidebar for "Recenze apartmanu"
  const sidebarText = await page.locator('nav, aside, [class*="sidebar"], [class*="nav"]').textContent().catch(() => '');
  const hasApartmentReviews = sidebarText.includes('Recenze') || sidebarText.includes('apartmán') || sidebarText.includes('apartman');
  console.log('Sidebar has apartment reviews:', hasApartmentReviews);
  
  // Try direct link
  await page.goto('http://localhost:3000/cs/admin/recenze-apartmanu');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/t1-admin-apartment-reviews.png' });
  console.log('Admin apartment reviews URL:', page.url(), 'status visible:', await page.locator('body').textContent().then(t => t?.substring(0, 100)));
});

test('2. Studio login — remember me checkbox', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/studio/login');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/t2-studio-login.png' });
  
  const checkbox = page.locator('input[name="remember"]');
  await expect(checkbox).toBeVisible({ timeout: 10000 });
  await expect(checkbox).not.toBeChecked();
  
  const labelText = await page.locator('label.escx-login-remember').textContent();
  console.log('Studio remember label:', labelText);
  
  await page.fill('input[name="email"]', 'anetta@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Anetta2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/cs\/studio(?!\/login)/, { timeout: 15000 });
  console.log('Studio login OK:', page.url());
  await page.screenshot({ path: '/tmp/t2-studio-dashboard.png' });
});

test('3. Pobocka Vinohrady — apartment reviews sekce', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/pobocka/vinohrady');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/t3-vinohrady-top.png' });
  
  const bodyText = await page.locator('body').textContent() || '';
  
  // Check for reviews section
  const hasRating = bodyText.includes('hodnocen') || bodyText.includes('Hodnocen') || bodyText.includes('rating') || bodyText.includes('hvězd') || bodyText.includes('★');
  const hasForm = bodyText.includes('Ohodnotit') || bodyText.includes('Napsat') || bodyText.includes('recenzi') || bodyText.includes('Recenze');
  
  console.log('Page has rating section:', hasRating);
  console.log('Page has review form:', hasForm);
  
  // Scroll to bottom to see reviews
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/t3-vinohrady-bottom.png' });
  
  // Count review elements
  const reviewCount = await page.locator('[class*="review"], [class*="recenz"], [class*="rating"]').count();
  console.log('Review elements count:', reviewCount);
  
  // Check for star rating form
  const starForm = await page.locator('form').count();
  console.log('Forms on page:', starForm);
  
  const inputs = await page.locator('form input, form textarea, form select').count();
  console.log('Form inputs count:', inputs);
});
