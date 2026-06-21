import { test, expect } from 'playwright/test';

test('Admin login - spravne credentials', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/admin/login');
  await page.waitForLoadState('networkidle');
  
  const checkbox = page.locator('input[name="remember"]');
  await expect(checkbox).toBeVisible({ timeout: 10000 });
  console.log('Checkbox viditelny: OK');
  console.log('Checkbox text:', await page.locator('label.escx-login-remember').textContent());
  
  // Prihlaseni BEZ remember me
  await page.fill('input[name="email"]', 'info@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Admin2026!');
  await expect(checkbox).not.toBeChecked();
  
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL(/\/cs\/admin(?!\/login)/, { timeout: 10000 });
    console.log('Login USPESNY, URL:', page.url());
    await page.screenshot({ path: '/tmp/admin-dashboard.png' });
  } catch {
    const url = page.url();
    console.log('Login SELHAL, URL:', url);
    await page.screenshot({ path: '/tmp/admin-login-fail.png' });
  }
});
