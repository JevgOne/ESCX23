import { chromium } from 'playwright';

const BASE = 'https://www.lovelygirls.cz';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const results = [];

function log(msg) { console.log(msg); }

async function testPage(page, url, label, checks) {
  log(`\n--- ${label} ---`);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  let status = null;
  let loadOk = false;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    status = response?.status();
    loadOk = status >= 200 && status < 400;
    await sleep(2000);
  } catch (e) {
    log(`  LOAD ERROR: ${e.message}`);
    results.push({ label, url, status: 'ERROR', loadOk: false, checks: {}, consoleErrors: [e.message] });
    return;
  }

  log(`  HTTP ${status} — ${loadOk ? 'OK' : 'FAIL'}`);

  const checkResults = {};
  for (const [checkName, selector] of Object.entries(checks)) {
    try {
      const count = await page.locator(selector).count();
      const found = count > 0;
      checkResults[checkName] = found;
      log(`  ${found ? 'OK' : 'FAIL'} ${checkName} (selector: ${selector}, count: ${count})`);
    } catch (e) {
      checkResults[checkName] = false;
      log(`  FAIL ${checkName}: ${e.message}`);
    }
  }

  const uniqueErrors = [...new Set(consoleErrors)];
  if (uniqueErrors.length > 0) {
    log(`  Console errors (${uniqueErrors.length}):`);
    uniqueErrors.slice(0, 5).forEach(e => log(`    - ${e.slice(0, 120)}`));
  }

  results.push({ label, url, status, loadOk, checks: checkResults, consoleErrors: uniqueErrors });
}

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });

  // --- Desktop viewport ---
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();

  // 1. Homepage /cs
  await testPage(page, `${BASE}/cs`, 'Homepage /cs', {
    'hero section': 'section, .hero, [class*="hero"], h1',
    'girls grid': '[class*="girl"], [class*="card"], [class*="grid"]',
    'FeaturedNew/Kim NOVÁ': 'text=/NOVÁ|NEW|Kim/i',
    'navigation': 'nav, header',
    'footer': 'footer',
  });

  // 2. Homepage /en
  await testPage(page, `${BASE}/en`, 'Homepage /en', {
    'English content': 'text=/girls|escort|agency|Prague/i',
    'navigation': 'nav, header',
    'hero/main content': 'h1, main',
  });

  // 3. Homepage /de
  await testPage(page, `${BASE}/de`, 'Homepage /de', {
    'German content': 'text=/Mädchen|Escort|Agentur|Prag/i',
    'navigation': 'nav, header',
    'main content': 'h1, main',
  });

  // 4. Homepage /uk
  await testPage(page, `${BASE}/uk`, 'Homepage /uk', {
    'Ukrainian content': 'text=/дівчат|ескорт|агентство|Прага/i',
    'navigation': 'nav, header',
    'main content': 'h1, main',
  });

  // 5. Girls listing
  await testPage(page, `${BASE}/cs/divky`, 'Girls listing /cs/divky', {
    'girl cards': '[class*="girl"], [class*="card"], [class*="profile"]',
    'filter form': 'form, [class*="filter"]',
    'main content': 'main, h1',
  });

  // 6. Profile Anetta
  await testPage(page, `${BASE}/cs/profil/anetta`, 'Profile /cs/profil/anetta', {
    'photos/gallery': 'img, [class*="photo"], [class*="gallery"]',
    'info card': '[class*="info"], [class*="card"], [class*="profile"]',
    'services section': 'text=/služby|services|služba/i',
    'schedule section': 'text=/rozvrh|schedule|kdy/i',
  });

  // 7. Profile Kim — NOVÁ badge
  await testPage(page, `${BASE}/cs/profil/kim`, 'Profile /cs/profil/kim', {
    'photos/gallery': 'img, [class*="photo"], [class*="gallery"]',
    'NOVÁ badge': 'text=/NOVÁ|NEW/i',
    'main content': 'main, h1',
  });

  // 8. Schedule
  await testPage(page, `${BASE}/cs/rozvrh`, 'Schedule /cs/rozvrh', {
    'day tabs': '[class*="tab"], [class*="day"], a[href*="day="]',
    'girls shown': '[class*="girl"], [class*="card"]',
    'main content': 'main, h1',
  });

  // 9. Pricing
  await testPage(page, `${BASE}/cs/cenik`, 'Pricing /cs/cenik', {
    'pricing plans': '[class*="plan"], [class*="price"], [class*="cenik"]',
    'price amounts': 'text=/Kč|CZK|EUR/i',
    'main content': 'main, h1',
  });

  // 10. Discounts
  await testPage(page, `${BASE}/cs/slevy`, 'Discounts /cs/slevy', {
    'main content': 'main, h1',
    'discount content': 'text=/slev|discount|kod/i',
  });

  // 11. FAQ
  await testPage(page, `${BASE}/cs/faq`, 'FAQ /cs/faq', {
    'accordion/details': 'details, summary, [class*="faq"], [class*="accordion"]',
    'main content': 'main, h1',
  });

  // Click a FAQ accordion item
  log('\n--- FAQ Accordion Click Test ---');
  try {
    await page.goto(`${BASE}/cs/faq`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(1500);
    const detailsCount = await page.locator('details').count();
    log(`  Found ${detailsCount} <details> elements`);
    if (detailsCount > 0) {
      const firstSummary = page.locator('details summary').first();
      await firstSummary.click();
      await sleep(800);
      const isOpen = await page.locator('details[open]').count();
      log(`  After click: ${isOpen} open <details> — ${isOpen > 0 ? 'OK accordion works' : 'FAIL accordion not opening'}`);
      results.push({ label: 'FAQ accordion click', url: `${BASE}/cs/faq`, status: 200, loadOk: true, checks: { 'accordion opens': isOpen > 0 }, consoleErrors: [] });
    }
  } catch (e) {
    log(`  FAQ accordion error: ${e.message}`);
  }

  // 12. About
  await testPage(page, `${BASE}/cs/o-nas`, 'About /cs/o-nas', {
    'main content': 'main, h1',
    'about text': 'text=/Praha|Praze|agentury|agency/i',
  });

  // 13. Blog
  await testPage(page, `${BASE}/cs/blog`, 'Blog /cs/blog', {
    'main content': 'main, h1',
    'blog posts': '[class*="post"], [class*="article"], article, [class*="blog"]',
  });

  // 14. Reviews
  await testPage(page, `${BASE}/cs/recenze`, 'Reviews /cs/recenze', {
    'main content': 'main, h1',
    'review items': '[class*="review"], [class*="recenze"], [class*="testimonial"]',
  });

  // --- Mobile viewport ---
  log('\n\n=== MOBILE TESTS (390px) ===');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mobile.newPage();

  await testPage(mpage, `${BASE}/cs`, 'Mobile Homepage /cs', {
    'hamburger menu': '[class*="hamburger"], [class*="burger"], [class*="menu-toggle"], button[aria-label*="menu" i]',
    'main content': 'main, h1',
  });

  // Click hamburger
  log('\n--- Mobile Hamburger Click Test ---');
  try {
    await mpage.goto(`${BASE}/cs`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(1500);
    // Try common hamburger selectors
    const hamburgerSelectors = [
      '[class*="hamburger"]',
      '[class*="burger"]',
      '[class*="menu-toggle"]',
      'button[aria-label*="menu" i]',
      '[class*="nav-toggle"]',
      'button[class*="nav"]',
    ];
    let clicked = false;
    for (const sel of hamburgerSelectors) {
      const count = await mpage.locator(sel).count();
      if (count > 0) {
        log(`  Found hamburger with: ${sel}`);
        await mpage.locator(sel).first().click();
        await sleep(1000);
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      log('  No hamburger found with known selectors — taking screenshot to diagnose');
    }
    const navVisible = await mpage.locator('nav a, [class*="nav"] a').count();
    log(`  Nav links visible after hamburger click: ${navVisible}`);
    await mpage.screenshot({ path: '/tmp/mobile-nav.png' });
    log('  Screenshot: /tmp/mobile-nav.png');
    results.push({ label: 'Mobile hamburger', url: `${BASE}/cs`, status: 200, loadOk: true, checks: { 'hamburger clicked': clicked, 'nav links visible': navVisible > 0 }, consoleErrors: [] });
  } catch (e) {
    log(`  Mobile hamburger error: ${e.message}`);
  }

  // Language switcher
  log('\n--- Language Switcher Test ---');
  try {
    await page.goto(`${BASE}/cs`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(1500);
    const langSwitchers = await page.locator('a[href*="/en"], a[href*="/de"], a[href*="/uk"], [class*="lang"] a').count();
    log(`  Language switcher links found: ${langSwitchers}`);
    if (langSwitchers > 0) {
      const enLink = page.locator('a[href*="/en"]').first();
      const href = await enLink.getAttribute('href');
      log(`  EN link href: ${href}`);
      await enLink.click();
      await sleep(2000);
      const newUrl = page.url();
      log(`  After click URL: ${newUrl}`);
      const switchedToEn = newUrl.includes('/en');
      log(`  Language switch to EN: ${switchedToEn ? 'OK' : 'FAIL'}`);
      results.push({ label: 'Language switcher', url: `${BASE}/cs`, status: 200, loadOk: true, checks: { 'EN switch works': switchedToEn }, consoleErrors: [] });
    } else {
      log('  No language switcher links found');
      results.push({ label: 'Language switcher', url: `${BASE}/cs`, status: 200, loadOk: true, checks: { 'lang links found': false }, consoleErrors: [] });
    }
  } catch (e) {
    log(`  Language switcher error: ${e.message}`);
  }

  // Girls listing filter test
  log('\n--- Girls Filter URL Params Test ---');
  try {
    await page.goto(`${BASE}/cs/divky?status=available`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(2000);
    const status = await page.evaluate(() => document.readyState);
    const girlCards = await page.locator('[class*="girl"], [class*="card"], [class*="profile"]').count();
    log(`  /cs/divky?status=available — readyState: ${status}, cards: ${girlCards}`);
    results.push({ label: 'Girls filter URL params', url: `${BASE}/cs/divky?status=available`, status: 200, loadOk: true, checks: { 'page loads with filter': girlCards > 0 }, consoleErrors: [] });
  } catch (e) {
    log(`  Girls filter error: ${e.message}`);
  }

  // === SUMMARY ===
  log('\n\n========== AUDIT SUMMARY ==========');
  let passed = 0, failed = 0, total = 0;
  for (const r of results) {
    const pageOk = r.loadOk;
    const allChecksOk = Object.values(r.checks).every(v => v);
    const hasErrors = r.consoleErrors.length > 0;
    const overall = pageOk && allChecksOk;
    if (overall) passed++; else failed++;
    total++;
    log(`${overall ? 'OK  ' : 'FAIL'} [${r.status || 'ERR'}] ${r.label}`);
    const failedChecks = Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k);
    if (failedChecks.length > 0) log(`       Failed checks: ${failedChecks.join(', ')}`);
    if (hasErrors) log(`       Console errors: ${r.consoleErrors.length}`);
  }
  log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`);

  await sleep(5000);
  await browser.close();
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
