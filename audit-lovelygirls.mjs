import { chromium } from '/Users/zen/Projects/ESCX23/node_modules/playwright/index.mjs';

const BASE = 'https://www.lovelygirls.cz';
const log = [];
const errors = [];

function record(level, feature, url, note) {
  log.push({ level, feature, url, note });
  const prefix = level === 'CRITICAL' ? '[CRITICAL]' : level === 'WARN' ? '[WARN]   ' : level === 'OK' ? '[OK]     ' : level === 'PERF' ? '[PERF]   ' : '[INFO]   ';
  console.log(`${prefix} ${feature} @ ${url.replace(BASE, '')} — ${note}`);
}

async function handleAgeGate(page) {
  try {
    const selectors = [
      'button:has-text("Vstoupit")',
      'button:has-text("Souhlasím")',
      'button:has-text("Yes")',
      'button:has-text("18+")',
      '[data-testid="age-gate-accept"]',
      '.age-gate button',
      '#age-gate button',
    ];
    for (const sel of selectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(600);
        return true;
      }
    }
  } catch(e) {}
  return false;
}

const browser = await chromium.launch({ headless: false });

// ==================== DESKTOP AUDIT ====================
console.log('\n=== DESKTOP 1440x900 ===\n');
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

// 1. Homepage (root → should redirect to /cs or /en)
{
  const t0 = Date.now();
  const resp = await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await page.waitForTimeout(1500);
  const ageGated = await handleAgeGate(page);
  await page.waitForTimeout(500);

  const finalUrl = page.url();
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href || null);

  record('INFO', 'Homepage root', BASE + '/', `status=${resp?.status()}, ttfb=${ttfb}ms, finalUrl=${finalUrl.replace(BASE,'')}, title="${title}", H1="${h1}", canonical=${canonical}`);
  record(finalUrl !== BASE + '/' ? 'OK' : 'WARN', 'Root redirect', BASE + '/', finalUrl.includes('/cs') || finalUrl.includes('/en') ? `redirected to ${finalUrl.replace(BASE,'')}` : `stayed at root or unexpected: ${finalUrl.replace(BASE,'')}`);
}

// 2. Czech homepage
{
  const t0 = Date.now();
  const resp = await page.goto(BASE + '/cs', { waitUntil: 'networkidle', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  await page.waitForTimeout(500);

  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href || null);
  const hreflangs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[hreflang]')).map(l => `${l.getAttribute('hreflang')}=${l.getAttribute('href')}`);
  });
  const ogUrl = await page.evaluate(() => document.querySelector('meta[property="og:url"]')?.content || null);

  record('INFO', 'Homepage CS', BASE + '/cs', `status=${resp?.status()}, ttfb=${ttfb}ms, H1="${h1}"`);
  record(canonical ? 'OK' : 'WARN', 'Homepage CS canonical', BASE + '/cs', canonical || 'MISSING');
  record(hreflangs.length >= 4 ? 'OK' : 'WARN', 'Homepage CS hreflang', BASE + '/cs', `count=${hreflangs.length}: ${hreflangs.join(', ')}`);
  record(ogUrl ? 'OK' : 'WARN', 'Homepage CS og:url', BASE + '/cs', ogUrl || 'MISSING');
}

// 3. English homepage
{
  const resp = await page.goto(BASE + '/en', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href || null);
  record('INFO', 'Homepage EN', BASE + '/en', `status=${resp?.status()}, H1="${h1}", canonical=${canonical}`);
}

// 4. German homepage
{
  const resp = await page.goto(BASE + '/de', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  record('INFO', 'Homepage DE', BASE + '/de', `status=${resp?.status()}, H1="${h1}"`);
}

// 5. Ukrainian homepage
{
  const resp = await page.goto(BASE + '/uk', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  record('INFO', 'Homepage UK', BASE + '/uk', `status=${resp?.status()}, H1="${h1}"`);
}

// 6. Girls listing
{
  const consoleErrors = [];
  page.removeAllListeners('console');
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  const t0 = Date.now();
  const resp = await page.goto(BASE + '/cs/divky', { waitUntil: 'networkidle', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  await page.waitForTimeout(500);

  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  const cards = await page.locator('[class*="companion-card"], [class*="girl-card"], .companion-card, article').count();
  const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href || null);

  record('INFO', 'Girls listing CS', BASE + '/cs/divky', `status=${resp?.status()}, ttfb=${ttfb}ms, H1="${h1}", cards=${cards}, canonical=${canonical}`);
  record(cards > 0 ? 'OK' : 'CRITICAL', 'Girls cards count', BASE + '/cs/divky', `${cards} companion cards found`);
  if (consoleErrors.length) {
    record('WARN', 'Girls CS console errors', BASE + '/cs/divky', consoleErrors.slice(0,3).join(' | '));
    errors.push({ feature: 'Girls CS', url: BASE + '/cs/divky', errs: consoleErrors });
  }

  // Filter by status
  const statusFilter = page.locator('a[href*="status="], input[name="status"]').first();
  const hasFilter = await statusFilter.isVisible({ timeout: 2000 }).catch(() => false);
  record(hasFilter ? 'OK' : 'WARN', 'Girls status filter', BASE + '/cs/divky', hasFilter ? 'filter present' : 'no filter found');
}

// 7. Girls listing EN
{
  const resp = await page.goto(BASE + '/en/girls', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await handleAgeGate(page);
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  record('INFO', 'Girls listing EN', BASE + '/en/girls', `status=${resp?.status()}, H1="${h1}"`);
}

// 8. Profile detail (Anetta)
{
  const consoleErrors = [];
  page.removeAllListeners('console');
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  const t0 = Date.now();
  const resp = await page.goto(BASE + '/cs/profil/anetta', { waitUntil: 'networkidle', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  await page.waitForTimeout(500);

  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href || null);
  const hreflangs = await page.evaluate(() => Array.from(document.querySelectorAll('link[hreflang]')).map(l => `${l.getAttribute('hreflang')}=${l.getAttribute('href')}`));
  const schemaTypes = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => { try { return JSON.parse(s.textContent)['@type']; } catch { return 'parse error'; } });
  });
  const telLink = await page.locator('a[href^="tel:"]').first().isVisible({ timeout: 2000 }).catch(() => false);
  const waLink = await page.locator('a[href*="wa.me"], a[href*="whatsapp"]').first().isVisible({ timeout: 2000 }).catch(() => false);
  const ogImage = await page.evaluate(() => document.querySelector('meta[property="og:image"]')?.content || null);

  record(resp?.status() !== 404 ? 'OK' : 'CRITICAL', 'Profile anetta status', BASE + '/cs/profil/anetta', `HTTP ${resp?.status()}, ttfb=${ttfb}ms`);
  record(h1 ? 'OK' : 'WARN', 'Profile H1', BASE + '/cs/profil/anetta', h1 || 'MISSING');
  record(canonical ? 'OK' : 'WARN', 'Profile canonical', BASE + '/cs/profil/anetta', canonical || 'MISSING');
  record(hreflangs.length >= 4 ? 'OK' : 'WARN', 'Profile hreflang', BASE + '/cs/profil/anetta', `${hreflangs.length}: ${hreflangs.join(', ')}`);
  record(schemaTypes.length > 0 ? 'OK' : 'WARN', 'Profile structured data', BASE + '/cs/profil/anetta', `types: ${schemaTypes.join(', ')}`);
  record(telLink ? 'OK' : 'WARN', 'Profile tel link', BASE + '/cs/profil/anetta', telLink ? 'present' : 'MISSING');
  record(waLink ? 'OK' : 'WARN', 'Profile wa.me link', BASE + '/cs/profil/anetta', waLink ? 'present' : 'MISSING');
  record(ogImage ? 'OK' : 'WARN', 'Profile og:image', BASE + '/cs/profil/anetta', ogImage || 'MISSING');
  if (consoleErrors.length) {
    record('WARN', 'Profile console errors', BASE + '/cs/profil/anetta', consoleErrors.slice(0,3).join(' | '));
    errors.push({ feature: 'Profile', url: BASE + '/cs/profil/anetta', errs: consoleErrors });
  }
}

// 9. Schedule
{
  const t0 = Date.now();
  const resp = await page.goto(BASE + '/cs/rozvrh', { waitUntil: 'networkidle', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await page.waitForTimeout(1500);
  await handleAgeGate(page);

  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  const dayTabs = await page.locator('a[href*="?day="], [class*="day-tab"], [class*="schedule-day"]').count();
  const dynamicTag = await page.evaluate(() => {
    // Check for cache control or dynamic indicators
    return document.querySelector('[data-dynamic]') !== null;
  });

  record('INFO', 'Schedule CS', BASE + '/cs/rozvrh', `status=${resp?.status()}, ttfb=${ttfb}ms, H1="${h1}", dayTabs=${dayTabs}`);
  record(dayTabs > 0 ? 'OK' : 'WARN', 'Schedule day tabs', BASE + '/cs/rozvrh', `${dayTabs} day tabs`);

  // Test past day redirect
  const pastDay = '2026-01-01';
  const resp2 = await page.goto(BASE + `/cs/rozvrh?day=${pastDay}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const finalUrl2 = page.url();
  const redirectedFromPast = !finalUrl2.includes(pastDay);
  record(redirectedFromPast ? 'OK' : 'WARN', 'Schedule past day redirect', BASE + '/cs/rozvrh', redirectedFromPast ? `redirected away from ${pastDay}` : `stayed at past date URL`);
}

// 10. Pricing
{
  const resp = await page.goto(BASE + '/cs/cenik', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  const schemaTypes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => { try { return JSON.parse(s.textContent)['@type']; } catch { return null; } }).filter(Boolean);
  });
  record('INFO', 'Pricing CS', BASE + '/cs/cenik', `status=${resp?.status()}, H1="${h1}", schemas: ${schemaTypes.join(',')}`);
}

// 11. Discounts
{
  const resp = await page.goto(BASE + '/cs/slevy', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  record('INFO', 'Discounts CS', BASE + '/cs/slevy', `status=${resp?.status()}, H1="${h1}"`);
}

// 12. FAQ
{
  const resp = await page.goto(BASE + '/cs/faq', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  const details = await page.locator('details').count();
  let accordionWorks = false;
  if (details > 0) {
    try {
      await page.locator('details').first().locator('summary').click();
      await page.waitForTimeout(300);
      accordionWorks = true;
    } catch(e) {}
  }
  record('INFO', 'FAQ CS', BASE + '/cs/faq', `status=${resp?.status()}, H1="${h1}", details=${details}, accordion=${accordionWorks}`);
  record(details > 0 ? 'OK' : 'WARN', 'FAQ accordion', BASE + '/cs/faq', `${details} <details> elements, works=${accordionWorks}`);
}

// 13. About
{
  const resp = await page.goto(BASE + '/cs/o-nas', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  record('INFO', 'About CS', BASE + '/cs/o-nas', `status=${resp?.status()}, H1="${h1}"`);
}

// 14. Blog
{
  const consoleErrors = [];
  page.removeAllListeners('console');
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  const resp = await page.goto(BASE + '/cs/blog', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  const posts = await page.locator('a[href*="/blog/"]').count();
  record('INFO', 'Blog CS', BASE + '/cs/blog', `status=${resp?.status()}, H1="${h1}", links=${posts}`);

  // Click first blog post
  const firstPost = page.locator('a[href*="/blog/"]').first();
  const postHref = await firstPost.getAttribute('href').catch(() => null);
  if (postHref) {
    const r = await page.goto(BASE + (postHref.startsWith('http') ? postHref.replace(BASE,'') : postHref), { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    const postH1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
    record('INFO', 'Blog post', page.url(), `status=${r?.status()}, H1="${postH1}"`);
  }
}

// 15. Hashtag landing
{
  const resp = await page.goto(BASE + '/cs/hashtag/blondynky-praha', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  const cards = await page.locator('[class*="companion-card"], article').count();
  const details = await page.locator('details').count();
  record('INFO', 'Hashtag blondynky', BASE + '/cs/hashtag/blondynky-praha', `status=${resp?.status()}, H1="${h1}", cards=${cards}, faq_details=${details}`);
  record(resp?.status() !== 404 ? 'OK' : 'CRITICAL', 'Hashtag page loads', BASE + '/cs/hashtag/blondynky-praha', `HTTP ${resp?.status()}`);
}

// 16. 404 pages
console.log('\n--- 404 handling ---');
for (const [name, url] of [
  ['Profile 404', '/cs/profil/neexistujici-slug-xyz'],
  ['Hashtag 404', '/cs/hashtag/neexistujici-tag-xyz'],
  ['Blog 404', '/cs/blog/neexistujici-post-xyz'],
  ['Arbitrary 404', '/cs/stránka-která-neexistuje'],
]) {
  const resp = await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(800);
  const bodyText = await page.locator('body').textContent({ timeout: 2000 }).catch(() => '');
  const has404 = bodyText.toLowerCase().includes('404') || bodyText.toLowerCase().includes('nenalezen') || bodyText.toLowerCase().includes('not found');
  record(resp?.status() === 404 || has404 ? 'OK' : 'WARN', name, BASE + url, `HTTP ${resp?.status()}, has404content=${has404}`);
}

// 17. Admin auth redirect
console.log('\n--- Auth protection ---');
{
  const resp = await page.goto(BASE + '/cs/admin', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  const finalUrl = page.url();
  const redirected = finalUrl.includes('login') || finalUrl.includes('prihlaseni');
  record(redirected ? 'OK' : 'CRITICAL', 'Admin auth redirect', BASE + '/cs/admin', redirected ? `→ ${finalUrl.replace(BASE,'')}` : `NOT redirected, at ${finalUrl.replace(BASE,'')}`);
}

{
  const resp = await page.goto(BASE + '/cs/studio', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  const finalUrl = page.url();
  const redirected = finalUrl.includes('login') || finalUrl.includes('prihlaseni');
  record(redirected ? 'OK' : 'CRITICAL', 'Studio auth redirect', BASE + '/cs/studio', redirected ? `→ ${finalUrl.replace(BASE,'')}` : `NOT redirected, at ${finalUrl.replace(BASE,'')}`);
}

// 18. SEO files
console.log('\n--- SEO files ---');
{
  const resp = await page.goto(BASE + '/sitemap.xml', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1000);
  const content = await page.content();
  const hasUrls = content.includes('<loc>') && content.includes('lovelygirls.cz');
  const urlCount = (content.match(/<loc>/g) || []).length;
  record(resp?.status() === 200 && hasUrls ? 'OK' : 'CRITICAL', 'sitemap.xml', BASE + '/sitemap.xml', `status=${resp?.status()}, urls=${urlCount}, hasCorrectDomain=${hasUrls}`);
  // Check no old domain in sitemap
  const hasOldDomain = content.includes('escx23.vercel.app') || content.includes('secretstory');
  record(hasOldDomain ? 'CRITICAL' : 'OK', 'Sitemap no old domains', BASE + '/sitemap.xml', hasOldDomain ? 'OLD DOMAIN FOUND in sitemap!' : 'clean');
}

{
  const resp = await page.goto(BASE + '/robots.txt', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(500);
  const content = await page.content();
  const hasSitemap = content.includes('Sitemap:');
  const hasUserAgent = content.includes('User-agent:');
  record(resp?.status() === 200 && hasUserAgent ? 'OK' : 'WARN', 'robots.txt', BASE + '/robots.txt', `status=${resp?.status()}, hasSitemap=${hasSitemap}, hasUserAgent=${hasUserAgent}`);
}

{
  const resp = await page.goto(BASE + '/llms.txt', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(500);
  record(resp?.status() === 200 ? 'OK' : 'WARN', 'llms.txt', BASE + '/llms.txt', `status=${resp?.status()}`);
}

// 19. Admin login flow
console.log('\n--- Admin login ---');
{
  // First go to admin which should redirect to login
  await page.goto(BASE + '/cs/admin', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  const loginUrl = page.url();

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  const hasForm = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasForm) {
    await emailInput.fill('admin@lovelygirls.cz');
    await passwordInput.fill('Admin2026!');
    await page.locator('button[type="submit"], input[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    const afterLogin = page.url();
    const loginOk = afterLogin.includes('/admin') && !afterLogin.includes('login');
    record(loginOk ? 'OK' : 'CRITICAL', 'Admin login', BASE + '/cs/admin', loginOk ? `logged in, at ${afterLogin.replace(BASE,'')}` : `login failed, at ${afterLogin.replace(BASE,'')}`);

    if (loginOk) {
      // Check admin pages while logged in
      for (const [name, path] of [
        ['Admin dashboard', '/cs/admin'],
        ['Admin girls', '/cs/admin/divky'],
      ]) {
        const r = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(1000);
        const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
        record(r?.status() === 200 ? 'OK' : 'WARN', name, BASE + path, `status=${r?.status()}, H1="${h1}"`);
      }
    }
  } else {
    record('WARN', 'Admin login form', loginUrl, 'Login form not found at redirect URL');
  }
}

// 20. Studio login flow
console.log('\n--- Studio login ---');
{
  await page.goto(BASE + '/cs/studio', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const hasForm = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasForm) {
    await emailInput.fill('anetta@lovelygirls.cz');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('Anetta2026!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    const afterLogin = page.url();
    const loginOk = afterLogin.includes('/studio') && !afterLogin.includes('login');
    record(loginOk ? 'OK' : 'CRITICAL', 'Studio login (anetta)', BASE + '/cs/studio', loginOk ? `logged in, at ${afterLogin.replace(BASE,'')}` : `login failed, at ${afterLogin.replace(BASE,'')}`);
  } else {
    record('WARN', 'Studio login form', page.url(), 'No login form found');
  }
}

// 21. Performance TTFB for key pages
console.log('\n--- PERF ---');
await page.context().clearCookies();
for (const [name, url] of [
  ['Homepage root', '/'],
  ['Homepage CS', '/cs'],
  ['Girls CS', '/cs/divky'],
  ['Profile anetta', '/cs/profil/anetta'],
  ['Schedule CS', '/cs/rozvrh'],
]) {
  const t0 = Date.now();
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ttfb = Date.now() - t0;
  record('PERF', name, BASE + url, `TTFB=${ttfb}ms`);
}

// 22. Mobile check
console.log('\n=== MOBILE (390x844) ===\n');
const mobile = await browser.newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
await mobile.setExtraHTTPHeaders({
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
});

for (const [name, url] of [
  ['Mobile homepage CS', '/cs'],
  ['Mobile girls CS', '/cs/divky'],
  ['Mobile profile anetta', '/cs/profil/anetta'],
  ['Mobile schedule', '/cs/rozvrh'],
]) {
  const t0 = Date.now();
  const resp = await mobile.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ttfb = Date.now() - t0;
  await mobile.waitForTimeout(1500);
  await handleAgeGate(mobile);
  const h1 = await mobile.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null);
  record('INFO', name, BASE + url, `status=${resp?.status()}, ttfb=${ttfb}ms, H1="${h1}"`);
}

// Mobile hamburger
{
  await mobile.goto(BASE + '/cs', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mobile.waitForTimeout(1500);
  await handleAgeGate(mobile);
  const hamburger = mobile.locator('[class*="hamburger"], [class*="burger"], [aria-label*="menu"], [aria-label*="Menu"], button[class*="menu"]').first();
  const hasHamburger = await hamburger.isVisible({ timeout: 2000 }).catch(() => false);
  if (hasHamburger) {
    await hamburger.click();
    await mobile.waitForTimeout(600);
    record('OK', 'Mobile hamburger menu opens', BASE + '/cs', 'clicked successfully');
  } else {
    record('WARN', 'Mobile hamburger', BASE + '/cs', 'not found');
  }
}

await mobile.close();
await browser.close();

// ==================== FINAL REPORT ====================
console.log('\n\n==================== AUDIT RESULTS ====================\n');
const summary = { CRITICAL: [], WARN: [], OK: [], INFO: [], PERF: [] };
for (const entry of log) {
  (summary[entry.level] || summary.INFO).push(entry);
}

if (summary.CRITICAL.length > 0) {
  console.log('CRITICAL ISSUES:');
  for (const e of summary.CRITICAL) console.log(`  [CRITICAL] ${e.feature} @ ${e.url.replace(BASE,'')}: ${e.note}`);
  console.log('');
}

if (summary.WARN.length > 0) {
  console.log('WARNINGS:');
  for (const e of summary.WARN) console.log(`  [WARN] ${e.feature} @ ${e.url.replace(BASE,'')}: ${e.note}`);
  console.log('');
}

console.log('PERF:');
for (const e of summary.PERF) console.log(`  ${e.feature}: ${e.note}`);

console.log(`\n=== SUMMARY: CRITICAL=${summary.CRITICAL.length}, WARN=${summary.WARN.length}, OK=${summary.OK.length}, INFO=${summary.INFO.length} ===`);
