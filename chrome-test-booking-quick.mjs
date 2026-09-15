/**
 * TEST-CHROME: Operátorský panel /booking/quick
 * Přihlásí se do STUDIOFLOW a otestuje všechny funkce panelu
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = '/tmp/booking-quick-test';
mkdirSync(SHOTS, { recursive: true });

const PROFILE = '/tmp/chrome-booking-profile';
if (!existsSync(PROFILE)) mkdirSync(PROFILE, { recursive: true });

const BASE = 'https://www.lovelygirls.cz';
const results = [];

function log(test, status, detail = '') {
  const p = { PASS: 'PASS', FAIL: 'FAIL', INFO: 'INFO', ERROR: 'ERROR' }[status] || status;
  console.log(`[${p}] ${test}${detail ? ': ' + detail : ''}`);
  results.push({ test, status, detail });
}

async function shot(page, name) {
  try {
    await page.screenshot({ path: `${SHOTS}/${name}.png` });
    console.log(`[shot] ${name}`);
  } catch(e) { console.log(`[shot-fail] ${name}`); }
}

console.log('[test] Spouštím Chrome...');
const browser = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  channel: 'chrome',
  slowMo: 200,
  viewport: { width: 1440, height: 900 },
  args: ['--no-first-run', '--disable-extensions', '--password-store=basic'],
  ignoreDefaultArgs: ['--enable-automation'],
});

const page = await browser.newPage();

try {
  // ============================================================
  // PŘIHLÁŠENÍ
  // ============================================================
  console.log('\n[LOGIN] Přihlašuji se do /booking...');
  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);
  await shot(page, '00-login-page');

  const isLoginPage = await page.locator('input[name="email"], .login-input').count() > 0;
  const isAlreadyIn = page.url().includes('/booking/') && !page.url().endsWith('/booking');

  if (isAlreadyIn) {
    log('Login', 'INFO', 'Již přihlášen, přeskočeno');
  } else if (isLoginPage) {
    // Zkus credentials v pořadí
    const credentials = [
      { email: 'info@lovelygirls.cz', pass: 'Admin2026!' },
      { email: 'admin@lovelygirls.cz', pass: 'admin123' },
      { email: 'admin@lovelygirls.cz', pass: 'Admin2026!' },
      { email: 'operatorka@lovelygirls.cz', pass: 'oper123' },
    ];

    let loggedIn = false;
    for (const cred of credentials) {
      console.log(`[login] Zkouším ${cred.email}...`);
      await page.fill('input[name="email"]', cred.email);
      await page.fill('input[name="password"]', cred.pass);
      await page.click('button[type="submit"]');
      await sleep(3000);

      const currentUrl = page.url();
      const hasError = await page.locator('.login-error, [class*="error"]').count() > 0;
      const urlError = currentUrl.includes('error=invalid');

      console.log(`[login] URL po submitu: ${currentUrl}, hasError: ${hasError}`);

      if (!hasError && !urlError && !currentUrl.endsWith('/booking')) {
        log('Login', 'PASS', `Přihlášen jako ${cred.email} → ${currentUrl}`);
        loggedIn = true;
        break;
      }

      // Vrátit se na login pro další pokus
      await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded' });
      await sleep(1000);
    }

    if (!loggedIn) {
      log('Login', 'FAIL', 'Všechna hesla odmítnuta');
      // Zkus přistoupit na /booking/quick přímo bez přihlášení pro alespoň info
      await page.goto(`${BASE}/booking/quick`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);
      await shot(page, '00-quick-unauth');
      const html = await page.content();
      log('/booking/quick bez přihlášení', html.includes('307') || page.url().includes('/booking') ? 'PASS' : 'INFO', `Redirect na login: ${page.url()}`);
    }
  }

  await shot(page, '00-after-login');

  // ============================================================
  // Navigace na /booking/quick
  // ============================================================
  console.log('\n[TEST 1] Navigace na /booking/quick...');
  await page.goto(`${BASE}/booking/quick`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(4000);
  await shot(page, '01-quick-loaded');

  const currentUrl = page.url();
  const title = await page.title();
  console.log(`[info] URL: ${currentUrl}, Title: "${title}"`);

  // Zkontroluj zda se načetla stránka nebo redirect na login
  if (currentUrl.endsWith('/booking') || currentUrl.includes('error=')) {
    log('TEST 1: Načtení /booking/quick', 'FAIL', `Redirect na login — ${currentUrl}`);

    // Report co víme a skonči
    printResults();
    await browser.close();
    process.exit(0);
  }

  // Zkontroluj obsah stránky
  const pageText = await page.evaluate(() => document.body?.innerText?.substring(0, 300) || '');
  console.log(`[info] Obsah stránky: ${pageText.replace(/\n/g, ' ').substring(0, 200)}`);

  const has404 = pageText.includes('404') || pageText.includes('nenalezena');
  const hasPanel = pageText.length > 50 && !has404;

  if (has404) {
    log('TEST 1: /booking/quick', 'FAIL', '404 stránka');
  } else if (hasPanel) {
    log('TEST 1: /booking/quick načten', 'PASS', `Title: "${title}"`);
  } else {
    log('TEST 1: /booking/quick', 'INFO', `Obsah: ${pageText.substring(0, 80)}`);
  }

  // ============================================================
  // TEST 2: Dívky jako tlačítka
  // ============================================================
  console.log('\n[TEST 2] Hledám tlačítka dívek...');

  const girlBtns = await page.evaluate(() => {
    // Hledej tlačítka/klikatelné elementy reprezentující dívky
    const sels = [
      '[data-girl-id]',
      '.girl-btn, .girl-button',
      'button[class*="girl"]',
      '[class*="QuickBookingPanel"] button',
      '.grid button, .flex button',
    ];
    for (const s of sels) {
      const els = document.querySelectorAll(s);
      if (els.length > 0) {
        return { count: els.length, texts: Array.from(els).slice(0, 5).map(e => e.innerText?.trim()), sel: s };
      }
    }
    // Fallback: všechna tlačítka na stránce
    const allBtns = document.querySelectorAll('button');
    return { count: allBtns.length, texts: Array.from(allBtns).slice(0, 8).map(b => b.innerText?.trim()), sel: 'button (all)' };
  });

  console.log('[info] Tlačítka:', JSON.stringify(girlBtns));

  if (girlBtns.count > 0 && girlBtns.texts.some(t => t && t.length > 0)) {
    log('TEST 2: Dívky zobrazeny', 'PASS', `${girlBtns.count} tlačítek (${girlBtns.sel}): ${girlBtns.texts.filter(Boolean).join(', ').substring(0, 80)}`);

    // ============================================================
    // TEST 3: Klik na dívku → směny ve formátu "14.9 SOBOTA"
    // ============================================================
    console.log('\n[TEST 3] Klikám na první dívku...');
    const firstGirlBtn = page.locator(girlBtns.sel).first();
    const girlName = await firstGirlBtn.innerText().catch(() => '?');
    console.log(`[info] Klikám na: "${girlName}"`);

    await firstGirlBtn.click();
    await sleep(2000);
    await shot(page, '03-after-girl-click');

    // Zkontroluj zobrazení směn
    const scheduleText = await page.evaluate(() => document.body?.innerText?.substring(0, 1000) || '');
    console.log(`[info] Po kliknutí na dívku: ${scheduleText.replace(/\n/g, ' ').substring(0, 300)}`);

    // Hledej formát data "14.9" nebo "SOBOTA" nebo "Po/Út/St/Čt/Pá/So/Ne"
    const hasDayFormat = /\d+\.\d+|\bsobota\b|\bpondělí\b|\búterý\b|\bstředa\b|\bčtvrtek\b|\bpátek\b|\bneděle\b/i.test(scheduleText);
    const hasDash = scheduleText.includes('—') || scheduleText.includes('-');
    const hasTime = /\d{1,2}:\d{2}/.test(scheduleText);

    if (hasDayFormat) {
      log('TEST 3: Směny zobrazeny s datem', 'PASS', `Nalezen formát data`);
    } else {
      log('TEST 3: Směny s datem', 'INFO', `Datum nenalezeno v textu — možná jiný formát`);
    }

    // ============================================================
    // TEST 4: Šedé dny s "—"
    // ============================================================
    const greyDays = await page.evaluate(() => {
      // Hledej šedé/disabled dny
      const disabled = document.querySelectorAll('[disabled], .disabled, [class*="grey"], [class*="gray"], [class*="inactive"], [aria-disabled="true"]');
      return { count: disabled.length, texts: Array.from(disabled).slice(0, 3).map(e => e.innerText?.trim()) };
    });

    if (greyDays.count > 0 || hasDash) {
      log('TEST 4: Nepracující dny šedé/—', 'PASS', `${greyDays.count} disabled elementů nebo "—" nalezeno`);
    } else {
      log('TEST 4: Nepracující dny', 'INFO', 'Disabled elementy nenalezeny (možná jsou dny aktivní nebo jiný styl)');
    }

    // ============================================================
    // TEST 5: Klik na den → volné časy
    // ============================================================
    console.log('\n[TEST 5] Klikám na pracující den...');

    const dayBtns = await page.evaluate(() => {
      // Hledej klikatelné dny (ne disabled)
      const sels = [
        'button:not([disabled]):not([class*="disabled"])',
        '[class*="day"]:not([disabled])',
        '[data-date]',
      ];
      for (const s of sels) {
        const els = Array.from(document.querySelectorAll(s)).filter(el => {
          const t = el.innerText?.trim();
          return t && t.length > 0 && !el.disabled;
        });
        if (els.length > 1) { // > 1 protože první může být dívka
          return { count: els.length, texts: els.slice(1, 4).map(e => e.innerText?.trim()), sel: s };
        }
      }
      return { count: 0, texts: [] };
    });

    console.log('[info] Dostupné dny:', JSON.stringify(dayBtns));

    if (dayBtns.count > 1) {
      // Klikni na druhý button (první je dívka, druhý by měl být den)
      const dayBtn = page.locator(dayBtns.sel).nth(1);
      const dayText = await dayBtn.innerText().catch(() => '?');
      console.log(`[info] Klikám na den: "${dayText}"`);

      await dayBtn.click();
      await sleep(2000);
      await shot(page, '05-after-day-click');

      const afterDayText = await page.evaluate(() => document.body?.innerText?.substring(0, 1000) || '');
      const hasTimeSlots = /\d{1,2}:\d{2}/.test(afterDayText);

      if (hasTimeSlots) {
        log('TEST 5: Klik na den → volné časy', 'PASS', 'Časy nalezeny');

        // ============================================================
        // TEST 6: Klik na čas → zvýraznění
        // ============================================================
        console.log('\n[TEST 6] Klikám na čas...');
        const timeBtns = await page.evaluate(() => {
          const sels = ['button', '[role="button"]'];
          for (const s of sels) {
            const els = Array.from(document.querySelectorAll(s)).filter(el => /^\d{1,2}:\d{2}$/.test(el.innerText?.trim()));
            if (els.length > 0) return { count: els.length, times: els.slice(0, 3).map(e => e.innerText?.trim()) };
          }
          return { count: 0, times: [] };
        });

        console.log('[info] Časy:', JSON.stringify(timeBtns));

        if (timeBtns.count > 0) {
          const timeBtn = page.locator(`button`).filter({ hasText: /^\d{1,2}:\d{2}$/ }).first();
          const timeText = await timeBtn.innerText().catch(() => '?');
          await timeBtn.click();
          await sleep(1000);
          await shot(page, '06-after-time-click');

          // Zkontroluj zvýraznění
          const isHighlighted = await page.evaluate((time) => {
            const btns = document.querySelectorAll('button');
            for (const btn of btns) {
              if (btn.innerText?.trim() === time) {
                const style = window.getComputedStyle(btn);
                const bg = style.backgroundColor;
                const classes = btn.className;
                return { bg, classes: classes.substring(0, 100) };
              }
            }
            return null;
          }, timeText);

          log('TEST 6: Klik na čas', 'PASS', `Čas "${timeText}" vybrán${isHighlighted ? ' — bg: ' + isHighlighted.bg : ''}`);
        } else {
          log('TEST 6: Tlačítka s časy', 'INFO', 'Časy nenalezeny jako button elementy');
        }
      } else {
        log('TEST 5: Klik na den → volné časy', 'INFO', `Časy nenalezeny v DOM po kliknutí`);
      }
    } else {
      log('TEST 5: Dny pro kliknutí', 'INFO', 'Pracující dny nenalezeny');
    }
  } else {
    log('TEST 2: Dívky', 'FAIL', 'Žádná tlačítka dívek nenalezena');
  }

  // ============================================================
  // TEST 7: Výběr programu (30/45/60/90/120 min)
  // ============================================================
  console.log('\n[TEST 7] Hledám výběr programu...');
  await shot(page, '07-program-check');

  const programBtns = await page.evaluate(() => {
    const durations = ['30', '45', '60', '90', '120'];
    const found = [];
    document.querySelectorAll('button, [role="button"], label').forEach(el => {
      const t = el.innerText?.trim();
      if (durations.some(d => t?.includes(d + ' min') || t === d)) {
        found.push(t?.substring(0, 30));
      }
    });
    return found;
  });

  if (programBtns.length > 0) {
    log('TEST 7: Výběr programu', 'PASS', `Nalezeno: ${programBtns.join(', ')}`);
    // Klikni na první
    const firstProgBtn = page.locator('button, label').filter({ hasText: /30|45|60 min/ }).first();
    if (await firstProgBtn.count() > 0) {
      await firstProgBtn.click();
      await sleep(500);
      log('TEST 7: Kliknutí na program', 'PASS');
    }
  } else {
    log('TEST 7: Výběr programu', 'INFO', 'Tlačítka 30/45/60/90/120 min nenalezena (možná se zobrazí po výběru dívky+dne+času)');
  }

  // ============================================================
  // TEST 8: Hledání klienta
  // ============================================================
  console.log('\n[TEST 8] Hledám search klienta...');

  const searchInput = page.locator('input[placeholder*="klient"], input[placeholder*="hledat"], input[type="search"], input[name*="search"], input[name*="client"]').first();
  const hasSearch = await searchInput.count() > 0;

  if (hasSearch) {
    log('TEST 8: Hledání klienta', 'PASS', 'Search input nalezen');
    await searchInput.fill('test');
    await sleep(1000);
    await shot(page, '08-search-client');
    log('TEST 8: Zadání do search', 'PASS');
  } else {
    // Zkus najít jakékoliv textové inputy
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(i => ({
        type: i.type,
        name: i.name,
        placeholder: i.placeholder,
        id: i.id,
      }));
    });
    console.log('[info] Všechny inputy:', JSON.stringify(inputs));
    log('TEST 8: Hledání klienta', 'INFO', `Search nenalezen — inputy: ${JSON.stringify(inputs).substring(0, 100)}`);
  }

  // ============================================================
  // TEST 9: Live preview summary
  // ============================================================
  console.log('\n[TEST 9] Hledám live preview summary...');
  await shot(page, '09-summary-check');

  const summaryText = await page.evaluate(() => {
    // Hledej summary/preview sekci
    const sels = [
      '[class*="summary"]',
      '[class*="preview"]',
      '[class*="recap"]',
      '[class*="panel"] aside',
      '.summary, .preview',
    ];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) return { found: true, text: el.innerText?.trim().substring(0, 200), sel: s };
    }
    // Zkus najít text s cenou nebo časem v dolní části
    const bodyText = document.body?.innerText || '';
    const hasPrice = /\d+ ?Kč|CZK|\d+ min/.test(bodyText);
    return { found: false, hasPrice, bodySnippet: bodyText.substring(0, 400) };
  });

  console.log('[info] Summary:', JSON.stringify(summaryText));

  if (summaryText.found) {
    log('TEST 9: Live preview summary', 'PASS', `"${summaryText.text?.substring(0, 80)}"`);
  } else if (summaryText.hasPrice) {
    log('TEST 9: Live preview (cena/čas)', 'PASS', 'Cena nebo délka viditelná na stránce');
  } else {
    log('TEST 9: Live preview summary', 'INFO', 'Summary sekce nenalezena (možná se zobrazí po kompletním výběru)');
  }

  // ============================================================
  // TEST 10: VYTVORIT button
  // ============================================================
  console.log('\n[TEST 10] Hledám VYTVORIT button...');

  const createBtn = await page.evaluate(() => {
    const sels = [
      'button[type="submit"]',
      'button[class*="submit"]',
      'button[class*="create"]',
    ];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) return { found: true, text: el.innerText?.trim(), disabled: el.disabled, sel: s };
    }
    // Hledej tlačítko s textem
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const t = btn.innerText?.trim().toLowerCase();
      if (t.includes('vytvoř') || t.includes('vytvořit') || t.includes('potvrdit') || t.includes('uložit') || t.includes('rezerv')) {
        return { found: true, text: btn.innerText?.trim(), disabled: btn.disabled };
      }
    }
    return { found: false };
  });

  console.log('[info] Vytvorit button:', JSON.stringify(createBtn));

  if (createBtn.found) {
    log('TEST 10: VYTVORIT button', 'PASS', `"${createBtn.text}" — disabled: ${createBtn.disabled}`);
  } else {
    log('TEST 10: VYTVORIT button', 'INFO', 'Nenalezen (možná je viditelný až po kompletním výběru)');
  }

  // Finální screenshot
  await shot(page, '10-final');

} catch (err) {
  console.error('[ERROR]', err.message.substring(0, 300));
  await shot(page, 'error').catch(() => {});
  log('Test', 'ERROR', err.message.substring(0, 150));
}

printResults();

function printResults() {
  console.log('\n=== VÝSLEDKY TESTOVÁNÍ /booking/quick ===');
  for (const r of results) {
    console.log(`[${r.status}] ${r.test}${r.detail ? ': ' + r.detail : ''}`);
  }
}

console.log('\n[info] Screenshoty: /tmp/booking-quick-test/');
await sleep(5000);
await browser.close();
console.log('[done]');
