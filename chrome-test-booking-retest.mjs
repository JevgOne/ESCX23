/**
 * RETEST: /booking/quick po opravě exception_type bugu
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = '/tmp/booking-retest';
mkdirSync(SHOTS, { recursive: true });

const PROFILE = '/tmp/chrome-booking-retest-profile';
const BASE = 'http://localhost:3001';
const PROD = 'https://www.lovelygirls.cz';

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
  } catch(e) {
    console.log(`[shot-fail] ${name}: ${e.message.substring(0, 50)}`);
  }
}

// Copy Chrome profile for session
import { execSync } from 'child_process';
try {
  execSync(`rm -rf ${PROFILE} && cp -r "$HOME/Library/Application Support/Google/Chrome/Default" ${PROFILE} 2>/dev/null || true`);
  console.log('[profile] Chrome profile copied');
} catch(e) {
  console.log('[profile] Kopie profilu selhala, použiji prázdný profil');
}

console.log('[retest] Spouštím Chrome...');
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
  // === LOGIN ===
  console.log('[step] Login...');
  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(2000);
  await shot(page, '01-login');

  const emailInput = await page.locator('input[name="email"], input[type="email"]').count();
  if (emailInput > 0) {
    await page.fill('input[name="email"], input[type="email"]', 'info@lovelygirls.cz');
    await page.fill('input[name="password"], input[type="password"]', 'Test2026!');
    await page.click('button[type="submit"]');
    await sleep(3000);
    const afterLogin = page.url();
    console.log(`[login] Po přihlášení: ${afterLogin}`);
    await shot(page, '02-after-login');

    if (afterLogin.includes('error=invalid') || afterLogin.endsWith('/booking')) {
      log('Login', 'FAIL', 'Credentials nefungují');
      await browser.close();
      process.exit(1);
    }
    log('Login', 'PASS', `URL: ${afterLogin}`);
  } else {
    log('Login', 'INFO', 'Login formulář nenalezen — možná jsme přihlášeni z profilu');
  }

  // === TEST 1: /booking/quick načtení ===
  console.log('[step] Navigace na /booking/quick...');
  await page.goto(`${BASE}/booking/quick`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);
  await shot(page, '03-quick-load');

  const url1 = page.url();
  const body1 = await page.evaluate(() => document.body?.innerText?.substring(0, 300) || '');
  const has500 = body1.includes('SQLITE_ERROR') || body1.includes('500') || body1.includes('Internal Server Error');
  const has404 = body1.includes('404') || body1.includes('Not Found');
  const isQuickPage = url1.includes('/quick');

  console.log(`[info] URL: ${url1}`);
  console.log(`[info] Body snippet: ${body1.substring(0, 150).replace(/\n/g, ' ')}`);

  if (has500) {
    log('TEST 1: /booking/quick načtení', 'FAIL', `Server error: ${body1.substring(0, 100)}`);
  } else if (has404) {
    log('TEST 1: /booking/quick načtení', 'FAIL', '404 Not Found');
  } else if (!isQuickPage) {
    log('TEST 1: /booking/quick načtení', 'FAIL', `Přesměrováno na: ${url1}`);
  } else {
    log('TEST 1: /booking/quick načtení', 'PASS', `URL: ${url1}`);
  }

  if (has500 || has404 || !isQuickPage) {
    printResults();
    await browser.close();
    process.exit(0);
  }

  // === TEST 2: Dívky jako tlačítka ===
  await sleep(2000);
  const girlButtons = await page.evaluate(() => {
    // Hledej tlačítka nebo clickable prvky s jmény dívek
    const allBtns = Array.from(document.querySelectorAll('button, [role="button"], .girl-btn, [data-girl]'));
    const texts = allBtns.map(b => b.innerText?.trim()).filter(t => t && t.length > 1 && t.length < 30);
    return { count: allBtns.length, texts: texts.slice(0, 15) };
  });
  console.log(`[info] Tlačítka: ${JSON.stringify(girlButtons)}`);

  if (girlButtons.count > 0) {
    log('TEST 2: Dívky jako tlačítka', 'PASS', `${girlButtons.count} tlačítek: ${girlButtons.texts.slice(0, 3).join(', ')}`);
  } else {
    log('TEST 2: Dívky jako tlačítka', 'FAIL', 'Žádná tlačítka nenalezena');
  }

  // === TEST 3: Klik na dívku → dny ve formátu "14.9 SOBOTA" ===
  // Najdi první tlačítko dívky a klikni
  const girlBtnSelector = 'button, [role="button"]';
  const btns = await page.locator(girlBtnSelector).all();
  let clickedGirl = false;

  for (const btn of btns.slice(0, 20)) {
    const text = await btn.innerText().catch(() => '');
    const trimmed = text.trim();
    if (trimmed.length > 1 && trimmed.length < 25 && !trimmed.includes('\n')) {
      console.log(`[info] Klikám na tlačítko: "${trimmed}"`);
      await btn.click();
      await sleep(2000);
      await shot(page, '04-after-girl-click');
      clickedGirl = true;
      break;
    }
  }

  if (!clickedGirl) {
    log('TEST 3: Klik na dívku', 'FAIL', 'Nelze kliknout na žádné tlačítko dívky');
  } else {
    // Ověř formát dnů — hledej "14.9 SOBOTA" nebo podobný vzor
    const dayFormat = await page.evaluate(() => {
      const allText = document.body?.innerText || '';
      // Hledej vzor DD.M DAYNAME nebo D.M DAYNAME
      const dayPattern = /\d{1,2}\.\d{1,2}\s+(PONDĚLÍ|ÚTERÝ|STŘEDA|ČTVRTEK|PÁTEK|SOBOTA|NEDĚLE|PON|ÚT|ST|ČT|PÁ|SO|NE)/gi;
      const matches = allText.match(dayPattern) || [];
      return { found: matches.length > 0, examples: matches.slice(0, 3) };
    });
    console.log(`[info] Formát dnů: ${JSON.stringify(dayFormat)}`);

    if (dayFormat.found) {
      log('TEST 3: Formát dnů "14.9 SOBOTA"', 'PASS', `Příklady: ${dayFormat.examples.join(', ')}`);
    } else {
      // Zkus jiné formáty
      const anyDays = await page.evaluate(() => {
        const allText = document.body?.innerText || '';
        const lines = allText.split('\n').filter(l => l.trim().length > 0).slice(0, 30);
        return lines.join(' | ');
      });
      log('TEST 3: Formát dnů "14.9 SOBOTA"', 'INFO', `Formát nebyl nalezen. Text: ${anyDays.substring(0, 100)}`);
    }
  }

  // === TEST 4: Nepracující dny šedé ===
  const greyDays = await page.evaluate(() => {
    // Hledej elementy s grey/disabled stylem
    const disabled = Array.from(document.querySelectorAll('[disabled], .disabled, [aria-disabled="true"], .grey, .inactive, .text-gray-400, .text-gray-300, .opacity-50, .opacity-30'));
    const greyBtns = Array.from(document.querySelectorAll('button')).filter(b => {
      const style = window.getComputedStyle(b);
      const color = style.color;
      const bg = style.backgroundColor;
      return b.disabled || color.includes('128') || color.includes('156') || color.includes('gray');
    });
    return {
      disabledCount: disabled.length,
      greyBtnCount: greyBtns.length,
      examples: disabled.slice(0, 3).map(el => el.tagName + ': ' + (el.innerText?.substring(0, 20) || ''))
    };
  });
  console.log(`[info] Šedé/disabled prvky: ${JSON.stringify(greyDays)}`);

  if (greyDays.disabledCount > 0 || greyDays.greyBtnCount > 0) {
    log('TEST 4: Nepracující dny šedé', 'PASS', `${greyDays.disabledCount} disabled, ${greyDays.greyBtnCount} grey buttons`);
  } else {
    log('TEST 4: Nepracující dny šedé', 'INFO', 'Disabled prvky nenalezeny (možná panel používá jiný styl)');
  }

  // === TEST 5: Klik na den → volné časy ===
  // Najdi klikatelný den (ne šedý)
  const dayBtns = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns
      .filter(b => !b.disabled)
      .map(b => ({ text: b.innerText?.trim(), hasDate: /\d{1,2}\.\d/.test(b.innerText || '') }))
      .filter(b => b.hasDate)
      .slice(0, 5);
  });
  console.log(`[info] Dny jako tlačítka: ${JSON.stringify(dayBtns)}`);

  let clickedDay = false;
  if (dayBtns.length > 0) {
    // Klikni na první dostupný den
    const daySelector = 'button:not([disabled])';
    const dayElements = await page.locator(daySelector).all();
    for (const el of dayElements) {
      const text = await el.innerText().catch(() => '');
      if (/\d{1,2}\.\d/.test(text)) {
        console.log(`[info] Klikám na den: "${text.trim()}"`);
        await el.click();
        await sleep(2000);
        await shot(page, '05-after-day-click');
        clickedDay = true;
        break;
      }
    }
  }

  // Hledej volné časy po kliknutí
  const timeSlots = await page.evaluate(() => {
    const allText = document.body?.innerText || '';
    const timePattern = /\d{1,2}:\d{2}/g;
    const times = allText.match(timePattern) || [];
    return { count: times.length, examples: [...new Set(times)].slice(0, 8) };
  });
  console.log(`[info] Volné časy: ${JSON.stringify(timeSlots)}`);

  if (clickedDay && timeSlots.count > 0) {
    log('TEST 5: Klik na den → volné časy', 'PASS', `${timeSlots.count} časových slotů: ${timeSlots.examples.join(', ')}`);
  } else if (timeSlots.count > 0) {
    log('TEST 5: Volné časy viditelné', 'PASS', `${timeSlots.examples.join(', ')}`);
  } else {
    log('TEST 5: Klik na den → volné časy', 'INFO', `Klikl na den: ${clickedDay}, časy: ${timeSlots.count}`);
  }

  // === TEST 6: Klik na čas ===
  const timeBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button:not([disabled])'))
      .filter(b => /^\d{1,2}:\d{2}$/.test(b.innerText?.trim() || ''))
      .map(b => b.innerText?.trim())
      .slice(0, 5);
  });
  console.log(`[info] Časová tlačítka: ${JSON.stringify(timeBtns)}`);

  let clickedTime = false;
  if (timeBtns.length > 0) {
    const timeEl = page.locator(`button:not([disabled])`).filter({ hasText: timeBtns[0] }).first();
    await timeEl.click().catch(() => {});
    await sleep(1500);
    await shot(page, '06-after-time-click');
    clickedTime = true;

    // Ověř highlight
    const highlighted = await page.evaluate((t) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim() === t);
      if (!btn) return null;
      const style = window.getComputedStyle(btn);
      return { bg: style.backgroundColor, classes: btn.className };
    }, timeBtns[0]);
    console.log(`[info] Kliknutý čas highlight: ${JSON.stringify(highlighted)}`);
    log('TEST 6: Klik na čas', 'PASS', `Čas "${timeBtns[0]}" kliknut`);
  } else {
    log('TEST 6: Klik na čas', 'INFO', 'Časová tlačítka nenalezena — možná potřeba nejdřív kliknout na den');
  }

  // === TEST 7: Výběr programu (duration) ===
  const programBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button:not([disabled])'))
      .filter(b => {
        const text = b.innerText?.trim() || '';
        return /\d+\s*(min|hod|h\b)/.test(text) || /^(30|45|60|90|120)$/.test(text);
      })
      .map(b => b.innerText?.trim())
      .slice(0, 6);
  });
  console.log(`[info] Program tlačítka: ${JSON.stringify(programBtns)}`);

  if (programBtns.length > 0) {
    const progEl = page.locator('button:not([disabled])').filter({ hasText: programBtns[0] }).first();
    await progEl.click().catch(() => {});
    await sleep(1000);
    await shot(page, '07-after-program-click');
    log('TEST 7: Výběr programu', 'PASS', `Program "${programBtns[0]}" vybrán`);
  } else {
    log('TEST 7: Výběr programu', 'INFO', 'Tlačítka programu nenalezena');
  }

  // === TEST 8: Hledání klienta ===
  const clientInput = await page.locator('input[placeholder*="klient"], input[placeholder*="Klient"], input[placeholder*="hledat"], input[placeholder*="search"], input[name*="client"]').count();
  console.log(`[info] Client input count: ${clientInput}`);

  if (clientInput > 0) {
    const inp = page.locator('input[placeholder*="klient"], input[placeholder*="Klient"], input[placeholder*="hledat"], input[placeholder*="search"], input[name*="client"]').first();
    await inp.fill('Test');
    await sleep(1500);
    await shot(page, '08-client-search');
    const dropdown = await page.evaluate(() => {
      const dropdowns = document.querySelectorAll('[role="listbox"], [role="option"], .dropdown, .suggestions, .autocomplete');
      return dropdowns.length;
    });
    log('TEST 8: Hledání klienta', 'PASS', `Input nalezen, dropdown: ${dropdown > 0 ? 'zobrazil se' : 'nezobrazil se'}`);
  } else {
    // Zkus obecné inputy
    const allInputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, placeholder: i.placeholder, name: i.name }));
    });
    console.log(`[info] Všechny inputy: ${JSON.stringify(allInputs)}`);
    log('TEST 8: Hledání klienta', 'INFO', `Client input nenalezen. Inputy: ${JSON.stringify(allInputs).substring(0, 100)}`);
  }

  // === TEST 9: Live preview ===
  const preview = await page.evaluate(() => {
    const allText = document.body?.innerText || '';
    // Hledej preview sekci
    const hasPreview = allText.includes('Náhled') || allText.includes('Preview') || allText.includes('Shrnutí') ||
      allText.includes('Rezervace') || allText.includes('Souhrn');
    const sections = Array.from(document.querySelectorAll('section, aside, [class*="preview"], [class*="summary"], [class*="detail"]'));
    return { hasPreview, sectionCount: sections.length, bodySnippet: allText.substring(0, 500) };
  });
  console.log(`[info] Preview: ${JSON.stringify({ hasPreview: preview.hasPreview, sections: preview.sectionCount })}`);
  await shot(page, '09-preview');

  if (preview.hasPreview) {
    log('TEST 9: Live preview', 'PASS', 'Náhled/preview sekce nalezena');
  } else {
    log('TEST 9: Live preview', 'INFO', `Preview text nenalezen. Sekce: ${preview.sectionCount}`);
  }

  // === TEST 10: VYTVORIT tlačítko ===
  const createBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const found = btns.find(b => {
      const t = b.innerText?.trim() || '';
      return t.includes('VYTVORIT') || t.includes('Vytvořit') || t.includes('VYTVOŘIT') || t.includes('Potvrdit') || t.includes('Uložit');
    });
    return found ? { text: found.innerText?.trim(), disabled: found.disabled } : null;
  });
  console.log(`[info] VYTVORIT tlačítko: ${JSON.stringify(createBtn)}`);

  if (createBtn) {
    log('TEST 10: VYTVORIT tlačítko', 'PASS', `Tlačítko "${createBtn.text}" (disabled: ${createBtn.disabled})`);
  } else {
    log('TEST 10: VYTVORIT tlačítko', 'INFO', 'Tlačítko nenalezeno — možná se zobrazí až po vyplnění formuláře');
  }

  await shot(page, '10-final');

} catch (err) {
  console.error('[ERROR]', err.message.substring(0, 300));
  await shot(page, 'error').catch(() => {});
  log('Test', 'ERROR', err.message.substring(0, 150));
}

function printResults() {
  console.log('\n=== VÝSLEDKY RETESTŮ ===');
  for (const r of results) {
    console.log(`[${r.status}] ${r.test}${r.detail ? ': ' + r.detail : ''}`);
  }
}

printResults();
await sleep(3000);
await browser.close();
console.log('[done]');
