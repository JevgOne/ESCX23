import { test, expect } from 'playwright/test';

test('Debug - what does admin login page look like', async ({ page }) => {
  await page.goto('http://localhost:3000/cs/admin/login');
  await page.waitForLoadState('networkidle');
  
  const html = await page.content();
  // Look for form elements
  const hasRemember = html.includes('remember');
  const hasCheckbox = html.includes('type="checkbox"');
  const hasForm = html.includes('<form');
  
  console.log('Has form:', hasForm);
  console.log('Has remember:', hasRemember);
  console.log('Has checkbox:', hasCheckbox);
  console.log('Page URL:', page.url());
  
  // Screenshot
  await page.screenshot({ path: '/tmp/admin-login-debug.png' });
  
  // Print all input elements
  const inputs = await page.locator('input').all();
  console.log('Input count:', inputs.length);
  for (const input of inputs) {
    const name = await input.getAttribute('name');
    const type = await input.getAttribute('type');
    console.log('Input:', type, name);
  }
});
