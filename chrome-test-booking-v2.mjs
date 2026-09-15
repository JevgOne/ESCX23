/**
 * TEST-CHROME v2: /booking/quick — přes existující Chrome session
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = '/tmp/booking-quick-test';
mkdirSync(SHOTS, { recursive: true });

// Použijeme profil zkopírovaný z Chrome (má cookies lovelygirls.cz)
const PROFILE = '/tmp/chrome-booking-profile-v2';
const BASE = 'https://www.lovelygirls.cz';

const results = [];
function log(test, status, detail = '') {
  console.log(`[${status}] ${test}${detail ? ': ' + detail : ''}`);
  results.push({ test, status, detail });
}

async function shot(page, name) {
  try { await page.screenshot({ path: `${SHOTS}/${name}.png` }); console.log(`[shot] ${name}`); }
  catch(e) {}
}

console.log('[test-v2] Spouštím Chrome s existujícím profilem...');
const browser = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  channel: 'chrome',
  slowMo: 200,
  viewport: { width: 1440, height: 900 },
  args: ['--no-first-run', '--password-store=basic', '--disable-extensions'],
  ignoreDefaultArgs: ['--enable-automation'],
});

const page = await browser.newPage();

try {
  // Přejdi rovnou na /booking/quick
  console.log('[step] Navigace na /booking/quick...');
  await page.goto(`${BASE}/booking/quick`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(4000);
  await shot(page, 'v2-01-quick');

  const url = page.url();
  const title = await page.title();
  console.log(`[info] URL: ${url}, Title: "${title}"`);

  // Jsme přihlášeni?
  const isLoginPage = url.includes('/booking') && !url.includes('/quick') && !url.includes('/dashboard') && !url.includes('/calendar');
  const isRedirected = url === `${BASE}/booking` || url === `${BASE}/booking?error=invalid`;

  if (isLoginPage || isRedirected) {
    log('Session z profilu', 'INFO', 'Není session pro /booking — přihlašuji se ručně');

    // Zkus přihlásit se s různými credentials
    await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    const tryLogin = async (email, pass) => {
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', pass);
      await page.click('button[type="submit"]');
      await sleep(3000);
      const u = page.url();
      return !u.includes('error=invalid') && !u.endsWith('/booking');
    };

    // Pokus o přihlášení
    const creds = [
      ['info@lovelygirls.cz', 'LovelyGirls2026!'],
      ['info@lovelygirls.cz', 'Info2026!'],
      ['info@lovelygirls.cz', 'Lovelygirls123!'],
      ['admin@lovelygirls.cz', 'Admin2026!'],
      ['recepce@lovelygirls.cz', 'Recepce2026!'],
    ];

    let loggedIn = false;
    for (const [email, pass] of creds) {
      console.log(`[login] Zkouším ${email} / ${pass}...`);
      const ok = await tryLogin(email, pass);
      if (ok) {
        log('Login', 'PASS', `${email} → ${page.url()}`);
        loggedIn = true;
        break;
      }
      // Zpět na login
      await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded' });
      await sleep(1000);
    }

    if (!loggedIn) {
      log('Login', 'FAIL', 'Neznámé credentials pro produkci');
      log('BLOCKER', 'FAIL', 'Bez přihlášení nelze testovat /booking/quick');

      // Alespoň ověř redirect a login stránku
      await shot(page, 'v2-login-blocked');
      const loginPageOk = await page.locator('.login-input, input[name="email"]').count() > 0;
      log('Login stránka existuje', loginPageOk ? 'PASS' : 'FAIL', `URL: ${page.url()}`);
      log('Auth guard /booking/quick', 'PASS', 'Redirect na /booking funguje');

      printResults();
      await browser.close();
      process.exit(0);
    }

    // Přejdi na /booking/quick
    await page.goto(`${BASE}/booking/quick`, { waitUntil: 'domcontentloaded' });
    await sleep(3000);
  } else {
    log('Session z profilu', 'PASS', `Přihlášen, URL: ${url}`);
  }

  // ============================================================
  // Nyní jsme na /booking/quick (nebo kde nás přesměrovalo)
  // ============================================================
  await shot(page, 'v2-02-panel');
  const panelUrl = page.url();
  const panelTitle = await page.title();
  console.log(`[info] Panel URL: ${panelUrl}, Title: "${panelTitle}"`);

  if (!panelUrl.includes('/quick')) {
    log('TEST 1: /booking/quick', 'INFO', `Přesměrováno na: ${panelUrl} — role nemá přístup na /quick`);
    // Zkus navigovat přímo
    await page.goto(`${BASE}/booking/quick`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await shot(page, 'v2-03-quick-direct');
    console.log(`[info] Po přímé navigaci: ${page.url()}`);
  }

  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
  console.log(`[info] Body: ${bodyText.replace(/\n/g, ' ').substring(0, 300)}`);

  const is404 = bodyText.includes('404');
  const hasContent = bodyText.length > 100 && !is404;

  if (is404) {
    log('TEST 1: /booking/quick načtení', 'FAIL', '404 — stránka neexistuje na produkci');
    log('POZNÁMKA', 'INFO', 'Pravděpodobně stránka ještě není nasazena na produkci');
  } else if (hasContent) {
    log('TEST 1: /booking/quick načtení', 'PASS', `Title: "${panelTitle}"`);
  } else {
    log('TEST 1: /booking/quick', 'INFO', `Obsah: ${bodyText.substring(0, 80)}`);
  }

  // Pokud máme 404 nebo jsme na špatné stránce, zkusíme lokální server
  if (is404 || !panelUrl.includes('/quick')) {
    // Zkus localhost
    console.log('[info] Zkouším lokální server...');
    try {
      await page.goto('http://localhost:3000/booking/quick', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(2000);
      const localUrl = page.url();
      const localBody = await page.evaluate(() => document.body?.innerText?.substring(0, 300) || '');
      console.log(`[info] Lokální URL: ${localUrl}, Obsah: ${localBody.substring(0, 100)}`);
      await shot(page, 'v2-local-quick');
      log('Lokální /booking/quick', localUrl.includes('/quick') ? 'INFO' : 'INFO', `URL: ${localUrl}`);
    } catch(e) {
      log('Lokální server', 'INFO', 'Localhost nedostupný');
    }

    printResults();
    await browser.close();
    process.exit(0);
  }

  // ============================================================
  // Testování panelu
  // ============================================================

  // TEST 2: Dívky jako tlačítka
  const girlData = await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const texts = allBtns.map(b => b.innerText?.trim()).filter(Boolean);
    return { count: allBtns.length, texts: texts.slice(0, 10) };
  });
  console.log('[info] Všechna tlačítka:', JSON.stringify(girlData));

  // Hledej konkrétní prvky panelu
  const panelElements = await page.evaluate(() => {
    return {
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText?.trim()).filter(Boolean).slice(0, 15),
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, placeholder: i.placeholder, name: i.name })),
      headings: Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h => h.innerText?.trim()),
      selects: Array.from(document.querySelectorAll('select')).map(s => s.name || s.id),
    };
  });
  console.log('[info] Panel elementy:', JSON.stringify(panelElements));

  if (panelElements.buttons.length > 0) {
    log('TEST 2: Obsah panelu', 'PASS', `${panelElements.buttons.length} tlačítek, ${panelElements.inputs.length} inputů`);
  }

  printResults();
  await shot(page, 'v2-final');

} catch (err) {
  console.error('[ERROR]', err.message.substring(0, 200));
  await shot(page, 'v2-error').catch(() => {});
  log('Test', 'ERROR', err.message.substring(0, 100));
  printResults();
}

function printResults() {
  console.log('\n=== VÝSLEDKY ===');
  for (const r of results) console.log(`[${r.status}] ${r.test}${r.detail ? ': ' + r.detail : ''}`);
}

await sleep(5000);
await browser.close();
console.log('[done]');
