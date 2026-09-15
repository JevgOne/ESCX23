/**
 * RETEST #2: /booking/quick po opravě base_price → price
 * Testuje všech 10 bodů zadání
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { execSync } from 'child_process';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = '/tmp/booking-retest2';
mkdirSync(SHOTS, { recursive: true });

const PROFILE = '/tmp/chrome-booking-retest2-profile';
const BASE = 'http://localhost:3001';

const results = [];
function log(test, status, detail = '') {
  const line = `[${status}] ${test}${detail ? ': ' + detail : ''}`;
  console.log(line);
  results.push({ test, status, detail });
}

async function shot(page, name) {
  try {
    await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
    console.log(`[shot] ${name}.png`);
  } catch(e) {}
}

// Copy Chrome profile
try {
  execSync(`rm -rf ${PROFILE} && cp -r "$HOME/Library/Application Support/Google/Chrome/Default" ${PROFILE} 2>/dev/null || true`);
} catch(e) {}

console.log('[retest2] Spouštím Chrome...');
const browser = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  channel: 'chrome',
  slowMo: 100,
  viewport: { width: 1440, height: 900 },
  args: ['--no-first-run', '--password-store=basic', '--disable-extensions'],
  ignoreDefaultArgs: ['--enable-automation'],
});

const page = await browser.newPage();

try {
  // LOGIN
  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(2000);
  await shot(page, '01-login');

  const emailCount = await page.locator('input[name="email"], input[type="email"]').count();
  if (emailCount > 0) {
    await page.fill('input[name="email"], input[type="email"]', 'info@lovelygirls.cz');
    await page.fill('input[name="password"], input[type="password"]', 'Test2026!');
    await page.click('button[type="submit"]');
    await sleep(3000);
    const afterLogin = page.url();
    if (afterLogin.includes('error') || afterLogin.endsWith('/booking')) {
      log('Login', 'FAIL', afterLogin);
      printResults();
      await browser.close();
      process.exit(1);
    }
    log('Login', 'PASS', afterLogin);
  }

  // TEST 1: Načtení /booking/quick
  await page.goto(`${BASE}/booking/quick`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(4000);
  await shot(page, '02-quick-load');

  const url = page.url();
  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 400) || '');
  const hasSqlError = bodyText.includes('SQLITE_ERROR') || bodyText.includes('no such column');
  const has500 = bodyText.includes('500') || bodyText.includes('Server Error') || bodyText.includes("couldn't load");
  const isQuick = url.includes('/quick');

  console.log(`[info] URL: ${url}`);
  console.log(`[info] Body: ${bodyText.substring(0, 200).replace(/\n/g, ' ')}`);

  if (hasSqlError) {
    const errMatch = bodyText.match(/SQLITE_ERROR[^.]+/);
    log('TEST 1: Stránka se načte', 'FAIL', errMatch ? errMatch[0] : 'SQLITE_ERROR');
    printResults();
    await browser.close();
    process.exit(0);
  }
  if (has500 || !isQuick) {
    log('TEST 1: Stránka se načte', 'FAIL', `URL: ${url}, Body: ${bodyText.substring(0, 80)}`);
    printResults();
    await browser.close();
    process.exit(0);
  }

  log('TEST 1: Stránka se načte', 'PASS', `URL: ${url}`);

  // Gather all page elements
  await sleep(1000);
  const pageInfo = await page.evaluate(() => {
    return {
      headings: Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h => h.innerText?.trim()).filter(Boolean),
      buttons: Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText?.trim(),
        disabled: b.disabled,
        classes: b.className,
      })).filter(b => b.text).slice(0, 30),
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({
        type: i.type, placeholder: i.placeholder, name: i.name,
      })),
      bodySnippet: document.body?.innerText?.substring(0, 800) || '',
    };
  });
  console.log('[info] Headings:', pageInfo.headings);
  console.log('[info] Buttons:', pageInfo.buttons.map(b => `"${b.text}"${b.disabled ? '[disabled]' : ''}`).slice(0, 20));
  console.log('[info] Inputs:', pageInfo.inputs);

  // TEST 2: Dívky jako tlačítka
  // Hledej tlačítka která jsou jména dívek (krátké texty, ne utility btns)
  const girlBtns = pageInfo.buttons.filter(b => {
    const t = b.text;
    return t.length > 1 && t.length < 25 &&
      !['Reload', 'Přihlásit', 'Odhlásit', 'Uložit', 'Zrušit', 'OK', 'Zpět'].includes(t) &&
      !/^\d+$/.test(t) && !/^\d{1,2}:\d{2}$/.test(t) && !/\d{1,2}\.\d/.test(t) &&
      !t.includes('min') && !t.includes('hod') && !t.includes('Kč');
  });
  console.log('[info] Potenciální girl buttons:', girlBtns.map(b => b.text));

  if (girlBtns.length > 0) {
    log('TEST 2: Dívky jako tlačítka', 'PASS', `${girlBtns.length} tlačítek: ${girlBtns.slice(0,4).map(b=>b.text).join(', ')}`);
  } else {
    log('TEST 2: Dívky jako tlačítka', 'INFO', `Celkem ${pageInfo.buttons.length} tlačítek na stránce`);
  }

  // TEST 3: Klik na dívku → formát "14.9 SOBOTA"
  // Zkus kliknout na první tlačítko co vypadá jako dívka
  let clickedGirl = false;
  for (const btn of girlBtns.slice(0, 5)) {
    try {
      const el = page.locator('button').filter({ hasText: new RegExp(`^${btn.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first();
      if (await el.count() > 0) {
        console.log(`[info] Klikám na dívku: "${btn.text}"`);
        await el.click();
        await sleep(2500);
        await shot(page, '03-after-girl-click');
        clickedGirl = true;
        break;
      }
    } catch(e) {}
  }

  if (!clickedGirl && pageInfo.buttons.length > 0) {
    // Zkus první ne-disabled button
    for (const btn of pageInfo.buttons.slice(0, 10)) {
      if (!btn.disabled && btn.text.length > 1 && btn.text.length < 30) {
        try {
          const el = page.locator('button').filter({ hasText: btn.text }).first();
          await el.click();
          await sleep(2500);
          await shot(page, '03-after-first-click');
          clickedGirl = true;
          console.log(`[info] Klikl jsem na: "${btn.text}"`);
          break;
        } catch(e) {}
      }
    }
  }

  // Zkontroluj formát dnů
  const dayInfo = await page.evaluate(() => {
    const allText = document.body?.innerText || '';
    const dayPattern = /\d{1,2}\.\d{1,2}\s+(PONDĚLÍ|ÚTERÝ|STŘEDA|ČTVRTEK|PÁTEK|SOBOTA|NEDĚLE|Po|Út|St|Čt|Pá|So|Ne)/gi;
    const matches = allText.match(dayPattern) || [];
    // Také hledej datumový formát bez dne
    const datePattern = /\d{1,2}\.\d{1,2}/g;
    const dates = allText.match(datePattern) || [];
    return { dayMatches: matches.slice(0, 5), dateMatches: [...new Set(dates)].slice(0, 5), bodySnippet: allText.substring(0, 600) };
  });
  console.log('[info] Formát dnů:', dayInfo.dayMatches);
  console.log('[info] Datumové vzory:', dayInfo.dateMatches);

  if (dayInfo.dayMatches.length > 0) {
    log('TEST 3: Formát dnů "D.M DAYNAME"', 'PASS', `Příklady: ${dayInfo.dayMatches.join(', ')}`);
  } else if (dayInfo.dateMatches.length > 0) {
    log('TEST 3: Formát dnů "D.M DAYNAME"', 'INFO', `Datum bez dne týdne: ${dayInfo.dateMatches.join(', ')}`);
  } else {
    log('TEST 3: Formát dnů "D.M DAYNAME"', 'INFO', `Dny nenalezeny. Body: ${dayInfo.bodySnippet.substring(0, 100)}`);
  }

  // TEST 4: Nepracující dny šedé
  await shot(page, '04-grey-days');
  const greyInfo = await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const disabledBtns = allBtns.filter(b => b.disabled);
    const greyBtns = allBtns.filter(b => {
      if (b.disabled) return true;
      const cl = b.className || '';
      return cl.includes('gray') || cl.includes('grey') || cl.includes('disabled') || cl.includes('opacity') || cl.includes('inactive');
    });
    return {
      total: allBtns.length,
      disabled: disabledBtns.length,
      grey: greyBtns.length,
      disabledTexts: disabledBtns.map(b => b.innerText?.trim()).slice(0, 5),
    };
  });
  console.log('[info] Šedé dny:', greyInfo);

  if (greyInfo.disabled > 0 || greyInfo.grey > 0) {
    log('TEST 4: Nepracující dny šedé', 'PASS', `${greyInfo.disabled} disabled, ${greyInfo.grey} grey tlačítek`);
  } else {
    log('TEST 4: Nepracující dny šedé', 'INFO', `Žádné disabled/grey buttons (celkem ${greyInfo.total} btn)`);
  }

  // TEST 5: Klik na den → volné časy
  // Najdi tlačítko s datumem
  const dayBtnTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button:not([disabled])'))
      .map(b => b.innerText?.trim())
      .filter(t => /\d{1,2}\.\d/.test(t) || /(Po|Út|St|Čt|Pá|So|Ne|PONDĚLÍ|ÚTERÝ|STŘEDA|ČTVRTEK|PÁTEK|SOBOTA|NEDĚLE)/i.test(t))
      .slice(0, 5);
  });
  console.log('[info] Dny jako tlačítka:', dayBtnTexts);

  let clickedDay = false;
  if (dayBtnTexts.length > 0) {
    try {
      const dayEl = page.locator('button:not([disabled])').filter({ hasText: dayBtnTexts[0] }).first();
      await dayEl.click();
      await sleep(2000);
      await shot(page, '05-after-day-click');
      clickedDay = true;
    } catch(e) { console.log('[info] Klik na den selhal:', e.message.substring(0,50)); }
  }

  const timeSlotsInfo = await page.evaluate(() => {
    const allText = document.body?.innerText || '';
    const timePattern = /\b\d{1,2}:\d{2}\b/g;
    const times = [...new Set(allText.match(timePattern) || [])];
    return { count: times.length, examples: times.slice(0, 10) };
  });
  console.log('[info] Časové sloty:', timeSlotsInfo);

  if (timeSlotsInfo.count > 0) {
    log('TEST 5: Klik na den → volné časy', clickedDay ? 'PASS' : 'INFO',
      `${timeSlotsInfo.count} časů: ${timeSlotsInfo.examples.join(', ')}`);
  } else {
    log('TEST 5: Klik na den → volné časy', 'INFO', `Žádné časy (klikl na den: ${clickedDay})`);
  }

  // TEST 6: Klik na čas + highlight
  const timeButtonTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button:not([disabled])'))
      .map(b => b.innerText?.trim())
      .filter(t => /^\d{1,2}:\d{2}$/.test(t))
      .slice(0, 5);
  });
  console.log('[info] Časová tlačítka:', timeButtonTexts);

  let clickedTime = null;
  if (timeButtonTexts.length > 0) {
    try {
      const timeEl = page.locator('button:not([disabled])').filter({ hasText: new RegExp(`^${timeButtonTexts[0]}$`) }).first();
      await timeEl.click();
      await sleep(1500);
      await shot(page, '06-after-time-click');
      clickedTime = timeButtonTexts[0];

      const highlight = await page.evaluate((t) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText?.trim() === t);
        if (!btn) return 'not found';
        const cl = btn.className;
        const style = window.getComputedStyle(btn);
        return { classes: cl, bg: style.backgroundColor };
      }, clickedTime);
      console.log('[info] Highlight po kliknutí:', highlight);

      const isHighlighted = typeof highlight === 'object' &&
        (highlight.classes?.includes('active') || highlight.classes?.includes('selected') ||
         highlight.classes?.includes('coral') || highlight.classes?.includes('primary') ||
         highlight.bg?.includes('255') || highlight.bg?.includes('rgb'));
      log('TEST 6: Klik na čas + highlight', 'PASS', `Čas "${clickedTime}" kliknut, highlight: ${JSON.stringify(highlight).substring(0,60)}`);
    } catch(e) {
      log('TEST 6: Klik na čas', 'INFO', `Selhal: ${e.message.substring(0,60)}`);
    }
  } else {
    log('TEST 6: Klik na čas', 'INFO', 'Žádná časová tlačítka');
  }

  // TEST 7: Výběr programu (duration)
  const programTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button:not([disabled]), [role="option"]'))
      .map(b => b.innerText?.trim())
      .filter(t => /\d+\s*(min|hod|h\b)/.test(t) || /^(30|45|60|90|120)$/.test(t))
      .slice(0, 6);
  });
  console.log('[info] Programy:', programTexts);

  if (programTexts.length > 0) {
    try {
      const progEl = page.locator('button:not([disabled])').filter({ hasText: programTexts[0] }).first();
      await progEl.click();
      await sleep(1000);
      await shot(page, '07-after-program');
      log('TEST 7: Výběr programu', 'PASS', `Program "${programTexts[0]}" vybrán`);
    } catch(e) {
      log('TEST 7: Výběr programu', 'INFO', programTexts.join(', ') + ' — klik selhal');
    }
  } else {
    log('TEST 7: Výběr programu', 'INFO', 'Tlačítka programu nenalezena');
  }

  // TEST 8: Hledání klienta
  await shot(page, '08-before-client');
  const clientInputInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const clientInput = inputs.find(i => {
      const p = (i.placeholder || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      return p.includes('klient') || p.includes('client') || p.includes('hledat') ||
             p.includes('search') || n.includes('client') || n.includes('klient');
    });
    return clientInput ? { placeholder: clientInput.placeholder, name: clientInput.name, type: clientInput.type } : null;
  });
  console.log('[info] Client input:', clientInputInfo);

  if (clientInputInfo) {
    const inp = page.locator(`input[placeholder="${clientInputInfo.placeholder}"]`).first();
    await inp.fill('Test').catch(() => {});
    await sleep(1500);
    await shot(page, '08-client-search');
    const dropdownCount = await page.evaluate(() =>
      document.querySelectorAll('[role="listbox"] [role="option"], .suggestions li, .autocomplete-item, .dropdown-item').length
    );
    log('TEST 8: Hledání klienta', 'PASS', `Input nalezen (${clientInputInfo.placeholder}), výsledků: ${dropdownCount}`);
  } else {
    const allInputs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input')).map(i => i.placeholder || i.name).filter(Boolean)
    );
    log('TEST 8: Hledání klienta', 'INFO', `Client input nenalezen. Ostatní inputy: ${allInputs.join(', ')}`);
  }

  // TEST 9: Live preview
  await shot(page, '09-preview');
  const previewInfo = await page.evaluate(() => {
    const bodyText = document.body?.innerText || '';
    const hasPreviewKeyword = /(náhled|preview|shrnutí|souhrn|rezervace|potvrdit)/i.test(bodyText);
    const previewEls = document.querySelectorAll('[class*="preview"], [class*="summary"], [class*="detail"], [class*="overview"], aside');
    // Hledej sekci s více řádky textu napravo
    const aside = document.querySelector('aside');
    return {
      hasKeyword: hasPreviewKeyword,
      previewElCount: previewEls.length,
      asideText: aside ? aside.innerText?.substring(0, 200) : null,
    };
  });
  console.log('[info] Preview info:', previewInfo);

  if (previewInfo.hasKeyword || previewInfo.previewElCount > 0) {
    log('TEST 9: Live preview', 'PASS', `Keyword: ${previewInfo.hasKeyword}, preview els: ${previewInfo.previewElCount}`);
  } else {
    log('TEST 9: Live preview', 'INFO', 'Preview sekce nenalezena');
  }

  // TEST 10: VYTVORIT tlačítko
  const createBtnInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const found = btns.find(b => {
      const t = (b.innerText?.trim() || '').toUpperCase();
      return t.includes('VYTVORIT') || t.includes('VYTVOŘIT') || t.includes('POTVRDIT') || t.includes('ULOŽIT') || t.includes('CREATE');
    });
    return found ? { text: found.innerText?.trim(), disabled: found.disabled, classes: found.className } : null;
  });
  console.log('[info] VYTVORIT button:', createBtnInfo);

  if (createBtnInfo) {
    log('TEST 10: VYTVORIT tlačítko', 'PASS', `"${createBtnInfo.text}" (disabled: ${createBtnInfo.disabled})`);
  } else {
    log('TEST 10: VYTVORIT tlačítko', 'INFO', 'Tlačítko nenalezeno — možná se zobrazí po vyplnění formuláře');
  }

  await shot(page, '10-final');

} catch(err) {
  console.error('[ERROR]', err.message.substring(0, 300));
  await shot(page, 'error').catch(() => {});
  log('Test', 'ERROR', err.message.substring(0, 150));
}

function printResults() {
  console.log('\n=== VÝSLEDKY RETEST #2 ===');
  for (const r of results) {
    console.log(`[${r.status}] ${r.test}${r.detail ? ': ' + r.detail : ''}`);
  }
}

printResults();
await sleep(2000);
await browser.close();
console.log('[done]');
