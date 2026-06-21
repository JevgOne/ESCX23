import { test, expect } from 'playwright/test';

test('Admin login - checkbox viditelny + login BEZ remember me', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/admin/login');
  await page.waitForLoadState('networkidle');

  // Ověř checkbox je viditelný
  const checkbox = page.locator('input[name="remember"]');
  await expect(checkbox).toBeVisible();

  const checkboxLabel = page.locator('label.escx-login-remember span');
  await expect(checkboxLabel).toContainText('Zapamatovat si mě');

  // Přihlas BEZ checkboxu (nechej unchecked)
  await page.fill('input[name="email"]', 'admin@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Admin2026!');
  await expect(checkbox).not.toBeChecked();

  await page.click('button[type="submit"]');
  await page.waitForURL(/\/cs\/admin(?!\/login)/, { timeout: 15000 });

  const finalUrl = page.url();
  console.log('Admin login OK, URL:', finalUrl);
  await page.screenshot({ path: '/tmp/admin-after-login.png' });
});

test('Studio login - checkbox viditelny + login anetta', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/studio/login');
  await page.waitForLoadState('networkidle');

  // Ověř checkbox je viditelný
  const checkbox = page.locator('input[name="remember"]');
  await expect(checkbox).toBeVisible();

  const checkboxLabel = page.locator('label.escx-login-remember span');
  await expect(checkboxLabel).toContainText('Zapamatovat si mě');

  await page.fill('input[name="email"]', 'anetta@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Anetta2026!');

  await page.click('button[type="submit"]');
  await page.waitForURL(/\/cs\/studio(?!\/login)/, { timeout: 15000 });

  const finalUrl = page.url();
  console.log('Studio login OK, URL:', finalUrl);
  await page.screenshot({ path: '/tmp/studio-after-login.png' });
});
