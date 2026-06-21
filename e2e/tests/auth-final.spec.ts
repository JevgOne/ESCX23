import { test, expect } from 'playwright/test';

test('Admin login - info@lovelygirls.cz BEZ remember me', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/admin/login');
  await page.waitForLoadState('networkidle');
  
  // Verify checkbox
  const checkbox = page.locator('input[name="remember"]');
  await expect(checkbox).toBeVisible({ timeout: 10000 });
  await expect(checkbox).not.toBeChecked();
  
  const labelText = await page.locator('label.escx-login-remember').textContent();
  console.log('Remember label:', labelText);
  
  // Login BEZ remember me
  await page.fill('input[name="email"]', 'info@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Admin2026!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/cs\/admin(?!\/login)/, { timeout: 15000 });
  console.log('Admin login OK, URL:', page.url());
  await page.screenshot({ path: '/tmp/admin-dashboard-final.png' });
});

test('Studio login - anetta@lovelygirls.cz', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/studio/login');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/studio-login-page.png' });
  
  // Check what inputs exist
  const inputs = await page.locator('input').all();
  console.log('Studio inputs:', inputs.length);
  for (const input of inputs) {
    const name = await input.getAttribute('name');
    const type = await input.getAttribute('type');
    const visible = await input.isVisible();
    console.log(`  input[type="${type}"][name="${name}"] visible=${visible}`);
  }
  
  // Verify checkbox
  const checkbox = page.locator('input[name="remember"]');
  await expect(checkbox).toBeVisible({ timeout: 10000 });
  
  // Login
  await page.fill('input[name="email"]', 'anetta@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Anetta2026!');
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL(/\/cs\/studio(?!\/login)/, { timeout: 15000 });
    console.log('Studio login OK, URL:', page.url());
    await page.screenshot({ path: '/tmp/studio-dashboard-final.png' });
  } catch {
    console.log('Studio login SELHAL, URL:', page.url());
    await page.screenshot({ path: '/tmp/studio-login-fail.png' });
  }
});
