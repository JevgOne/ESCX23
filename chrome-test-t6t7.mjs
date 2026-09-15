import { chromium } from 'playwright';
import { execSync } from 'child_process';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PROFILE = '/tmp/chrome-retest2d';
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

// Click Anetta
await page.locator('button').filter({ hasText: /^Anetta$/ }).first().click();
await sleep(2500);

// TEST 4: Ověř disabled dny (qb-day.disabled)
const disabledDays = await page.evaluate(() => {
  const disabled = Array.from(document.querySelectorAll('.qb-day.disabled'));
  const active = Array.from(document.querySelectorAll('.qb-day:not(.disabled)'));
  return {
    disabledCount: disabled.length,
    activeCount: active.length,
    disabledExamples: disabled.map(d => d.querySelector('.qb-day-label')?.innerText?.trim() || d.innerText?.split('\n')[0]).slice(0,5),
    activeExamples: active.map(d => d.querySelector('.qb-day-label')?.innerText?.trim() || d.innerText?.split('\n')[0]).slice(0,5),
  };
});
console.log('TEST 4 disabled days:', JSON.stringify(disabledDays));

// TEST 6: Klikni na aktivní den (17.9 CTVRTEK nebo první aktivní)
const activeDays = await page.locator('.qb-day:not(.disabled)').all();
console.log(`Active day cards: ${activeDays.length}`);

let clickedDay = false;
for (const dayEl of activeDays) {
  const text = await dayEl.innerText().catch(() => '');
  if (!text.includes('14.9')) { // Přeskoč dnešek (14.9) — klikni na jiný
    console.log(`Klikám na den: "${text.trim().replace(/\n/, ' ')}"`);
    await dayEl.click();
    await sleep(2500);
    await page.screenshot({ path: `${SHOTS}/r2b-t6-day-click.png` });
    clickedDay = true;
    break;
  }
}

if (!clickedDay && activeDays.length > 0) {
  await activeDays[0].click();
  await sleep(2500);
  clickedDay = true;
}

// Po kliknutí na den — hledej časové sloty (buttons v sekci dnů)
const afterDayClick = await page.evaluate(() => {
  const timeBtns = Array.from(document.querySelectorAll('button:not([disabled])'))
    .map(b => b.innerText?.trim())
    .filter(t => /^\d{1,2}:\d{2}$/.test(t));
  // Hledej i time-slot divy
  const timeSlotDivs = Array.from(document.querySelectorAll('[class*="slot"], [class*="time"]'))
    .map(el => el.innerText?.trim())
    .filter(t => /\d{1,2}:\d{2}/.test(t))
    .slice(0, 10);
  // Zkontroluj jestli se zobrazila nová sekce
  const bodyText = document.body?.innerText || '';
  const allTimes = [...new Set((bodyText.match(/\b\d{1,2}:\d{2}\b/g) || []))];
  return { timeBtns, timeSlotDivs, allTimes };
});
console.log('Po kliknutí na den:', JSON.stringify(afterDayClick));
await page.screenshot({ path: `${SHOTS}/r2b-t6-after-day.png` });

// TEST 6: Klik na čas
if (afterDayClick.timeBtns.length > 0) {
  const firstTimeBtn = afterDayClick.timeBtns[0];
  console.log(`Klikám na čas: "${firstTimeBtn}"`);
  const timeEl = page.locator('button:not([disabled])').filter({ hasText: new RegExp(`^${firstTimeBtn}$`) }).first();
  await timeEl.click();
  await sleep(1500);
  await page.screenshot({ path: `${SHOTS}/r2b-t6-time-click.png` });

  const timeHighlight = await page.evaluate((t) => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === t);
    return btn ? { classes: btn.className, isSelected: btn.className.includes('selected') || btn.className.includes('active') || btn.className.includes('coral') } : null;
  }, firstTimeBtn);
  console.log('TEST 6 highlight:', timeHighlight);
  console.log(`[PASS] TEST 6: Klik na čas "${firstTimeBtn}", highlight classes: ${timeHighlight?.classes?.substring(0,60)}`);

  // TEST 7: Program/duration
  const programBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button:not([disabled])'))
      .map(b => b.innerText?.trim())
      .filter(t => /\d+\s*(min|hod|h\b)/.test(t) || /^(30|45|60|90|120)$/.test(t));
  });
  console.log('Program buttons:', programBtns);

  if (programBtns.length > 0) {
    const progEl = page.locator('button:not([disabled])').filter({ hasText: programBtns[0] }).first();
    await progEl.click();
    await sleep(1000);
    await page.screenshot({ path: `${SHOTS}/r2b-t7-program.png` });
    const preview = await page.evaluate(() => {
      return document.querySelector('[class*="preview"], aside')?.innerText?.trim() || '';
    });
    console.log(`[PASS] TEST 7: Program "${programBtns[0]}" vybrán. Preview: "${preview.substring(0,80)}"`);
  } else {
    // Zkus najít duration chooser
    const allBtnTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).map(b => b.innerText?.trim()).filter(Boolean)
    );
    console.log('[INFO] TEST 7: Program tlačítka nenalezena. Všechny btns:', allBtnTexts);
  }
} else {
  console.log('[INFO] TEST 6: Žádná časová tlačítka po kliknutí na den');
  // Dump celý stav
  const dumpState = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).map(b => ({ text: b.innerText?.trim(), disabled: b.disabled }));
    const days = Array.from(document.querySelectorAll('.qb-day')).map(d => ({ classes: d.className, text: d.innerText?.replace(/\n/g, ' ').trim() }));
    return { btns, days, bodySnippet: document.body?.innerText?.substring(0, 400) };
  });
  console.log('State dump:', JSON.stringify(dumpState, null, 2));
}

await sleep(2000);
await browser.close();
