import { test, expect } from 'playwright/test';

test('Debug v2 - admin login po restartu', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/admin/login');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/admin-login-v2.png' });
  
  const inputs = await page.locator('input').all();
  console.log('Input count:', inputs.length);
  for (const input of inputs) {
    const name = await input.getAttribute('name');
    const type = await input.getAttribute('type');
    console.log('Input:', type, name);
  }
  
  const forms = await page.locator('form').count();
  console.log('Form count:', forms);
});
