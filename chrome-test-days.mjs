import { chromium } from 'playwright';
import { execSync } from 'child_process';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PROFILE = '/tmp/chrome-retest2c';
const BASE = 'http://localhost:3001';
const SHOTS = '/tmp/booking-retest2';

try { execSync(`rm -rf ${PROFILE} && cp -r "$HOME/Library/Application Support/Google/Chrome/Default" ${PROFILE} 2>/dev/null || true`); } catch(e) {}

const browser = await chromium.launchPersistentContext(PROFILE, {
  headless: false, channel: 'chrome', slowMo: 150,
  viewport: { width: 1440, height: 900 },
  args: ['--no-first-run', '--password-store=basic', '--disable-extensions'],
  ignoreDefaultArgs: ['--enable-automation'],
});

const page = await browser.newPage();

await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded', timeout: 20000 });
await sleep(2000);
if (await page.locator('input[name="email"]').count() > 0) {
  await page.fill('input[name="email"]', 'info@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Test2026!');
  await page.click('button[type="submit"]');
  await sleep(3000);
}

await page.goto(`${BASE}/booking/quick`, { waitUntil: 'domcontentloaded', timeout: 20000 });
await sleep(3000);
await page.locator('button').filter({ hasText: /^Anetta$/ }).first().click();
await sleep(2500);

// Inspect day elements
const dayInfo = await page.evaluate(() => {
  const allClickable = Array.from(document.querySelectorAll('div, button, a'))
    .filter(el => {
      const t = el.innerText?.trim() || '';
      return /\d{1,2}\.\d/.test(t) && t.length < 80;
    })
    .map(el => ({
      tag: el.tagName,
      text: el.innerText?.trim().substring(0, 60),
      classes: (el.className || '').substring(0, 80),
      role: el.getAttribute('role'),
      cursor: window.getComputedStyle(el).cursor,
      onclick: !!el.onclick,
    }));
  return allClickable.slice(0, 15);
});
console.log('Day elements:', JSON.stringify(dayInfo, null, 2));

await sleep(2000);
await browser.close();
