import { chromium } from 'playwright';

const BASE = 'https://www.lovelygirls.cz/booking';
const EMAIL = 'testchrome@hairland.cz';
const PASS = 'Test123!';

async function getText(page, selector) {
  try {
    const el = await page.$(selector);
    return el ? (await el.textContent()).trim() : null;
  } catch { return null; }
}

async function exists(page, selector) {
  try {
    const el = await page.$(selector);
    return !!el;
  } catch { return false; }
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // LOGIN — form is on /booking root
  console.log('\n=== LOGIN ===');
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  console.log('Login page title:', await page.title());
  console.log('Login URL:', page.url());

  await page.fill('#email', EMAIL);
  await page.fill('#password', PASS);
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  try {
    await page.waitForURL(url => !url.toString().endsWith('/booking'), { timeout: 10000 });
  } catch {
    await page.waitForTimeout(3000);
  }

  console.log('After login URL:', page.url());
  console.log('After login title:', await page.title());

  const errorEl = await page.$('.login-error');
  if (errorEl) {
    console.log('LOGIN ERROR:', await errorEl.textContent());
    console.log('Cannot continue without login. Closing.');
    await page.waitForTimeout(5000);
    await browser.close();
    process.exit(1);
  }

  await page.waitForTimeout(1500);

  // =================== TEST 1: /booking/schedule ===================
  console.log('\n=== TEST 1: /booking/schedule ===');
  await page.goto(`${BASE}/schedule`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  const scheduleH1 = await getText(page, 'h1');
  console.log('H1:', scheduleH1);

  const hasGrid = await exists(page, '[class*="grid"], [class*="schedule"], [class*="week"], table, [class*="Grid"]');
  console.log('Weekly grid element:', hasGrid ? 'FOUND' : 'NOT FOUND');

  // Count girl/staff columns
  const cols = await page.$$('th, [class*="col-"], [class*="column"]');
  console.log('Table columns/headers:', cols.length);

  // Capture visible text snippet
  try {
    const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 500));
    console.log('Page text preview:', bodyText);
  } catch {}

  // =================== TEST 2: /booking/clients ===================
  console.log('\n=== TEST 2: /booking/clients ===');
  await page.goto(`${BASE}/clients`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  try {
    const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 400));
    console.log('Page text preview:', bodyText);
  } catch {}

  // Try clicking first client row
  const firstLink = await page.$('tbody tr:first-child a, tbody tr:first-child, [class*="client"] a:first-child');
  if (firstLink) {
    console.log('Clicking first client...');
    await firstLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    console.log('Client detail URL:', page.url());
    console.log('Client detail title:', await page.title());
    try {
      const detailText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 500));
      console.log('Client detail text:', detailText);
    } catch {}
    const hasGrid2col = await exists(page, '[class*="grid"], [style*="grid"], [class*="two-col"], [class*="twoCol"]');
    console.log('2-column layout:', hasGrid2col ? 'DETECTED' : 'not detected');
    const hasPhone = await exists(page, '[class*="phone"], input[type="tel"]');
    console.log('Phone field:', hasPhone ? 'VISIBLE' : 'not found');
  } else {
    console.log('No client link found in list');
    // Try navigating directly
    await page.goto(`${BASE}/clients/1`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    console.log('Direct /clients/1 URL:', page.url());
    console.log('Direct /clients/1 title:', await page.title());
    try {
      const detailText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 500));
      console.log('Client/1 text:', detailText);
    } catch {}
  }

  // =================== TEST 3: /booking/users ===================
  console.log('\n=== TEST 3: /booking/users ===');
  await page.goto(`${BASE}/users`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  try {
    const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 400));
    console.log('Page text:', bodyText);
  } catch {}

  // =================== TEST 4: /booking/notifications ===================
  console.log('\n=== TEST 4: /booking/notifications ===');
  await page.goto(`${BASE}/notifications`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  try {
    const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 400));
    console.log('Page text:', bodyText);
  } catch {}

  console.log('\n=== ALL TESTS DONE ===');
  await page.waitForTimeout(8000);
  await browser.close();
})();
