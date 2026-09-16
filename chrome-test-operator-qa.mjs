import { chromium } from 'playwright';

const BASE = 'https://www.lovelygirls.cz/booking';
const EMAIL = 'operator@lovelygirls.cz';
const PASS = 'Operator2026!';

const results = [];

function log(test, status, detail) {
  const line = `[${status}] ${test}: ${detail}`;
  console.log(line);
  results.push({ test, status, detail });
}

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
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);

  // === TEST 1: LOGIN jako operátorka ===
  console.log('\n=== TEST 1: LOGIN jako operátorka ===');
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Login URL:', page.url());
  console.log('Title:', await page.title());

  await page.fill('#email', EMAIL);
  await page.fill('#password', PASS);

  // Server Action form submit — watch for navigation
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);

  await page.waitForTimeout(2000);
  const afterUrl = page.url();
  console.log('After login URL:', afterUrl);

  const loginError = await page.$('.login-error');
  if (loginError) {
    const errText = await loginError.textContent();
    log('LOGIN', 'FAIL', `Chyba přihlášení: ${errText}`);
    // Dump page source for debugging
    const src = await page.content();
    console.log('Page source snippet:', src.slice(0, 500));
    await page.waitForTimeout(5000);
    await browser.close();
    process.exit(1);
  }

  if (afterUrl.includes('/booking') && !afterUrl.includes('/booking/')) {
    // Still on root — login failed silently
    log('LOGIN', 'FAIL', `Stále na login stránce: ${afterUrl}`);
    await page.waitForTimeout(5000);
    await browser.close();
    process.exit(1);
  }

  log('LOGIN', 'PASS', `Přihlášeno jako operátorka, redirect na: ${afterUrl}`);
  await page.waitForTimeout(1000);

  // === TEST 2: Sidebar — správné položky pro operátorku ===
  console.log('\n=== TEST 2: Sidebar operátorky ===');

  const sidebarLinks = await page.$$eval(
    '.sf-sidebar a, nav a',
    els => els.map(el => ({ text: el.textContent.trim(), href: el.getAttribute('href') }))
  ).catch(() => []);
  console.log('Sidebar links:', JSON.stringify(sidebarLinks, null, 2));

  const sidebarText = sidebarLinks.map(l => `${l.text} ${l.href}`).join(' ').toLowerCase();

  const hasUzivatele = sidebarText.includes('uživatel') || sidebarText.includes('/users');
  const hasAudit = sidebarText.includes('audit') || sidebarText.includes('/audit');
  const hasNastaveni = sidebarText.includes('nastavení') || sidebarText.includes('/settings');
  const hasKalendar = sidebarText.includes('kalendář') || sidebarText.includes('/calendar');
  const hasKlienti = sidebarText.includes('klient') || sidebarText.includes('/clients');
  const hasRozvrhSmen = sidebarText.includes('rozvrh') || sidebarText.includes('/schedule');
  const hasDashboard = sidebarText.includes('dashboard');

  log('SIDEBAR - BEZ Uživatelé', hasUzivatele ? 'FAIL' : 'PASS',
    hasUzivatele ? 'Uživatelé JSOU vidět (nesprávně)' : 'Uživatelé nejsou vidět (správně)');
  log('SIDEBAR - BEZ Audit', hasAudit ? 'FAIL' : 'PASS',
    hasAudit ? 'Audit JE vidět (nesprávně)' : 'Audit není vidět (správně)');
  log('SIDEBAR - BEZ Nastavení', hasNastaveni ? 'FAIL' : 'PASS',
    hasNastaveni ? 'Nastavení JE vidět (nesprávně)' : 'Nastavení není vidět (správně)');
  log('SIDEBAR - Kalendář', hasKalendar ? 'PASS' : 'WARN',
    hasKalendar ? 'Kalendář je v sidebaru' : 'Kalendář NENÍ v sidebaru');
  log('SIDEBAR - Klienti', hasKlienti ? 'PASS' : 'WARN',
    hasKlienti ? 'Klienti je v sidebaru' : 'Klienti NENÍ v sidebaru');
  log('SIDEBAR - Rozvrh směn', hasRozvrhSmen ? 'PASS' : 'WARN',
    hasRozvrhSmen ? 'Rozvrh směn je v sidebaru' : 'Rozvrh směn NENÍ v sidebaru');

  // Zkontrolovat "locked" sekci pro operátorku
  const lockedEl = await page.$('.sf-nav-locked');
  if (lockedEl) {
    const lockedText = await lockedEl.textContent();
    log('SIDEBAR - locked sekce', 'PASS', `Locked text: "${lockedText.trim()}"`);
  }

  // === TEST 3: Kalendář — jména místo "GCal Import" ===
  console.log('\n=== TEST 3: Kalendář ===');
  await page.goto(`${BASE}/calendar`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log('Calendar URL:', page.url());

  if (page.url().includes('/calendar')) {
    log('KALENDÁŘ - stránka existuje', 'PASS', `URL: ${page.url()}`);

    const calendarText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 1000));
    console.log('Calendar text preview:', calendarText);

    const hasGcalImport = calendarText.toLowerCase().includes('gcal import');
    log('KALENDÁŘ - není "GCal Import"', hasGcalImport ? 'FAIL' : 'PASS',
      hasGcalImport ? '"GCal Import" text nalezen!' : 'Text "GCal Import" nenalezen (správně)');

    // Klik na první rezervaci
    const firstEvent = await page.$('[class*="event"], [class*="booking-item"], [class*="cal-event"], .fc-event, [data-booking-id]');
    if (firstEvent) {
      console.log('Klikám na první událost v kalendáři...');
      await firstEvent.click();
      await page.waitForTimeout(1500);

      const modal = await page.$('[class*="modal"], [role="dialog"], [class*="overlay"]');
      if (modal) {
        const modalText = await modal.evaluate(el => el.innerText.replace(/\s+/g, ' ').trim().slice(0, 500));
        console.log('Modal text:', modalText);
        log('KALENDÁŘ - modal', 'PASS', 'Modal se otevřel po kliknutí na rezervaci');

        const buttons = await modal.$$('button');
        const buttonTexts = await Promise.all(buttons.map(b => b.textContent().catch(() => '')));
        const btnLabels = buttonTexts.map(t => t.trim()).filter(t => t);
        console.log('Modal buttons:', btnLabels);
        log('KALENDÁŘ - modal buttons', btnLabels.length > 0 ? 'PASS' : 'WARN',
          `Buttony v modalu: ${btnLabels.join(', ') || 'žádné'}`);

        // Zkusit klik na první button
        if (buttons.length > 0) {
          const btn = buttons[0];
          const isDisabled = await btn.getAttribute('disabled');
          if (!isDisabled) {
            try {
              await btn.click({ force: false });
              await page.waitForTimeout(1000);
              log('KALENDÁŘ - button klikatelný', 'PASS', `Button "${btnLabels[0]}" je klikatelný`);
            } catch (e) {
              log('KALENDÁŘ - button klikatelný', 'FAIL', `Button není klikatelný: ${e.message}`);
            }
          } else {
            log('KALENDÁŘ - button klikatelný', 'WARN', `Button "${btnLabels[0]}" je disabled`);
          }
        }
      } else {
        log('KALENDÁŘ - modal', 'WARN', 'Modal nenalezen po kliknutí na událost');
      }
    } else {
      log('KALENDÁŘ - události', 'WARN', 'Žádné události v kalendáři nenalezeny (kalendář může být prázdný)');
    }
  } else {
    log('KALENDÁŘ', 'FAIL', `Redirect na: ${page.url()}`);
  }

  // === TEST 4: Rozvrh směn ===
  console.log('\n=== TEST 4: Rozvrh směn ===');
  await page.goto(`${BASE}/schedule`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  const scheduleUrl = page.url();
  console.log('Schedule URL:', scheduleUrl);

  if (scheduleUrl.includes('/schedule')) {
    const schedText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 400));
    console.log('Schedule text:', schedText);
    const is404 = schedText.toLowerCase().includes('404') || schedText.toLowerCase().includes('not found');
    log('ROZVRH SMĚN - stránka existuje', is404 ? 'FAIL' : 'PASS',
      is404 ? 'Stránka vrátila 404 obsah' : `Stránka funguje (${scheduleUrl})`);
  } else {
    log('ROZVRH SMĚN', 'FAIL', `Redirect mimo /schedule na: ${scheduleUrl}`);
  }

  // === TEST 5: Klienti — redesign karty ===
  console.log('\n=== TEST 5: Klienti ===');
  await page.goto(`${BASE}/clients`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  const clientsUrl = page.url();
  console.log('Clients URL:', clientsUrl);

  if (clientsUrl.includes('/clients')) {
    const clientsText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 500));
    console.log('Clients page text:', clientsText);
    log('KLIENTI - stránka existuje', 'PASS', `URL: ${clientsUrl}`);

    // Klik na prvního klienta
    const firstClient = await page.$('tbody tr:first-child td a, [class*="client-row"] a, a[href*="/clients/"]');
    if (firstClient) {
      const clientHref = await firstClient.getAttribute('href');
      console.log('Klikám na klienta:', clientHref);
      await firstClient.click();
      await page.waitForTimeout(2000);
      console.log('Client detail URL:', page.url());

      const detailText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 700));
      console.log('Client detail text:', detailText);

      // Zkontrolovat redesign — 2 sloupce (info + statistiky)
      const has2col = await exists(page, '.client-grid, [class*="two-col"], [class*="twoCol"], [class*="card-grid"], [style*="grid-template-columns"]');
      log('KLIENTI - redesign karty', has2col ? 'PASS' : 'WARN',
        has2col ? '2-column layout nalezen' : '2-column layout nenalezen — zkontroluj vizuálně');
    } else {
      log('KLIENTI - kliknutí na klienta', 'WARN', 'Žádný klient v seznamu (databáze může být prázdná)');
    }
  } else {
    log('KLIENTI', 'FAIL', `Redirect na: ${clientsUrl}`);
  }

  // === TEST 6: Favicon ===
  console.log('\n=== TEST 6: Favicon ===');
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  const faviconData = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[rel*="icon"]'));
    return links.map(l => ({ rel: l.getAttribute('rel'), href: l.getAttribute('href') }));
  });
  console.log('Favicon links:', JSON.stringify(faviconData, null, 2));

  // Zkontrolovat /favicon.ico existenci
  const faviconResponse = await page.evaluate(async () => {
    try {
      const r = await fetch('/booking/favicon.ico', { method: 'HEAD' });
      return r.status;
    } catch { return -1; }
  });
  console.log('favicon.ico status:', faviconResponse);

  const hasCustomFavicon = faviconData.length > 0 && faviconData.some(f => f.href && f.href.includes('sf-'));
  const hasFavicon = faviconData.length > 0;
  log('FAVICON - existuje', hasFavicon ? 'PASS' : 'WARN',
    hasFavicon ? `Favicon links: ${faviconData.map(f => f.href).join(', ')}` : 'Žádné favicon link tagy');
  log('FAVICON - SF logo', hasCustomFavicon ? 'PASS' : 'WARN',
    hasCustomFavicon ? 'SF favicon nalezen' : 'SF favicon nenalezen — zkontroluj vizuálně v prohlížeči');

  // === FINÁLNÍ SOUHRN ===
  console.log('\n\n=========================================');
  console.log('=== FINÁLNÍ QA VÝSLEDKY — OPERÁTORKA ===');
  console.log('=========================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;

  for (const r of results) {
    const icon = r.status === 'PASS' ? 'OK' : r.status === 'FAIL' ? 'XX' : '??';
    console.log(`[${icon}] ${r.test}: ${r.detail}`);
  }
  console.log(`\nCelkem: ${passed} PASS | ${failed} FAIL | ${warned} WARN`);

  await page.waitForTimeout(10000);
  await browser.close();
})();
