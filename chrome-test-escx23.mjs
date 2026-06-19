import { chromium } from 'playwright';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  
  const results = [];

  // ======== TEST 1: Admin login + Rezervace ========
  console.log('\n=== TEST 1: Admin Rezervace ===');
  await page.goto('http://localhost:3000/cs/admin/login');
  await sleep(1500);
  
  // Fill login form
  try {
    await page.fill('input[type="email"], input[name="email"]', 'info@lovelygirls.cz');
    await page.fill('input[type="password"], input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await sleep(2000);
    console.log('Admin login submitted. Current URL:', page.url());
  } catch(e) {
    console.log('Login form error:', e.message);
  }
  
  // Navigate to rezervace
  await page.goto('http://localhost:3000/cs/admin/rezervace');
  await sleep(3000);
  
  const adminUrl = page.url();
  console.log('Admin Rezervace URL:', adminUrl);
  
  // Check if iframe is visible
  const iframeCount = await page.locator('iframe').count();
  console.log('iFrame count on rezervace page:', iframeCount);
  
  // Check iframe src
  const iframeSrc = iframeCount > 0 ? await page.locator('iframe').first().getAttribute('src') : 'none';
  console.log('iFrame src:', iframeSrc);
  
  // Check iframe visibility
  const iframeVisible = iframeCount > 0 ? await page.locator('iframe').first().isVisible() : false;
  console.log('iFrame visible:', iframeVisible);
  
  // Check for dark filter style
  const iframeStyle = iframeCount > 0 ? await page.locator('iframe').first().getAttribute('style') : '';
  console.log('iFrame style:', iframeStyle);
  
  // Check parent element for filter CSS
  const iframeParentFilter = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    if (!iframe) return 'no iframe';
    const parent = iframe.parentElement;
    const computed = window.getComputedStyle(iframe);
    return { 
      iframeFilter: computed.filter,
      parentFilter: window.getComputedStyle(parent).filter,
      iframeClass: iframe.className,
      parentClass: parent?.className
    };
  });
  console.log('Filter styles:', JSON.stringify(iframeParentFilter, null, 2));
  
  // Screenshot
  await page.screenshot({ path: '/tmp/admin-rezervace.png', fullPage: false });
  console.log('Screenshot: /tmp/admin-rezervace.png');
  
  const adminPass = adminUrl.includes('rezervace') && iframeVisible;
  results.push({ test: 'Admin Rezervace iframe', pass: adminPass, detail: `iframe count: ${iframeCount}, visible: ${iframeVisible}` });

  // ======== TEST 2: Studio login + Kalendář ========
  console.log('\n=== TEST 2: Studio Kalendář ===');
  
  // New tab
  const page2 = await ctx.newPage();
  await page2.goto('http://localhost:3000/cs/studio/login');
  await sleep(1500);
  
  try {
    await page2.fill('input[type="email"], input[name="email"]', 'lunamanazer@gmail.com');
    await page2.fill('input[type="password"], input[name="password"]', 'test123');
    await page2.click('button[type="submit"]');
    await sleep(2000);
    console.log('Studio login submitted. Current URL:', page2.url());
  } catch(e) {
    console.log('Studio login error:', e.message);
  }
  
  // Navigate to kalendar
  await page2.goto('http://localhost:3000/cs/studio/kalendar');
  await sleep(3000);
  
  const studioUrl = page2.url();
  console.log('Studio Kalendar URL:', studioUrl);
  
  // Check for legend
  const legendEl = await page2.locator('text=/legenda|legend/i').count();
  console.log('Legend elements found:', legendEl);
  
  // Check for coral/today styling
  const todayEl = await page2.evaluate(() => {
    // Look for elements with coral color or "today" class
    const allEls = document.querySelectorAll('*');
    let found = [];
    for (const el of allEls) {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      // Coral is approximately rgb(255, 127, 80) or similar warm coral
      if (bg && (bg.includes('255, 127') || bg.includes('255, 99') || bg.includes('250, 128') || bg.includes('233, 80'))) {
        found.push({ tag: el.tagName, class: el.className?.toString().slice(0, 50), bg });
      }
    }
    return found.slice(0, 5);
  });
  console.log('Coral-colored elements:', JSON.stringify(todayEl, null, 2));
  
  // Check for calendar grid cards
  const cardCount = await page2.locator('[class*="card"], [class*="day"], [class*="cal"]').count();
  console.log('Calendar card/day elements:', cardCount);
  
  // Screenshot
  await page2.screenshot({ path: '/tmp/studio-kalendar.png', fullPage: false });
  console.log('Screenshot: /tmp/studio-kalendar.png');
  
  const studioPass = studioUrl.includes('kalendar');
  results.push({ test: 'Studio Kalendar', pass: studioPass, detail: `URL: ${studioUrl}, legend: ${legendEl}` });
  
  // ======== SUMMARY ========
  console.log('\n=== VÝSLEDKY ===');
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'} — ${r.test}: ${r.detail}`);
  }
  
  // Keep browser open for 10 seconds so user can see it
  await sleep(10000);
  await browser.close();
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
