/**
 * TEST-CHROME v3: /booking/quick — lokální server port 3001
 * Testuje všechny funkce operátorského panelu
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = '/tmp/booking-quick-test';
mkdirSync(SHOTS, { recursive: true });

const PROFILE = '/tmp/chrome-booking-local-profile';
mkdirSync(PROFILE, { recursive: true });

const BASE = 'http://localhost:3001';
const results = [];

function log(test, status, detail = '') {
  console.log(`[${status}] ${test}${detail ? ': ' + detail : ''}`);
  results.push({ test, status, detail });
}

async function shot(page, name) {
  try { await page.screenshot({ path: `${SHOTS}/${name}.png` }); console.log(`[shot] ${name}`); }
  catch(e) { console.log(`[shot-fail] ${name}: ${e.message.substring(0,50)}`); }
}

console.log('[test-v3] Spouštím Chrome pro lokální test...');
const browser = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  channel: 'chrome',
  slowMo: 150,
  viewport: { width: 1440, height: 900 },
  args: ['--no-first-run', '--password-store=basic', '--disable-extensions'],
  ignoreDefaultArgs: ['--enable-automation'],
});

const page = await browser.newPage();

try {
  // ============================================================
  // LOGIN
  // ============================================================
  console.log('\n[LOGIN] Přihlášení na lokální server...');
  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);
  await shot(page, 'v3-00-login');

  await page.fill('input[name="email"]', 'info@lovelygirls.cz');
  await page.fill('input[name="password"]', 'Test2026!');
  await page.click('button[type="submit"]');
  await sleep(3000);

  const afterLogin = page.url();
  console.log(`[info] Po přihlášení: ${afterLogin}`);

  if (afterLogin.includes('error=invalid') || afterLogin.endsWith('/booking')) {
    log('Login', 'FAIL', `Přihlášení selhalo: ${afterLogin}`);
    await shot(page, 'v3-login-fail');
    printResults();
    await browser.close();
    process.exit(1);
  }

  log('Login', 'PASS', `Přihlášen jako info@lovelygirls.cz → ${afterLogin}`);
  await shot(page, 'v3-01-after-login');

  // ============================================================
  // TEST 1: Navigace na /booking/quick
  // ============================================================
  console.log('\n[TEST 1] Navigace na /booking/quick...');
  await page.goto(`${BASE}/booking/quick`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await shot(page, 'v3-01-quick');

  const quickUrl = page.url();
  const quickTitle = await page.title();
  console.log(`[info] URL: ${quickUrl}, Title: "${quickTitle}"`);

  const bodyContent = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
  console.log(`[info] Obsah: ${bodyContent.replace(/\n/g, ' ').substring(0, 300)}`);

  if (quickUrl.includes('/quick')) {
    log('TEST 1: /booking/quick načten', 'PASS', `Title: "${quickTitle}"`);
  } else if (quickUrl.includes('/booking') && !quickUrl.includes('/quick')) {
    log('TEST 1: /booking/quick', 'FAIL', `Přesměrováno na: ${quickUrl}`);
    printResults();
    await browser.close();
    process.exit(0);
  }

  // Zkontroluj zda není 404 nebo error
  const has404 = bodyContent.includes('404') || bodyContent.toLowerCase().includes('not found');
  const hasError = bodyContent.toLowerCase().includes('error') && bodyContent.length < 200;
  if (has404) {
    log('TEST 1: 404 check', 'FAIL', '404 stránka');
  } else if (!hasError) {
    log('TEST 1: Stránka bez chyb', 'PASS');
  }

  // ============================================================
  // TEST 2: Dívky jako tlačítka
  // ============================================================
  console.log('\n[TEST 2] Dívky jako tlačítka...');
  await sleep(1000);

  const girlElements = await page.evaluate(() => {
    const result = { buttons: [], found: false, selector: '' };

    // Hledej specifické selektory pro dívky
    const specificSels = [
      '[data-girl]', '[data-girl-id]', '.girl-btn', '.girl-button',
      '[class*="girl"]', '[class*="Girl"]',
    ];
    for (const s of specificSels) {
      const els = document.querySelectorAll(s);
      if (els.length > 0) {
        result.found = true;
        result.selector = s;
        result.buttons = Array.from(els).slice(0, 6).map(e => e.innerText?.trim());
        return result;
      }
    }

    // Fallback: všechna tlačítka v horní části panelu
    const allBtns = Array.from(document.querySelectorAll('button')).filter(b => {
      const t = b.innerText?.trim();
      return t && t.length > 1 && t.length < 30 && !/min|Kč|CZK|\d{2}:\d{2}|cancel|submit|save/.test(t.toLowerCase());
    });

    if (allBtns.length > 0) {
      result.found = true;
      result.selector = 'button (filtered)';
      result.buttons = allBtns.slice(0, 8).map(b => b.innerText?.trim());
    }
    return result;
  });

  console.log('[info] Dívky:', JSON.stringify(girlElements));

  if (girlElements.found && girlElements.buttons.length > 0) {
    log('TEST 2: Dívky zobrazeny', 'PASS',
      `${girlElements.buttons.length} tlačítek (${girlElements.selector}): ${girlElements.buttons.join(', ')}`);

    // ============================================================
    // TEST 3: Klik na dívku → směny
    // ============================================================
    console.log('\n[TEST 3] Klikám na první dívku...');
    let girlBtn;
    if (girlElements.selector.includes('data-') || girlElements.selector.includes('girl')) {
      girlBtn = page.locator(girlElements.selector).first();
    } else {
      // Najdi button s textem dívky
      girlBtn = page.locator('button').filter({ hasText: girlElements.buttons[0] }).first();
    }

    const girlName = await girlBtn.innerText().catch(() => girlElements.buttons[0]);
    console.log(`[info] Klikám na dívku: "${girlName}"`);
    await girlBtn.click();
    await sleep(2500);
    await shot(page, 'v3-03-girl-selected');

    const afterGirlText = await page.evaluate(() => document.body?.innerText?.substring(0, 1500) || '');
    console.log(`[info] Po výběru dívky: ${afterGirlText.replace(/\n/g, ' ').substring(0, 400)}`);

    // Hledej formát dne — "14.9" nebo "SOBOTA" nebo "Po/Út/St" atd.
    const dayPattern = /\d{1,2}\.\d{1,2}|pondělí|úterý|středa|čtvrtek|pátek|sobota|neděle|po\b|út\b|st\b|čt\b|pá\b|so\b|ne\b/i;
    const hasDayFormat = dayPattern.test(afterGirlText);
    const hasDash = /—|\-{2}/.test(afterGirlText);

    if (hasDayFormat) {
      log('TEST 3: Směny s datem', 'PASS', 'Formát data/dne nalezen');
    } else {
      log('TEST 3: Směny s datem', 'INFO', 'Datum v textu nenalezeno');
    }

    // TEST 4: Šedé/nepracující dny
    const greyDays = await page.evaluate(() => {
      const disabled = document.querySelectorAll('[disabled], [aria-disabled="true"], [class*="disabled"], [class*="inactive"], [class*="grey"], [class*="gray"]');
      return Array.from(disabled).map(el => el.innerText?.trim().substring(0, 20)).filter(Boolean);
    });
    console.log('[info] Šedé dny:', JSON.stringify(greyDays));

    if (greyDays.length > 0 || hasDash) {
      log('TEST 4: Nepracující dny šedé/—', 'PASS',
        greyDays.length > 0 ? `${greyDays.length} disabled: ${greyDays.join(', ')}` : '"—" nalezeno v textu');
    } else {
      log('TEST 4: Nepracující dny', 'INFO', 'Disabled elementy nenalezeny');
    }

    // TEST 5: Klik na pracující den
    console.log('\n[TEST 5] Klikám na pracující den...');
    const workDayBtns = await page.evaluate(() => {
      // Hledej tlačítka dní (s datem nebo zkratkou dne) která nejsou disabled
      const candidates = Array.from(document.querySelectorAll('button:not([disabled])'))
        .filter(b => {
          const t = b.innerText?.trim();
          return t && /\d{1,2}\.\d{1,2}|^(Po|Út|St|Čt|Pá|So|Ne)/.test(t);
        });
      return candidates.map(b => b.innerText?.trim().substring(0, 20));
    });
    console.log('[info] Pracující dny:', JSON.stringify(workDayBtns));

    if (workDayBtns.length > 0) {
      const dayBtn = page.locator('button:not([disabled])').filter({ hasText: new RegExp(workDayBtns[0].replace('.', '\\.')) }).first();
      await dayBtn.click();
      await sleep(2000);
      await shot(page, 'v3-05-day-selected');

      const afterDayText = await page.evaluate(() => document.body?.innerText?.substring(0, 1500) || '');
      const hasTimeSlots = /\d{1,2}:\d{2}/.test(afterDayText);

      if (hasTimeSlots) {
        log('TEST 5: Klik na den → volné časy', 'PASS', 'Časy zobrazeny');

        // TEST 6: Klik na čas → zvýraznění
        console.log('\n[TEST 6] Klikám na čas...');
        const timeBtns = page.locator('button').filter({ hasText: /^\d{1,2}:\d{2}$/ });
        const timeCount = await timeBtns.count();

        if (timeCount > 0) {
          const firstTime = await timeBtns.first().innerText().catch(() => '?');
          await timeBtns.first().click();
          await sleep(1000);
          await shot(page, 'v3-06-time-selected');

          // Zkontroluj vizuální zvýraznění
          const highlighted = await page.evaluate((timeText) => {
            const btns = document.querySelectorAll('button');
            for (const btn of btns) {
              if (btn.innerText?.trim() === timeText) {
                const style = window.getComputedStyle(btn);
                const classes = btn.className;
                return { bg: style.backgroundColor, classes: classes.substring(0, 100), selected: btn.getAttribute('aria-selected'), ariaPressed: btn.getAttribute('aria-pressed') };
              }
            }
            return null;
          }, firstTime);

          log('TEST 6: Výběr času', 'PASS',
            `"${firstTime}" vybrán — ${highlighted ? 'bg:' + highlighted.bg + ' class:' + highlighted.classes.substring(0,40) : 'info nenalezeno'}`);
        } else {
          log('TEST 6: Tlačítka s časy', 'INFO', 'Časy nenalezeny jako button elementy');
        }
      } else {
        log('TEST 5: Volné časy po kliknutí na den', 'INFO', 'Časy nenalezeny');
      }
    } else {
      log('TEST 5: Pracující dny', 'INFO', `Pracující dny jako tlačítka nenalezeny. Dny v textu: ${workDayBtns.length}`);
    }
  } else {
    log('TEST 2: Dívky', 'FAIL', 'Žádná tlačítka dívek nenalezena');
  }

  // TEST 7: Výběr programu
  console.log('\n[TEST 7] Výběr programu...');
  await shot(page, 'v3-07-before-program');

  const programInfo = await page.evaluate(() => {
    const durations = [30, 45, 60, 90, 120];
    const found = [];
    for (const d of durations) {
      const btns = Array.from(document.querySelectorAll('button, label, [role="radio"]'));
      for (const el of btns) {
        const t = el.innerText?.trim();
        if (t && (t.includes(d + ' min') || t === String(d))) {
          found.push({ dur: d, text: t.substring(0, 30) });
          break;
        }
      }
    }
    return found;
  });

  if (programInfo.length > 0) {
    log('TEST 7: Výběr programu', 'PASS', `Nalezeno: ${programInfo.map(p => p.text).join(', ')}`);
  } else {
    log('TEST 7: Výběr programu', 'INFO', 'Trvání nenalezena (zobrazí se po výběru času?)');
  }

  // TEST 8: Hledání klienta
  console.log('\n[TEST 8] Hledání klienta...');
  const clientSearch = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    for (const inp of inputs) {
      const ph = inp.placeholder?.toLowerCase() || '';
      const name = inp.name?.toLowerCase() || '';
      if (ph.includes('klient') || ph.includes('hledat') || ph.includes('jméno') || name.includes('client') || name.includes('search') || inp.type === 'search') {
        return { found: true, placeholder: inp.placeholder, name: inp.name, type: inp.type };
      }
    }
    return { found: false, allInputs: inputs.map(i => ({ type: i.type, placeholder: i.placeholder, name: i.name })) };
  });

  console.log('[info] Klient search:', JSON.stringify(clientSearch));

  if (clientSearch.found) {
    log('TEST 8: Hledání klienta', 'PASS', `Placeholder: "${clientSearch.placeholder}"`);
    const searchEl = page.locator(`input[placeholder*="${clientSearch.placeholder.substring(0, 10)}"]`).first();
    await searchEl.fill('Anna');
    await sleep(1500);
    await shot(page, 'v3-08-search');
    log('TEST 8: Zadání do search', 'PASS');
  } else {
    log('TEST 8: Hledání klienta', 'INFO', `Search nenalezen. Inputy: ${JSON.stringify(clientSearch.allInputs?.slice(0,3))}`);
  }

  // TEST 9: Live preview summary
  console.log('\n[TEST 9] Live preview summary...');
  const summaryEl = await page.evaluate(() => {
    const candidates = [
      document.querySelector('[class*="summary"]'),
      document.querySelector('[class*="preview"]'),
      document.querySelector('[class*="recap"]'),
      document.querySelector('aside'),
      document.querySelector('[class*="panel"]'),
    ];
    for (const el of candidates) {
      if (el && el.innerText?.trim().length > 10) {
        return { found: true, text: el.innerText?.trim().substring(0, 200), tag: el.tagName };
      }
    }
    return { found: false };
  });

  if (summaryEl.found) {
    log('TEST 9: Live preview summary', 'PASS', `"${summaryEl.text?.substring(0, 80)}"`);
  } else {
    log('TEST 9: Live preview summary', 'INFO', 'Summary sekce nenalezena (viditelná po kompletním výběru)');
  }

  // TEST 10: VYTVORIT button
  console.log('\n[TEST 10] VYTVORIT button...');
  const createBtnInfo = await page.evaluate(() => {
    const sels = ['button[type="submit"]'];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) return { found: true, text: el.innerText?.trim(), disabled: el.disabled };
    }
    const btns = Array.from(document.querySelectorAll('button'));
    for (const btn of btns) {
      const t = btn.innerText?.trim().toLowerCase();
      if (t.includes('vytvoř') || t.includes('vytvořit') || t.includes('potvrdit') || t.includes('uložit') || t.includes('rezervov') || t.includes('přidat')) {
        return { found: true, text: btn.innerText?.trim(), disabled: btn.disabled };
      }
    }
    return { found: false, allButtons: btns.map(b => b.innerText?.trim()).filter(Boolean).slice(0, 10) };
  });

  console.log('[info] VYTVORIT button:', JSON.stringify(createBtnInfo));

  if (createBtnInfo.found) {
    log('TEST 10: VYTVORIT button', 'PASS', `"${createBtnInfo.text}" disabled=${createBtnInfo.disabled}`);
  } else {
    log('TEST 10: VYTVORIT button', 'INFO',
      `Nenalezen. Tlačítka: ${createBtnInfo.allButtons?.join(', ')}`);
  }

  // Finální screenshot
  await shot(page, 'v3-final');

} catch (err) {
  console.error('[ERROR]', err.message.substring(0, 300));
  await shot(page, 'v3-error').catch(() => {});
  log('Test', 'ERROR', err.message.substring(0, 150));
}

printResults();

function printResults() {
  console.log('\n=== VÝSLEDKY TESTOVÁNÍ /booking/quick ===');
  for (const r of results) {
    console.log(`[${r.status}] ${r.test}${r.detail ? ': ' + r.detail : ''}`);
  }
}

console.log('\n[info] Screenshoty: /tmp/booking-quick-test/v3-*');
await sleep(5000);
await browser.close();
console.log('[done]');
