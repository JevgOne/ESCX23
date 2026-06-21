import { test, expect } from 'playwright/test';

test('Admin login full test', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/admin/login');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/admin-login-before.png' });
  
  // Collect all inputs for debugging
  const inputs = await page.locator('input').all();
  console.log('Total inputs:', inputs.length);
  for (const input of inputs) {
    const name = await input.getAttribute('name');
    const type = await input.getAttribute('type');
    const visible = await input.isVisible();
    console.log(`  input[type="${type}"][name="${name}"] visible=${visible}`);
  }
  
  // Verify checkbox
  const checkbox = page.locator('input[name="remember"]');
  await expect(checkbox).toBeVisible({ timeout: 10000 });
  await expect(checkbox).not.toBeChecked();
  console.log('Checkbox found and unchecked - OK');
  
  // Verify label text
  const labelText = await page.locator('label.escx-login-remember').textContent();
  console.log('Label text:', labelText);
  
  // Fill and submit
  await page.fill('input[name="email"]', 'admin@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Admin2026!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/cs\/admin(?!\/login)/, { timeout: 15000 });
  console.log('After login URL:', page.url());
  await page.screenshot({ path: '/tmp/admin-login-after.png' });
});
