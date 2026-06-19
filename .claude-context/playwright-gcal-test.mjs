import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

const test = async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  // ── STEP 1: Login as admin ──
  console.log('\n[1] Logging in as admin...');
  await page.goto(`${BASE}/cs/admin/login`);
  await page.fill('input[name="email"]', 'info@lovelygirls.cz');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/cs/admin`, { timeout: 8000 }).catch(() => {});
  const currentUrl = page.url();
  const loggedIn = currentUrl.includes('/admin') && !currentUrl.includes('login');
  console.log(`Login result: ${loggedIn ? 'SUCCESS' : 'FAILED'} — URL: ${currentUrl}`);
  results.push({ test: 'Admin login', pass: loggedIn, note: currentUrl });

  if (!loggedIn) {
    console.log('Cannot continue without login');
    await browser.close();
    return results;
  }

  // ── STEP 2: Navigate to /cs/admin/rezervace ──
  console.log('\n[2] Opening /cs/admin/rezervace...');
  await page.goto(`${BASE}/cs/admin/rezervace`);
  await page.waitForLoadState('networkidle');

  // Check: list of girls visible?
  const girlCards = await page.$$('.bg-card, [style*="background: var(--color-bg-card)"]');
  const gcalSection = await page.$('text=Google Kalendáře dívek');
  const girlCount = girlCards.length;
  console.log(`GCal section found: ${!!gcalSection}`);
  console.log(`Girl card count (via CSS): ${girlCount}`);

  // Alternative: check for girl names in the GCal section
  const allText = await page.textContent('body');
  const hasGCalSection = allText?.includes('Google Kalendáře dívek') || allText?.includes('Google Kalen');
  const hasPropojit = allText?.includes('Propojit GCal');
  const hasOdpojit = allText?.includes('Odpojit');

  console.log(`"Google Kalendáře dívek" heading: ${hasGCalSection}`);
  console.log(`"Propojit GCal" button present: ${hasPropojit}`);
  console.log(`"Odpojit" button present (connected girl): ${hasOdpojit}`);

  results.push({
    test: 'Admin Rezervace — GCal section heading',
    pass: !!hasGCalSection,
    note: hasGCalSection ? 'Section visible' : 'Section NOT found'
  });
  results.push({
    test: 'Admin Rezervace — Propojit GCal button',
    pass: !!hasPropojit,
    note: hasPropojit ? 'Button visible for unconnected girls' : 'No Propojit button found'
  });

  // Check: click Propojit GCal on first unconnected girl → should redirect to Google OAuth
  if (hasPropojit) {
    console.log('\n[3] Clicking Propojit GCal...');
    // Find the first Propojit GCal link
    const propojitLink = await page.$('a[href*="/api/gcal/auth"]');
    if (propojitLink) {
      const href = await propojitLink.getAttribute('href');
      console.log(`Propojit link href: ${href}`);

      // Navigate in the SAME page (so cookies are preserved), then come back
      const prevUrl = page.url();
      // Use the same page to carry the session cookie
      await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' });
      const authUrl = page.url();
      console.log(`After clicking Propojit GCal → URL: ${authUrl}`);
      const isGoogleAuth = authUrl.includes('accounts.google.com') || authUrl.includes('oauth2.googleapis');
      const isLoginRedirect = authUrl.includes('/admin/login');
      console.log(`  → Google OAuth redirect: ${isGoogleAuth}`);
      console.log(`  → Redirected to login (unexpected): ${isLoginRedirect}`);

      results.push({
        test: 'Propojit GCal — OAuth redirect to Google',
        pass: isGoogleAuth,
        note: `URL: ${authUrl.slice(0, 120)}`
      });

      // Go back to rezervace for subsequent tests
      await page.goto(`${BASE}/cs/admin/rezervace`);
      await page.waitForLoadState('networkidle');
    } else {
      console.log('Could not find anchor with href /api/gcal/auth');
      results.push({
        test: 'Propojit GCal — OAuth redirect to Google',
        pass: false,
        note: 'Could not find propojit link element'
      });
    }
  }

  // ── STEP 3: Studio Kalendar ──
  console.log('\n[4] Testing /cs/studio/kalendar...');

  // First login as a girl
  await page.goto(`${BASE}/cs/studio/login`);
  await page.waitForLoadState('networkidle');
  const studioLoginUrl = page.url();
  console.log(`Studio login URL: ${studioLoginUrl}`);

  // Fill studio login
  await page.fill('input[name="email"]', 'lunamanazer@gmail.com');
  await page.fill('input[name="password"]', 'test123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/cs/studio`, { timeout: 8000 }).catch(() => {});
  const studioUrl = page.url();
  const studioLoggedIn = studioUrl.includes('/studio') && !studioUrl.includes('login');
  console.log(`Studio login: ${studioLoggedIn ? 'SUCCESS' : 'FAILED'} — URL: ${studioUrl}`);
  results.push({ test: 'Studio login as girl', pass: studioLoggedIn, note: studioUrl });

  if (studioLoggedIn) {
    await page.goto(`${BASE}/cs/studio/kalendar`);
    await page.waitForLoadState('networkidle');

    const kalendarText = await page.textContent('body');
    const hasCalGrid = kalendarText?.includes('Pracuji') || kalendarText?.includes('Volno') || kalendarText?.includes('Kalendář');
    const hasConnectBtn = kalendarText?.includes('Propojit') || kalendarText?.includes('Connect');
    const hasDisconnectBtn = kalendarText?.includes('Odpojit') || kalendarText?.includes('Disconnect');
    const hasGCalSection = kalendarText?.includes('Google Kalendář');
    const hasReadOnly = !hasConnectBtn && !hasDisconnectBtn;

    console.log(`Cal grid visible (Pracuji/Volno/Kalendář): ${hasCalGrid}`);
    console.log(`Has Connect/Propojit button: ${hasConnectBtn}`);
    console.log(`Has Disconnect/Odpojit button: ${hasDisconnectBtn}`);
    console.log(`Read-only (no connect/disconnect): ${hasReadOnly}`);
    console.log(`Google Calendar section: ${hasGCalSection}`);

    results.push({
      test: 'Studio Kalendar — calendar grid renders',
      pass: !!hasCalGrid,
      note: hasCalGrid ? 'Grid visible' : 'Grid NOT found'
    });
    results.push({
      test: 'Studio Kalendar — NO connect/disconnect button',
      pass: hasReadOnly,
      note: hasConnectBtn
        ? 'FAIL: Found "Propojit" button — should NOT be here'
        : hasDisconnectBtn
        ? 'FAIL: Found "Odpojit" button — should NOT be here'
        : 'PASS: No connect/disconnect button'
    });
  }

  await browser.close();
  return results;
};

test().then((results) => {
  console.log('\n\n══════════════════════════════');
  console.log('GCAL CHROME TEST RESULTS');
  console.log('══════════════════════════════');
  let allPass = true;
  for (const r of results) {
    const icon = r.pass ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${r.test}`);
    if (r.note) console.log(`       Note: ${r.note}`);
    if (!r.pass) allPass = false;
  }
  console.log('──────────────────────────────');
  console.log(`OVERALL: ${allPass ? 'ALL PASS' : 'SOME FAILED'}`);
  process.exit(allPass ? 0 : 1);
}).catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
