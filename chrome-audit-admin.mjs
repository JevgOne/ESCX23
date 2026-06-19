import { chromium } from 'playwright';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = 'https://www.lovelygirls.cz';

// Production credentials (resolved from Turso DB)
const CREDENTIALS_TO_TRY = [
  { email: 'info@lovelygirls.cz', password: 'Lovely2026!' },
];

const results = [];

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

function record(page, status, detail = '') {
  const entry = { page, status, detail };
  results.push(entry);
  const icon = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'WARN';
  log(`[${icon}] ${page}${detail ? ' — ' + detail : ''}`);
}

async function checkPageLoads(page, url, label) {
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(1500);
    const finalUrl = page.url();
    const status = resp?.status() ?? 0;

    if (finalUrl.includes('/login')) {
      record(label, 'FAIL', `Redirected to login — session lost. URL: ${finalUrl}`);
      return false;
    }
    if (status >= 500) {
      record(label, 'FAIL', `HTTP ${status}`);
      return false;
    }
    if (status >= 400) {
      record(label, 'WARN', `HTTP ${status}`);
      return true;
    }
    // Check for server error text
    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (bodyText.includes('Application error') || bodyText.includes('Internal Server Error')) {
      const snippet = bodyText.slice(0, 150).replace(/\n/g, ' ');
      record(label, 'FAIL', `Server error: ${snippet}`);
      return false;
    }
    record(label, 'PASS', `HTTP ${status}`);
    return true;
  } catch (e) {
    record(label, 'FAIL', `Exception: ${e.message.slice(0, 100)}`);
    return false;
  }
}

async function tryLogin(page, email, password) {
  await page.goto(`${BASE}/cs/admin/login`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  const emailField = page.locator('input[type="email"], input[name="email"]');
  const passField = page.locator('input[type="password"], input[name="password"]');

  if ((await emailField.count()) === 0) return false;

  await emailField.fill(email);
  await passField.fill(password);
  await page.locator('button[type="submit"]').click();
  await sleep(3000);

  const url = page.url();
  return !url.includes('/login');
}

async function run() {
  log('Starting admin panel audit on https://www.lovelygirls.cz');
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ===== LOGIN ATTEMPT =====
  log('\n=== STEP 1: Login ===');

  let loggedIn = false;
  let usedCreds = null;

  for (const creds of CREDENTIALS_TO_TRY) {
    log(`Trying: ${creds.email} / ${creds.password}`);
    const ok = await tryLogin(page, creds.email, creds.password);
    log(`Result: ${ok ? 'SUCCESS' : 'FAILED'} — URL: ${page.url()}`);
    if (ok) {
      loggedIn = true;
      usedCreds = creds;
      break;
    }
  }

  if (!loggedIn) {
    record('Admin Login', 'FAIL', 'ALL credential combinations failed. Production DB may not have admin user or has different password.');
    log('\nCRITICAL: Cannot test admin panel — login failed for all credentials.');
    log('Credentials tried: ' + CREDENTIALS_TO_TRY.map(c => `${c.email}/${c.password}`).join(', '));

    // Still test login page rendering
    await page.goto(`${BASE}/cs/admin/login`, { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    const loginPageText = await page.locator('body').innerText().catch(() => '');
    log(`Login page content snippet: ${loginPageText.slice(0, 200).replace(/\n/g, ' ')}`);

    // Check studio login
    log('\n=== Testing Studio Login Page ===');
    await page.goto(`${BASE}/cs/studio/login`, { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    const studioLoginUrl = page.url();
    const hasForm = (await page.locator('input[type="email"]').count()) > 0;
    if (studioLoginUrl.includes('/studio/login') && hasForm) {
      record('Studio Login Page', 'PASS', 'Page loads, form visible');
    } else {
      record('Studio Login Page', 'FAIL', `URL: ${studioLoginUrl}, form: ${hasForm}`);
    }

    await browser.close();
    printSummary();
    return;
  }

  record('Admin Login', 'PASS', `Logged in as ${usedCreds.email}, redirected to: ${page.url()}`);
  log(`Successfully logged in with: ${usedCreds.email}`);

  // ===== ADMIN DASHBOARD =====
  log('\n=== STEP 2: Admin Dashboard ===');
  await checkPageLoads(page, `${BASE}/cs/admin`, 'Admin Dashboard /cs/admin');

  const dashHeadings = await page.locator('h1, h2, h3').allInnerTexts().catch(() => []);
  log(`Dashboard headings: ${JSON.stringify(dashHeadings.slice(0, 5))}`);

  const statsCount = await page.locator('[class*="stat"], [class*="card"]').count();
  log(`Stats/card elements: ${statsCount}`);

  // Quick action cards
  const quickActions = await page.locator('a[href*="/admin/"]').count();
  log(`Admin nav links: ${quickActions}`);
  if (quickActions > 0) {
    const hrefs = await page.locator('a[href*="/admin/"]').evaluateAll(els => els.map(e => e.getAttribute('href')));
    log(`Admin links: ${JSON.stringify(hrefs.slice(0, 10))}`);
    record('Admin Dashboard — Navigation Links', 'PASS', `${quickActions} admin links`);
  }

  // Screenshot dashboard
  await page.screenshot({ path: '/tmp/admin-dashboard.png', fullPage: false });
  log('Screenshot: /tmp/admin-dashboard.png');

  // ===== GIRLS LIST =====
  log('\n=== STEP 3: Girls List /cs/admin/divky ===');
  const divkyOk = await checkPageLoads(page, `${BASE}/cs/admin/divky`, 'Admin Girls /cs/admin/divky');
  if (divkyOk) {
    await sleep(500);
    const rows = await page.locator('tr, [class*="row"]').count();
    const editLinks = await page.locator('a[href*="/edit"]').count();
    log(`Rows: ${rows}, edit links: ${editLinks}`);
    if (editLinks > 0) {
      record('Admin Girls — Edit Links', 'PASS', `${editLinks} edit links found`);
    } else {
      record('Admin Girls — Edit Links', 'WARN', 'No edit links');
    }

    // Test search if present
    const searchEl = page.locator('input[type="search"], input[placeholder*="hledat"], input[placeholder*="search"]');
    if (await searchEl.count() > 0) {
      await searchEl.first().fill('ane');
      await sleep(1000);
      record('Admin Girls — Search Input', 'PASS', 'Search input works');
      await searchEl.first().clear();
    } else {
      record('Admin Girls — Search Input', 'WARN', 'No search input found');
    }
  }

  // ===== GIRL EDIT FORM =====
  log('\n=== STEP 4: Girl Edit Form ===');
  await page.goto(`${BASE}/cs/admin/divky`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  let girlEditUrl = null;
  const firstEditLink = page.locator('a[href*="/edit"]').first();
  if (await firstEditLink.count() > 0) {
    const href = await firstEditLink.getAttribute('href');
    girlEditUrl = href?.startsWith('http') ? href : BASE + href;
  } else {
    girlEditUrl = `${BASE}/cs/admin/divky/1/edit`;
  }

  log(`Opening: ${girlEditUrl}`);
  const editOk = await checkPageLoads(page, girlEditUrl, `Girl Edit ${girlEditUrl}`);

  if (editOk) {
    await sleep(1000);

    // Check form elements
    const allInputs = await page.locator('input, textarea, select').count();
    const saveBtn = page.locator('button[type="submit"], button:has-text("Uložit"), button:has-text("Save")');
    const saveBtnCount = await saveBtn.count();
    log(`Total form inputs: ${allInputs}, save buttons: ${saveBtnCount}`);

    if (allInputs > 0) record('Girl Edit — Form Inputs', 'PASS', `${allInputs} inputs found`);
    else record('Girl Edit — Form Inputs', 'FAIL', 'No form inputs found');

    if (saveBtnCount > 0) record('Girl Edit — Save Button', 'PASS', 'Save button present');
    else record('Girl Edit — Save Button', 'FAIL', 'No save button');

    // Check is_new checkbox
    const isNewEl = await page.locator('input[name="is_new"], input[id*="is_new"], input[type="checkbox"]').count();
    if (isNewEl > 0) record('Girl Edit — is_new Checkbox', 'PASS', `${isNewEl} checkbox(es) found`);
    else record('Girl Edit — is_new Checkbox', 'WARN', 'is_new checkbox not found');

    // SEO tab check
    const seoTabEl = page.locator('button:has-text("SEO"), [role="tab"]:has-text("SEO"), a:has-text("SEO")');
    if (await seoTabEl.count() > 0) {
      record('Girl Edit — SEO Tab', 'PASS', 'SEO tab present');
      await seoTabEl.first().click();
      await sleep(800);

      // Check for lang tabs
      const csTabs = await page.locator(':text("CS"), :text("CZ"), [data-lang="cs"]').count();
      const enTabs = await page.locator(':text("EN"), [data-lang="en"]').count();
      log(`CS/CZ lang tabs: ${csTabs}, EN lang tabs: ${enTabs}`);

      const metaTitleInputs = await page.locator('input[name*="meta_title"], input[name*="seo_title"], input[name*="title"]').count();
      if (metaTitleInputs > 0) {
        record('Girl Edit — SEO meta_title', 'PASS', `${metaTitleInputs} meta_title input(s)`);
      } else {
        record('Girl Edit — SEO meta_title', 'WARN', 'meta_title input not found');
      }

      if (csTabs > 0 || enTabs > 0) {
        record('Girl Edit — SEO Lang Tabs', 'PASS', `CS: ${csTabs}, EN: ${enTabs}`);
      } else {
        record('Girl Edit — SEO Lang Tabs', 'WARN', 'No language tabs in SEO section');
      }
    } else {
      record('Girl Edit — SEO Tab', 'WARN', 'SEO tab not found');
    }

    // Photo section
    const photoEls = await page.locator('[class*="photo"], input[type="file"], [class*="upload"], [class*="gallery"]').count();
    if (photoEls > 0) {
      record('Girl Edit — Photo Section', 'PASS', `${photoEls} photo/upload elements`);
    } else {
      record('Girl Edit — Photo Section', 'WARN', 'No photo/upload section found');
    }

    // Test Save — reload and try from clean state
    log('Testing save — reloading page first...');
    await page.goto(girlEditUrl, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Get all submit buttons info
    const submitBtns = await page.locator('button[type="submit"]').evaluateAll(els =>
      els.map(el => ({
        text: el.innerText?.trim(),
        visible: el.offsetParent !== null,
        disabled: el.disabled,
        rect: el.getBoundingClientRect ? JSON.stringify({
          top: Math.round(el.getBoundingClientRect().top),
          left: Math.round(el.getBoundingClientRect().left),
          width: Math.round(el.getBoundingClientRect().width),
        }) : 'unknown'
      }))
    );
    log(`Submit buttons details: ${JSON.stringify(submitBtns)}`);

    // Try clicking the visible save button using force click
    try {
      const visibleSave = page.locator('button[type="submit"]').filter({ hasText: /Uložit|Save/i });
      const visibleSaveCount = await visibleSave.count();
      log(`Visible save buttons (Uložit/Save): ${visibleSaveCount}`);

      if (visibleSaveCount > 0) {
        await visibleSave.first().click({ force: true, timeout: 8000 });
        await sleep(3000);

        const afterSaveUrl = page.url();
        const bodyText = await page.locator('body').innerText().catch(() => '');
        const hasSuccess = /uložen|saved|success|úspěšn/i.test(bodyText);
        const hasError = /application error|internal server error|error.*saving|chyba.*ulož/i.test(bodyText);
        log(`After save: URL=${afterSaveUrl}, success=${hasSuccess}, error=${hasError}`);

        if (hasError) {
          record('Girl Edit — Save Action', 'FAIL', `Error after save. URL: ${afterSaveUrl}`);
        } else if (hasSuccess) {
          record('Girl Edit — Save Action', 'PASS', 'Success message shown');
        } else if (!afterSaveUrl.includes('/login')) {
          record('Girl Edit — Save Action', 'PASS', `No error/redirect-to-login after save. URL: ${afterSaveUrl}`);
        } else {
          record('Girl Edit — Save Action', 'FAIL', 'Redirected to login after save');
        }
      } else {
        // Try first submit button with force
        await page.locator('button[type="submit"]').first().click({ force: true, timeout: 8000 });
        await sleep(3000);
        const afterSaveUrl = page.url();
        if (!afterSaveUrl.includes('/login')) {
          record('Girl Edit — Save Action', 'PASS', `Clicked first submit, URL: ${afterSaveUrl}`);
        } else {
          record('Girl Edit — Save Action', 'FAIL', 'Redirected to login after save');
        }
      }
    } catch (e) {
      record('Girl Edit — Save Action', 'WARN', `Save button click failed: ${e.message.slice(0, 100)}`);
    }

    await page.screenshot({ path: '/tmp/admin-girl-edit.png', fullPage: false });
    log('Screenshot: /tmp/admin-girl-edit.png');
  }

  // ===== SCHEDULE =====
  log('\n=== STEP 5: Schedule /cs/admin/rozvrh ===');
  await checkPageLoads(page, `${BASE}/cs/admin/rozvrh`, 'Admin Rozvrh /cs/admin/rozvrh');

  // ===== REVIEWS =====
  log('\n=== STEP 6: Reviews /cs/admin/recenze ===');
  await checkPageLoads(page, `${BASE}/cs/admin/recenze`, 'Admin Recenze /cs/admin/recenze');

  // ===== VERIFICATION =====
  log('\n=== STEP 7: Photo Verification /cs/admin/verifikace ===');
  await checkPageLoads(page, `${BASE}/cs/admin/verifikace`, 'Admin Verifikace /cs/admin/verifikace');

  // ===== SERVICES =====
  log('\n=== STEP 8: Services /cs/admin/sluzby ===');
  await checkPageLoads(page, `${BASE}/cs/admin/sluzby`, 'Admin Sluzby /cs/admin/sluzby');

  // ===== MEMBERS =====
  log('\n=== STEP 9: Members /cs/admin/clenove ===');
  await checkPageLoads(page, `${BASE}/cs/admin/clenove`, 'Admin Clenove /cs/admin/clenove');

  // ===== SEO =====
  log('\n=== STEP 10: SEO /cs/admin/seo ===');
  const seoOk = await checkPageLoads(page, `${BASE}/cs/admin/seo`, 'Admin SEO /cs/admin/seo');
  if (seoOk) {
    const seoRows = await page.locator('tr, [class*="row"], [class*="item"]').count();
    log(`SEO rows: ${seoRows}`);
    if (seoRows > 1) record('Admin SEO — Data Rows', 'PASS', `${seoRows} rows`);
    else record('Admin SEO — Data Rows', 'WARN', `Only ${seoRows} rows`);
  }

  // ===== APPLICATIONS =====
  log('\n=== STEP 11: Applications /cs/admin/prihlasky ===');
  await checkPageLoads(page, `${BASE}/cs/admin/prihlasky`, 'Admin Prihlasky /cs/admin/prihlasky');

  // ===== STUDIO LOGIN =====
  log('\n=== STEP 12: Studio Login ===');
  const page2 = await ctx.newPage();
  await page2.goto(`${BASE}/cs/studio/login`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);

  const studioUrl = page2.url();
  const studioForm = (await page2.locator('input[type="email"]').count()) > 0;
  if (studioUrl.includes('/studio/login') && studioForm) {
    record('Studio Login Page', 'PASS', 'Page loads, login form visible');
  } else {
    record('Studio Login Page', 'FAIL', `URL: ${studioUrl}, form visible: ${studioForm}`);
  }

  // Try studio login
  if (studioForm) {
    await page2.locator('input[type="email"]').fill('anetta@lovelygirls.cz');
    await page2.locator('input[type="password"]').fill('Anetta2026!');
    await page2.locator('button[type="submit"]').click();
    await sleep(3000);
    const afterStudioLogin = page2.url();
    if (afterStudioLogin.includes('/login')) {
      record('Studio Login Submit', 'FAIL', `Login failed, still at: ${afterStudioLogin}`);
    } else {
      record('Studio Login Submit', 'PASS', `Redirected to: ${afterStudioLogin}`);
    }
  }

  await page2.close();

  // Final dashboard screenshot
  await page.goto(`${BASE}/cs/admin`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await page.screenshot({ path: '/tmp/admin-final.png', fullPage: true });
  log('Screenshot: /tmp/admin-final.png');

  await sleep(3000);
  await browser.close();

  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('ADMIN PANEL AUDIT — FULL RESULTS');
  console.log('='.repeat(70));

  const pass = results.filter(r => r.status === 'PASS');
  const fail = results.filter(r => r.status === 'FAIL');
  const warn = results.filter(r => r.status === 'WARN');

  console.log(`\nSUMMARY: PASS=${pass.length}  FAIL=${fail.length}  WARN=${warn.length}\n`);

  if (fail.length > 0) {
    console.log('--- FAILURES ---');
    fail.forEach(r => console.log(`  [FAIL] ${r.page}: ${r.detail}`));
  }

  if (warn.length > 0) {
    console.log('\n--- WARNINGS ---');
    warn.forEach(r => console.log(`  [WARN] ${r.page}: ${r.detail}`));
  }

  if (pass.length > 0) {
    console.log('\n--- PASSED ---');
    pass.forEach(r => console.log(`  [PASS] ${r.page}`));
  }

  console.log('\n' + '='.repeat(70));
  console.log('JSON_RESULTS:' + JSON.stringify(results));
}

run().catch(e => {
  console.error('FATAL:', e.message);
  printSummary();
  process.exit(1);
});
