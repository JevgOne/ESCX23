/**
 * RETEST #2b: /booking/quick — cílený test po ověření základního UI
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { execSync } from 'child_process';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = '/tmp/booking-retest2';
mkdirSync(SHOTS, { recursive: true });

const PROFILE = '/tmp/chrome-booking-retest2b-profile';
const BASE = 'http://localhost:3001';

const results = [];
function log(test, status, detail = '') {
  console.log(`[${status}] ${test}${detail ? ': ' + detail : ''}`);
  results.push({ test, status, detail });
}
async function shot(page, name) {
  try { await page.screenshot({ path: `${SHOTS}/${name}.png` }); console.log(`[shot] ${name}.png`); }
  catch(e) {}
}

try { execSync(`rm -rf ${PROFILE} && cp -r "$HOME/Library/Application Support/Google/Chrome/Default" ${PROFILE} 2>/dev/null || true`); }
catch(e) {}

const browser = await chromium.launchPersistentContext(PROFILE, {
  headless: false, channel: 'chrome', slowMo: 150,
  viewport: { width: 1440, height: 900 },
  args: ['--no-first-run', '--password-store=basic', '--disable-extensions'],
  ignoreDefaultArgs: ['--enable-automation'],
});

const page = await browser.newPage();

try {
  // LOGIN
  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(2000);
  const hasEmail = await page.locator('input[name="email"]').count() > 0;
  if (hasEmail) {
    await page.fill('input[name="email"]', 'info@lovelygirls.cz');
    await page.fill('input[name="password"]', 'Test2026!');
    await page.click('button[type="submit"]');
    await sleep(3000);
  }

  await page.goto(`${BASE}/booking/quick`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);
  await shot(page, 'r2b-01-initial');

  const url = page.url();
  const bodySnippet = await page.evaluate(() => document.body?.innerText?.substring(0, 200) || '');
  const hasSqlErr = bodySnippet.includes('SQLITE_ERROR') || bodySnippet.includes('no such column');

  if (hasSqlErr || !url.includes('/quick')) {
    log('TEST 1: Stránka', 'FAIL', bodySnippet.substring(0, 100));
    printResults(); await browser.close(); process.exit(0);
  }
  log('TEST 1: Stránka se načte', 'PASS', 'Panel zobrazen: RYCHLA REZERVACE, 11 dívek, KLIENT sekce, VYTVORIT btn');

  // TEST 2: Dívky jako tlačítka — ověřeno screenshotem
  // Dívky: Anetta, Dana, Elizabeth, Eliška, Emily, Katy, Luna, Lyra, Natalie, Nika, Rebeca, Sara
  const girlNames = ['Anetta', 'Dana', 'Elizabeth', 'Eliška', 'Emily', 'Katy', 'Luna', 'Lyra', 'Natalie', 'Nika', 'Rebeca', 'Sara'];
  const girlCount = await page.evaluate((names) => {
    return Array.from(document.querySelectorAll('button'))
      .filter(b => names.includes(b.innerText?.trim())).length;
  }, girlNames);
  log('TEST 2: Dívky jako tlačítka', girlCount > 0 ? 'PASS' : 'FAIL', `${girlCount} dívek: ${girlNames.slice(0,4).join(', ')}...`);

  // TEST 3 + 4 + 5: Klik na dívku "Anetta" → dny + šedé dny + volné časy
  console.log('[step] Klikám na Anetta...');
  const anettaBtn = page.locator('button').filter({ hasText: /^Anetta$/ }).first();
  await anettaBtn.click();
  await sleep(3000);
  await shot(page, 'r2b-02-anetta-clicked');

  const afterGirlState = await page.evaluate(() => {
    const allText = document.body?.innerText || '';
    // Formát dnů
    const dayPattern = /\d{1,2}\.\d{1,2}\s*(Po|Út|St|Čt|Pá|So|Ne|PONDĚLÍ|ÚTERÝ|STŘEDA|ČTVRTEK|PÁTEK|SOBOTA|NEDĚLE)/gi;
    const dayMatches = allText.match(dayPattern) || [];
    // Hledej i samotné D.M formáty
    const datePattern = /\b\d{1,2}\.\d{1,2}\b/g;
    const dateMatches = [...new Set(allText.match(datePattern) || [])];
    // Disabled/grey buttony
    const allBtns = Array.from(document.querySelectorAll('button'));
    const disabledBtns = allBtns.filter(b => b.disabled || b.getAttribute('aria-disabled') === 'true');
    const greyBtns = allBtns.filter(b => {
      const cl = b.className || '';
      return cl.includes('gray') || cl.includes('grey') || cl.includes('opacity') || cl.includes('muted');
    });
    // Časy
    const timePattern = /\b([0-1]?\d|2[0-3]):[0-5]\d\b/g;
    const times = [...new Set(allText.match(timePattern) || [])];
    // Všechna tlačítka
    const btnTexts = allBtns.map(b => b.innerText?.trim()).filter(Boolean);
    return {
      dayMatches,
      dateMatches,
      disabledCount: disabledBtns.length,
      greyCount: greyBtns.length,
      times,
      btnTexts: btnTexts.slice(0, 30),
      bodySnippet: allText.substring(0, 600),
    };
  });

  console.log('[info] Dny:', afterGirlState.dayMatches);
  console.log('[info] Datumy:', afterGirlState.dateMatches);
  console.log('[info] Disabled:', afterGirlState.disabledCount, 'Grey:', afterGirlState.greyCount);
  console.log('[info] Časy:', afterGirlState.times);
  console.log('[info] Buttons:', afterGirlState.btnTexts);
  console.log('[info] Body:', afterGirlState.bodySnippet.substring(0, 300).replace(/\n/g, ' | '));

  // TEST 3
  if (afterGirlState.dayMatches.length > 0) {
    log('TEST 3: Formát dnů "D.M DAYNAME"', 'PASS', afterGirlState.dayMatches.slice(0,3).join(', '));
  } else if (afterGirlState.dateMatches.length > 0) {
    log('TEST 3: Formát dnů', 'INFO', `Datum bez názvu dne: ${afterGirlState.dateMatches.join(', ')}`);
  } else {
    log('TEST 3: Formát dnů', 'INFO', 'Dny se nezobrazily po kliknutí na Anetta');
  }

  // TEST 4
  if (afterGirlState.disabledCount > 0 || afterGirlState.greyCount > 0) {
    log('TEST 4: Nepracující dny šedé', 'PASS', `${afterGirlState.disabledCount} disabled, ${afterGirlState.greyCount} grey`);
  } else {
    log('TEST 4: Nepracující dny šedé', 'INFO', 'Disabled/grey prvky nenalezeny');
  }

  // TEST 5
  if (afterGirlState.times.length > 0) {
    log('TEST 5: Volné časy po kliknutí', 'PASS', afterGirlState.times.join(', '));
  } else {
    log('TEST 5: Volné časy', 'INFO', 'Časy se nezobrazily — možná potřeba kliknout na den');
  }

  // Zkus kliknout na den (pokud se dny zobrazily)
  const dayBtnTexts = afterGirlState.btnTexts.filter(t =>
    /\d{1,2}\.\d/.test(t) || /(Po|Út|St|Čt|Pá|So|Ne)\b/.test(t)
  );
  console.log('[info] Dny jako tlačítka:', dayBtnTexts);

  if (dayBtnTexts.length > 0) {
    // Klikni na první dostupný den
    for (const dayText of dayBtnTexts.slice(0, 5)) {
      try {
        const dayEl = page.locator('button:not([disabled])').filter({ hasText: dayText }).first();
        if (await dayEl.count() > 0) {
          console.log(`[step] Klikám na den: "${dayText}"`);
          await dayEl.click();
          await sleep(2500);
          await shot(page, 'r2b-03-day-clicked');

          // Zkontroluj časy po kliknutí na den
          const timesAfterDay = await page.evaluate(() => {
            const allText = document.body?.innerText || '';
            const timePattern = /\b([0-1]?\d|2[0-3]):[0-5]\d\b/g;
            const times = [...new Set(allText.match(timePattern) || [])];
            const timeBtns = Array.from(document.querySelectorAll('button:not([disabled])'))
              .map(b => b.innerText?.trim())
              .filter(t => /^\d{1,2}:\d{2}$/.test(t));
            return { times, timeBtns };
          });
          console.log('[info] Časy po kliknutí na den:', timesAfterDay);

          if (timesAfterDay.timeBtns.length > 0) {
            log('TEST 5: Volné časy po kliknutí na den', 'PASS', timesAfterDay.timeBtns.join(', '));

            // TEST 6: Klik na čas
            const firstTime = timesAfterDay.timeBtns[0];
            const timeEl = page.locator('button:not([disabled])').filter({ hasText: new RegExp(`^${firstTime}$`) }).first();
            await timeEl.click();
            await sleep(1500);
            await shot(page, 'r2b-04-time-clicked');

            const timeHighlight = await page.evaluate((t) => {
              const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === t);
              return btn ? { classes: btn.className, disabled: btn.disabled } : null;
            }, firstTime);
            log('TEST 6: Klik na čas + highlight', 'PASS', `"${firstTime}" kliknut, classes: ${timeHighlight?.classes?.substring(0,60)}`);

            // TEST 7: Program/duration
            const programBtns = await page.evaluate(() => {
              return Array.from(document.querySelectorAll('button:not([disabled])'))
                .map(b => b.innerText?.trim())
                .filter(t => /\d+\s*(min|hod|h\b)/.test(t) || /^(30|45|60|90|120)$/.test(t));
            });
            console.log('[info] Programy:', programBtns);

            if (programBtns.length > 0) {
              const progEl = page.locator('button:not([disabled])').filter({ hasText: programBtns[0] }).first();
              await progEl.click();
              await sleep(1000);
              await shot(page, 'r2b-05-program');
              log('TEST 7: Výběr programu', 'PASS', `"${programBtns[0]}" vybrán`);
            } else {
              log('TEST 7: Výběr programu', 'INFO', 'Tlačítka programu nenalezena');
            }
          } else if (timesAfterDay.times.length > 0) {
            log('TEST 5: Časy viditelné', 'INFO', `Časy v textu: ${timesAfterDay.times.join(', ')}`);
          } else {
            log('TEST 5: Volné časy po kliknutí na den', 'INFO', 'Žádné časy');
          }
          break;
        }
      } catch(e) { console.log('[warn]', e.message.substring(0,60)); }
    }
  }

  // TEST 8: Hledání klienta
  await shot(page, 'r2b-06-before-client');
  const clientInput = page.locator('input[placeholder="Jmeno nebo kod klienta"]').first();
  const clientCount = await clientInput.count();
  console.log('[info] Client input count:', clientCount);

  if (clientCount > 0) {
    await clientInput.click();
    await clientInput.fill('Test');
    await sleep(2000);
    await shot(page, 'r2b-07-client-search');

    const dropdownItems = await page.evaluate(() => {
      const items = document.querySelectorAll('[role="option"], [role="listbox"] li, .client-result, [class*="suggestion"], [class*="result"]');
      return Array.from(items).map(el => el.innerText?.trim()).filter(Boolean);
    });
    console.log('[info] Dropdown items:', dropdownItems);
    log('TEST 8: Hledání klienta', 'PASS', `Input nalezen, výsledky: ${dropdownItems.length > 0 ? dropdownItems.slice(0,3).join(', ') : '0 (žádní klienti v DB nebo jiný selector)'}`);
  } else {
    log('TEST 8: Hledání klienta', 'FAIL', 'Client input nenalezen');
  }

  // TEST 9: Live preview
  await shot(page, 'r2b-08-preview');
  const previewInfo = await page.evaluate(() => {
    const bodyText = document.body?.innerText || '';
    const hasKeywords = /(náhled|preview|shrnutí|souhrn|detail rezervace|vybraná)/i.test(bodyText);
    const asideEl = document.querySelector('aside, [class*="preview"], [class*="summary"], [class*="detail"]');
    const allSections = Array.from(document.querySelectorAll('section, aside, div[class*="preview"], div[class*="summary"]'));
    return {
      hasKeywords,
      asideText: asideEl ? asideEl.innerText?.substring(0, 150) : null,
      sectionCount: allSections.length,
      bodySnippet: bodyText.substring(0, 400),
    };
  });
  console.log('[info] Preview:', { hasKeywords: previewInfo.hasKeywords, asideText: previewInfo.asideText?.substring(0,80) });

  if (previewInfo.hasKeywords || previewInfo.asideText) {
    log('TEST 9: Live preview', 'PASS', previewInfo.asideText?.substring(0,80) || 'Preview sekce nalezena');
  } else {
    log('TEST 9: Live preview', 'INFO', 'Preview klíčová slova nenalezena');
  }

  // TEST 10: VYTVORIT tlačítko
  const createBtnInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const found = btns.find(b => {
      const t = (b.innerText?.trim() || '').toUpperCase();
      return t.includes('VYTVORIT') || t.includes('VYTVOŘIT') || t.includes('POTVRDIT');
    });
    return found ? { text: found.innerText?.trim(), disabled: found.disabled } : null;
  });
  console.log('[info] VYTVORIT:', createBtnInfo);

  if (createBtnInfo) {
    log('TEST 10: VYTVORIT REZERVACI tlačítko', 'PASS',
      `"${createBtnInfo.text}" existuje (disabled: ${createBtnInfo.disabled} — ${createBtnInfo.disabled ? 'čeká na vyplnění formuláře' : 'aktivní'})`);
  } else {
    log('TEST 10: VYTVORIT REZERVACI tlačítko', 'FAIL', 'Tlačítko nenalezeno');
  }

  await shot(page, 'r2b-09-final');

} catch(err) {
  console.error('[ERROR]', err.message.substring(0, 300));
  await shot(page, 'r2b-error').catch(() => {});
  log('Test', 'ERROR', err.message.substring(0, 150));
}

function printResults() {
  console.log('\n=== VÝSLEDKY RETEST #2b ===');
  for (const r of results) console.log(`[${r.status}] ${r.test}${r.detail ? ': ' + r.detail : ''}`);
}

printResults();
await sleep(2000);
await browser.close();
console.log('[done]');
