import { chromium } from '/Users/lunagroup/ESCX23/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const BASE = 'https://escx23.vercel.app';
const SCREENSHOTS = '/Users/lunagroup/ESCX23/screenshots';
const log = [];
const errors = [];

function record(level, feature, url, note) {
  log.push({ level, feature, url, note });
  console.log(`[${level}] ${feature} @ ${url} — ${note}`);
}

async function screenshot(page, name) {
  try {
    const p = path.join(SCREENSHOTS, `audit-${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    return p;
  } catch(e) { return null; }
}

async function handleAgeGate(page) {
  try {
    // Try multiple selectors for age gate
    const selectors = [
      'button:has-text("Souhlasím")',
      'button:has-text("Souhlasim")',
      'button:has-text("Yes")',
      'button:has-text("Enter")',
      'button:has-text("I am 18")',
      '[data-testid="age-gate-accept"]',
      '.age-gate button',
      '#age-gate button',
    ];
    for (const sel of selectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
        return true;
      }
    }
    // Check if any modal/overlay is present
    const overlay = page.locator('[class*="age"], [class*="gate"], [class*="disclaimer"], [class*="modal"]').first();
    if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      const btn = overlay.locator('button').first();
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
        return true;
      }
    }
  } catch(e) {}
  return false;
}

async function checkPage(page, url, name, opts = {}) {
  const consoleErrors = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', res => {
    if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`);
  });

  let status = 200;
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    status = resp?.status() || 0;
    await page.waitForTimeout(1500);
  } catch(e) {
    record('CRITICAL', name, url, `Navigation failed: ${e.message}`);
    return { status: 0, consoleErrors, networkErrors };
  }

  if (!opts.skipAgeGate) {
    await handleAgeGate(page);
    await page.waitForTimeout(300);
  }

  return { status, consoleErrors, networkErrors };
}

const browser = await chromium.launch({ headless: true });

// ==================== DESKTOP AUDIT ====================
console.log('\n=== DESKTOP 1440x900 ===\n');
const desktop = await browser.newPage();
await desktop.setViewportSize({ width: 1440, height: 900 });

// 1. Homepage EN
{
  const consoleErrors = [];
  const networkErrors = [];
  desktop.removeAllListeners('console'); desktop.removeAllListeners('response');
  desktop.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  desktop.on('response', res => { if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`); });
  
  const t0 = Date.now();
  const resp = await desktop.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await desktop.waitForTimeout(2000);
  const agegate = await handleAgeGate(desktop);
  await desktop.waitForTimeout(1000);
  
  const title = await desktop.title();
  const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  await screenshot(desktop, 'homepage-en-desktop');
  
  record('INFO', 'Homepage EN', BASE + '/', `status=${resp?.status()}, TTFB=${ttfb}ms, title="${title}", H1="${h1}", agegate=${agegate}, consoleErrors=${consoleErrors.length}, net4xx=${networkErrors.filter(n=>n.startsWith('4')).length}, net5xx=${networkErrors.filter(n=>n.startsWith('5')).length}`);
  if (consoleErrors.length) errors.push({ feature: 'Homepage EN console', url: BASE + '/', errs: consoleErrors });
  if (networkErrors.filter(n=>n.startsWith('5')).length) errors.push({ feature: 'Homepage EN 5xx', url: BASE + '/', errs: networkErrors.filter(n=>n.startsWith('5')) });
  
  // Test hero CTA
  const heroCTA = desktop.locator('a[href*="divky"], a[href*="girls"], button:has-text("Prohlédnout"), a:has-text("View"), a:has-text("Prohlédnout")').first();
  if (await heroCTA.isVisible({ timeout: 2000 }).catch(() => false)) {
    record('OK', 'Homepage hero CTA visible', BASE + '/', 'visible');
  } else {
    record('WARN', 'Homepage hero CTA', BASE + '/', 'not found/visible');
  }
  
  // Test lang switch to CS
  const langLink = desktop.locator('a[href*="/cs"], a[href="/cs"]').first();
  if (await langLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    record('OK', 'Language switch link visible', BASE + '/', 'found');
  }
}

// 2. Homepage CS
{
  const consoleErrors = [];
  const networkErrors = [];
  desktop.removeAllListeners('console'); desktop.removeAllListeners('response');
  desktop.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  desktop.on('response', res => { if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`); });
  
  const t0 = Date.now();
  const resp = await desktop.goto(BASE + '/cs', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await desktop.waitForTimeout(2000);
  await handleAgeGate(desktop);
  await desktop.waitForTimeout(800);
  
  const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  await screenshot(desktop, 'homepage-cs-desktop');
  record('INFO', 'Homepage CS', BASE + '/cs', `status=${resp?.status()}, TTFB=${ttfb}ms, H1="${h1}", consoleErrors=${consoleErrors.length}, net5xx=${networkErrors.filter(n=>n.startsWith('5')).length}`);
  if (consoleErrors.length) errors.push({ feature: 'Homepage CS console', url: BASE + '/cs', errs: consoleErrors });
}

// 3. Girls listing
{
  const consoleErrors = [];
  const networkErrors = [];
  desktop.removeAllListeners('console'); desktop.removeAllListeners('response');
  desktop.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  desktop.on('response', res => { if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`); });
  
  const t0 = Date.now();
  const resp = await desktop.goto(BASE + '/cs/divky', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await desktop.waitForTimeout(2000);
  await handleAgeGate(desktop);
  await desktop.waitForTimeout(800);
  
  const cards = await desktop.locator('[class*="card"], [class*="girl"], [class*="companion"], article, [class*="profile"]').count();
  await screenshot(desktop, 'girls-listing-cs');
  record('INFO', 'Girls listing CS', BASE + '/cs/divky', `status=${resp?.status()}, TTFB=${ttfb}ms, cards=${cards}, consoleErrors=${consoleErrors.length}`);
  if (consoleErrors.length) errors.push({ feature: 'Girls CS console', url: BASE + '/cs/divky', errs: consoleErrors });
  if (networkErrors.filter(n=>n.startsWith('5')).length) errors.push({ feature: 'Girls CS 5xx', url: BASE + '/cs/divky', errs: networkErrors.filter(n=>n.startsWith('5')) });
  
  // Test EN girls
  const resp2 = await desktop.goto(BASE + '/girls', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  record('INFO', 'Girls listing EN', BASE + '/girls', `status=${resp2?.status()}`);
}

// 4. Profile detail
{
  const consoleErrors = [];
  const networkErrors = [];
  desktop.removeAllListeners('console'); desktop.removeAllListeners('response');
  desktop.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  desktop.on('response', res => { if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`); });
  
  const t0 = Date.now();
  const resp = await desktop.goto(BASE + '/cs/profil/anetta', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await desktop.waitForTimeout(2000);
  await handleAgeGate(desktop);
  await desktop.waitForTimeout(800);
  
  const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  await screenshot(desktop, 'profile-anetta-desktop');
  record('INFO', 'Profile anetta CS', BASE + '/cs/profil/anetta', `status=${resp?.status()}, TTFB=${ttfb}ms, H1="${h1}", consoleErrors=${consoleErrors.length}`);
  if (resp?.status() === 404) record('CRITICAL', 'Profile 404', BASE + '/cs/profil/anetta', 'Profile page returns 404');
  if (consoleErrors.length) errors.push({ feature: 'Profile CS console', url: BASE + '/cs/profil/anetta', errs: consoleErrors });
  
  // Check tel/WA links
  const telLink = desktop.locator('a[href^="tel:"]').first();
  const waLink = desktop.locator('a[href*="wa.me"], a[href*="whatsapp"]').first();
  const telVisible = await telLink.isVisible({ timeout: 2000 }).catch(() => false);
  const waVisible = await waLink.isVisible({ timeout: 2000 }).catch(() => false);
  record(telVisible ? 'OK' : 'WARN', 'Profile tel: link', BASE + '/cs/profil/anetta', telVisible ? 'exists' : 'NOT FOUND');
  record(waVisible ? 'OK' : 'WARN', 'Profile wa.me link', BASE + '/cs/profil/anetta', waVisible ? 'exists' : 'NOT FOUND');
  
  // EN profile
  const resp2 = await desktop.goto(BASE + '/profile/anetta', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  record('INFO', 'Profile anetta EN', BASE + '/profile/anetta', `status=${resp2?.status()}`);
}

// 5. Hashtag landing
{
  const consoleErrors = [];
  const networkErrors = [];
  desktop.removeAllListeners('console'); desktop.removeAllListeners('response');
  desktop.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  desktop.on('response', res => { if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`); });
  
  const resp = await desktop.goto(BASE + '/cs/hashtag/blondynky-praha', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(2000);
  await handleAgeGate(desktop);
  await desktop.waitForTimeout(800);
  
  const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  await screenshot(desktop, 'hashtag-blondynky');
  
  // Test FAQ accordion
  const accordion = desktop.locator('details, [class*="accordion"], [class*="faq"]').first();
  const hasAccordion = await accordion.isVisible({ timeout: 2000 }).catch(() => false);
  if (hasAccordion) {
    try {
      const summary = accordion.locator('summary').first();
      if (await summary.isVisible({ timeout: 1000 }).catch(() => false)) {
        await summary.click();
        await desktop.waitForTimeout(500);
        record('OK', 'Hashtag FAQ accordion', BASE + '/cs/hashtag/blondynky-praha', 'opens OK');
      }
    } catch(e) {
      record('WARN', 'Hashtag FAQ accordion', BASE + '/cs/hashtag/blondynky-praha', 'click failed');
    }
  }
  
  record('INFO', 'Hashtag landing', BASE + '/cs/hashtag/blondynky-praha', `status=${resp?.status()}, H1="${h1}", accordion=${hasAccordion}, consoleErrors=${consoleErrors.length}`);
  if (consoleErrors.length) errors.push({ feature: 'Hashtag console', url: BASE + '/cs/hashtag/blondynky-praha', errs: consoleErrors });
}

// 6. Pobocka
{
  const resp = await desktop.goto(BASE + '/cs/pobocka/vinohrady', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  await screenshot(desktop, 'pobocka-vinohrady');
  record('INFO', 'Pobocka vinohrady', BASE + '/cs/pobocka/vinohrady', `status=${resp?.status()}, H1="${h1}"`);
  if (resp?.status() === 404) record('CRITICAL', 'Pobocka 404', BASE + '/cs/pobocka/vinohrady', 'Returns 404');
}

// 7. Schedule
{
  const consoleErrors = [];
  desktop.removeAllListeners('console'); desktop.removeAllListeners('response');
  desktop.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  
  const t0 = Date.now();
  const resp = await desktop.goto(BASE + '/cs/rozvrh', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  await desktop.waitForTimeout(500);
  
  const dayTabs = await desktop.locator('[class*="day"], [class*="tab"], a[href*="?day"]').count();
  await screenshot(desktop, 'rozvrh-cs');
  record('INFO', 'Schedule CS', BASE + '/cs/rozvrh', `status=${resp?.status()}, TTFB=${ttfb}ms, dayTabs=${dayTabs}, consoleErrors=${consoleErrors.length}`);
  
  // Test EN schedule
  const resp2 = await desktop.goto(BASE + '/schedule', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1000);
  record('INFO', 'Schedule EN', BASE + '/schedule', `status=${resp2?.status()}`);
}

// 8. Pricing
{
  const resp = await desktop.goto(BASE + '/cs/cenik', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  await screenshot(desktop, 'cenik-cs');
  record('INFO', 'Pricing CS', BASE + '/cs/cenik', `status=${resp?.status()}, H1="${h1}"`);
  
  const resp2 = await desktop.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1000);
  record('INFO', 'Pricing EN', BASE + '/pricing', `status=${resp2?.status()}`);
}

// 9. Discounts
{
  const resp = await desktop.goto(BASE + '/cs/slevy', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  record('INFO', 'Discounts CS', BASE + '/cs/slevy', `status=${resp?.status()}, H1="${h1}"`);
}

// 10. FAQ
{
  const resp = await desktop.goto(BASE + '/cs/faq', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  
  // Open FAQ accordion
  const details = desktop.locator('details').first();
  const hasDetails = await details.isVisible({ timeout: 2000 }).catch(() => false);
  if (hasDetails) {
    await details.locator('summary').click();
    await desktop.waitForTimeout(300);
    record('OK', 'FAQ accordion opens', BASE + '/cs/faq', 'native <details> works');
  }
  await screenshot(desktop, 'faq-cs');
  record('INFO', 'FAQ CS', BASE + '/cs/faq', `status=${resp?.status()}, H1="${h1}", hasAccordion=${hasDetails}`);
}

// 11. Blog list
{
  const consoleErrors = [];
  const networkErrors = [];
  desktop.removeAllListeners('console'); desktop.removeAllListeners('response');
  desktop.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  desktop.on('response', res => { if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`); });
  
  const resp = await desktop.goto(BASE + '/cs/blog', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  
  const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  
  // Click first blog post
  const firstPost = desktop.locator('a[href*="/blog/"]').first();
  const postHref = await firstPost.getAttribute('href').catch(() => null);
  let blogPostStatus = null;
  if (postHref) {
    const r = await desktop.goto(BASE + postHref.replace(/^\/cs/, '/cs'), { waitUntil: 'domcontentloaded', timeout: 30000 });
    blogPostStatus = r?.status();
    await desktop.waitForTimeout(1000);
    await handleAgeGate(desktop);
  }
  
  await screenshot(desktop, 'blog-cs');
  record('INFO', 'Blog CS', BASE + '/cs/blog', `status=${resp?.status()}, H1="${h1}", firstPostHref=${postHref}, postStatus=${blogPostStatus}, consoleErrors=${consoleErrors.length}`);
  if (consoleErrors.length) errors.push({ feature: 'Blog console', url: BASE + '/cs/blog', errs: consoleErrors });
}

// 12. About + Contact
{
  for (const [name, path] of [['About', '/cs/o-nas'], ['Contact', '/cs/kontakt']]) {
    const resp = await desktop.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktop.waitForTimeout(1200);
    await handleAgeGate(desktop);
    const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
    record('INFO', name, BASE + path, `status=${resp?.status()}, H1="${h1}"`);
  }
}

// 13. Membership apply form
{
  const resp = await desktop.goto(BASE + '/cs/clenstvi/zadost', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  
  const formFields = await desktop.locator('input, textarea, select').count();
  const submitBtn = await desktop.locator('button[type="submit"], input[type="submit"]').isVisible({ timeout: 2000 }).catch(() => false);
  await screenshot(desktop, 'membership-form');
  record('INFO', 'Membership form', BASE + '/cs/clenstvi/zadost', `status=${resp?.status()}, formFields=${formFields}, submitBtn=${submitBtn}`);
  if (formFields === 0) record('WARN', 'Membership form empty', BASE + '/cs/clenstvi/zadost', 'No form fields found');
}

// 14. Join form
{
  const resp = await desktop.goto(BASE + '/cs/pridat-se', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  
  const formFields = await desktop.locator('input, textarea, select').count();
  await screenshot(desktop, 'join-form');
  record('INFO', 'Join form', BASE + '/cs/pridat-se', `status=${resp?.status()}, formFields=${formFields}`);
}

// ==================== FORMS SECTION ====================
// 15. Review form
{
  const consoleErrors = [];
  desktop.removeAllListeners('console');
  desktop.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  
  const resp = await desktop.goto(BASE + '/cs/recenze/nova/anetta', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  
  const formFields = await desktop.locator('input, textarea, select').count();
  const stars = await desktop.locator('[class*="star"], input[type="radio"]').count();
  await screenshot(desktop, 'review-form');
  record('INFO', 'Review form', BASE + '/cs/recenze/nova/anetta', `status=${resp?.status()}, formFields=${formFields}, stars=${stars}, consoleErrors=${consoleErrors.length}`);
  if (resp?.status() === 404) record('CRITICAL', 'Review form 404', BASE + '/cs/recenze/nova/anetta', 'Review form returns 404');
  if (consoleErrors.length) errors.push({ feature: 'Review form console', url: BASE + '/cs/recenze/nova/anetta', errs: consoleErrors });
}

// ==================== AUTH / PROTECTED ROUTES ====================
// 16. Admin redirect
{
  const resp = await desktop.goto(BASE + '/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1000);
  const finalUrl = desktop.url();
  record('INFO', 'Admin route', BASE + '/admin', `status=${resp?.status()}, finalUrl=${finalUrl}`);
  const isRedirected = finalUrl.includes('login') || finalUrl.includes('admin/login');
  record(isRedirected ? 'OK' : 'CRITICAL', 'Admin auth redirect', BASE + '/admin', isRedirected ? `redirected to ${finalUrl}` : 'NOT redirected — security issue!');
}

{
  const resp = await desktop.goto(BASE + '/cs/admin/divky', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1000);
  const finalUrl = desktop.url();
  const isRedirected = finalUrl.includes('login');
  record(isRedirected ? 'OK' : 'CRITICAL', 'CS Admin divky auth', BASE + '/cs/admin/divky', isRedirected ? `redirected to ${finalUrl}` : `NOT redirected, finalUrl=${finalUrl}`);
}

// 17. Studio auth
{
  const resp = await desktop.goto(BASE + '/studio', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1000);
  const finalUrl = desktop.url();
  const isRedirected = finalUrl.includes('login');
  record(isRedirected ? 'OK' : 'CRITICAL', 'Studio auth redirect', BASE + '/studio', isRedirected ? `redirected to ${finalUrl}` : `NOT redirected, finalUrl=${finalUrl}`);

  const resp2 = await desktop.goto(BASE + '/studio/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1000);
  await handleAgeGate(desktop);
  const h1 = await desktop.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  await screenshot(desktop, 'studio-login');
  record('INFO', 'Studio login', BASE + '/studio/login', `status=${resp2?.status()}, H1="${h1}"`);
}

// ==================== ERROR HANDLING / 404s ====================
{
  for (const [name, url] of [
    ['Profile 404', '/cs/profil/neexistujici-slug'],
    ['Hashtag 404', '/cs/hashtag/neexistujici-tag'],
    ['Blog 404', '/cs/blog/neexistujici-post'],
    ['Pobocka 404', '/cs/pobocka/neexistujici'],
  ]) {
    const resp = await desktop.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktop.waitForTimeout(1000);
    const pageStatus = resp?.status();
    const bodyText = await desktop.locator('body').textContent({ timeout: 2000 }).catch(() => '');
    const has404content = bodyText.toLowerCase().includes('404') || bodyText.toLowerCase().includes('nenalezen') || bodyText.toLowerCase().includes('not found');
    record(pageStatus === 404 || has404content ? 'OK' : 'WARN', name, BASE + url, `HTTP ${pageStatus}, has404content=${has404content}`);
  }
}

// ==================== i18n ====================
{
  // Language switch on homepage
  await desktop.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1500);
  await handleAgeGate(desktop);
  
  // Try to switch to CS
  const csLink = desktop.locator('a[href="/cs"]').first();
  if (await csLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await csLink.click();
    await desktop.waitForTimeout(1500);
    const finalUrl = desktop.url();
    record(finalUrl.includes('/cs') ? 'OK' : 'WARN', 'Lang switch EN→CS', BASE + '/', `finalUrl=${finalUrl}`);
  } else {
    // Check for language dropdown
    const langButton = desktop.locator('[class*="lang"], [data-lang], button:has-text("EN"), button:has-text("CS")').first();
    if (await langButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      record('INFO', 'Lang switch button found', BASE + '/', 'need to click dropdown');
    } else {
      record('WARN', 'Lang switch', BASE + '/', 'No visible language switcher link found');
    }
  }
  
  // Check hreflang tags
  await desktop.goto(BASE + '/cs', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktop.waitForTimeout(1000);
  const hreflangs = await desktop.evaluate(() => {
    const links = document.querySelectorAll('link[hreflang]');
    return Array.from(links).map(l => `${l.getAttribute('hreflang')}=${l.getAttribute('href')}`);
  });
  record(hreflangs.length > 0 ? 'OK' : 'WARN', 'Hreflang tags', BASE + '/cs', `count=${hreflangs.length}, tags=${JSON.stringify(hreflangs)}`);
}

// ==================== MOBILE AUDIT (iPhone 13 390x844) ====================
console.log('\n=== MOBILE iPhone 13 (390x844) ===\n');
const mobile = await browser.newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
await mobile.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });

// Mobile Homepage
{
  const consoleErrors = [];
  const networkErrors = [];
  mobile.removeAllListeners('console'); mobile.removeAllListeners('response');
  mobile.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  mobile.on('response', res => { if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`); });
  
  await mobile.goto(BASE + '/cs', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mobile.waitForTimeout(2000);
  await handleAgeGate(mobile);
  await mobile.waitForTimeout(800);
  await screenshot(mobile, 'mobile-homepage-cs');
  record('INFO', 'Mobile Homepage CS', BASE + '/cs', `consoleErrors=${consoleErrors.length}`);
  
  // Hamburger menu
  const hamburger = mobile.locator('[class*="hamburger"], [class*="burger"], button[aria-label*="menu"], button[aria-label*="Menu"], [class*="menu-toggle"]').first();
  const hasHamburger = await hamburger.isVisible({ timeout: 2000 }).catch(() => false);
  if (hasHamburger) {
    await hamburger.click();
    await mobile.waitForTimeout(500);
    const menuOpen = await mobile.locator('nav, [class*="mobile-menu"], [class*="nav-open"]').isVisible({ timeout: 1000 }).catch(() => false);
    await screenshot(mobile, 'mobile-hamburger-open');
    record(menuOpen ? 'OK' : 'WARN', 'Mobile hamburger menu', BASE + '/cs', menuOpen ? 'opens OK' : 'clicked but no menu visible');
    // Close it
    await hamburger.click().catch(() => {});
    await mobile.waitForTimeout(300);
  } else {
    record('WARN', 'Mobile hamburger', BASE + '/cs', 'No hamburger button found');
  }
}

// Mobile Profile
{
  await mobile.goto(BASE + '/cs/profil/anetta', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mobile.waitForTimeout(2000);
  await handleAgeGate(mobile);
  await mobile.waitForTimeout(800);
  
  await screenshot(mobile, 'mobile-profile-anetta');
  
  // Check mobile bottom bar (4 icons)
  const bottomBar = mobile.locator('[class*="bottom"], [class*="sticky"], [class*="fixed"]').last();
  const hasBottomBar = await bottomBar.isVisible({ timeout: 2000 }).catch(() => false);
  
  // Check CTA links on mobile
  const telLink = mobile.locator('a[href^="tel:"]').first();
  const waLink = mobile.locator('a[href*="wa.me"], a[href*="whatsapp"]').first();
  const telVisible = await telLink.isVisible({ timeout: 2000 }).catch(() => false);
  const waVisible = await waLink.isVisible({ timeout: 2000 }).catch(() => false);
  
  record('INFO', 'Mobile Profile', BASE + '/cs/profil/anetta', `bottomBar=${hasBottomBar}, tel=${telVisible}, wa=${waVisible}`);
  
  // IG header check (avatar, info, stats)
  const igHeader = mobile.locator('[class*="ig"], [class*="instagram"], [class*="profile-header"]').first();
  const hasIG = await igHeader.isVisible({ timeout: 2000 }).catch(() => false);
  record(hasIG ? 'OK' : 'WARN', 'Mobile IG profile header', BASE + '/cs/profil/anetta', hasIG ? 'visible' : 'not found');
}

// Mobile Girls
{
  await mobile.goto(BASE + '/cs/divky', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mobile.waitForTimeout(1500);
  await handleAgeGate(mobile);
  await screenshot(mobile, 'mobile-girls');
  const cards = await mobile.locator('[class*="card"], [class*="companion"], article').count();
  record('INFO', 'Mobile Girls', BASE + '/cs/divky', `cards=${cards}`);
}

// Mobile Review form
{
  await mobile.goto(BASE + '/cs/recenze/nova/anetta', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mobile.waitForTimeout(1500);
  await handleAgeGate(mobile);
  const fields = await mobile.locator('input, textarea, select').count();
  await screenshot(mobile, 'mobile-review-form');
  record('INFO', 'Mobile Review form', BASE + '/cs/recenze/nova/anetta', `formFields=${fields}`);
}

// ==================== PERFORMANCE ====================
// Quick TTFB test for key pages
for (const [name, url] of [
  ['Homepage EN', '/'],
  ['Girls CS', '/cs/divky'],
  ['Profile anetta CS', '/cs/profil/anetta'],
]) {
  const t0 = Date.now();
  await desktop.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ttfb = Date.now() - t0;
  record('PERF', name, BASE + url, `TTFB=${ttfb}ms`);
}

await browser.close();

// ==================== FINAL REPORT ====================
console.log('\n\n==================== FINAL LOG ====================');
const summary = { CRITICAL: [], WARN: [], OK: [], INFO: [], PERF: [] };
for (const entry of log) {
  (summary[entry.level] || summary.INFO).push(entry);
  if (entry.level === 'CRITICAL') {
    console.log(`[CRITICAL] ${entry.feature} @ ${entry.url}: ${entry.note}`);
  }
}

console.log('\n=== Console Errors Found ===');
for (const e of errors) {
  console.log(`[${e.feature}] @ ${e.url}:`);
  for (const err of e.errs.slice(0, 3)) console.log(`  - ${err}`);
}

fs.writeFileSync('/Users/lunagroup/ESCX23/audit_results.json', JSON.stringify({ log, errors, summary: { criticalCount: summary.CRITICAL.length, warnCount: summary.WARN.length, okCount: summary.OK.length }}, null, 2));

console.log('\n=== SUMMARY ===');
console.log('CRITICAL:', summary.CRITICAL.length);
console.log('WARN:', summary.WARN.length);
console.log('OK:', summary.OK.length);
console.log('INFO:', summary.INFO.length);

