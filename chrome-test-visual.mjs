import { chromium } from 'playwright';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // ======== TEST 1: Studio Kalendář ========
  console.log('\n=== STUDIO KALENDÁŘ ===');
  const page1 = await ctx.newPage();
  await page1.goto('http://localhost:3000/cs/studio/login');
  await sleep(1500);
  
  await page1.fill('input[type="email"]', 'lunamanazer@gmail.com');
  await page1.fill('input[type="password"]', 'test123');
  await page1.click('button[type="submit"]');
  await sleep(2500);
  
  await page1.goto('http://localhost:3000/cs/studio/kalendar');
  await sleep(3000);
  
  const studioUrl = page1.url();
  console.log('URL:', studioUrl);
  
  // Check legend
  const legendCount = await page1.locator('.cal-legend').count();
  const legendItems = await page1.locator('.cal-legend-item').count();
  console.log('Legend container:', legendCount, '| Legend items:', legendItems);
  
  // Check today card
  const todayCount = await page1.locator('.cal-day-today').count();
  console.log('Today card (.cal-day-today):', todayCount);
  
  // Check today border color
  const todayBorderColor = todayCount > 0 ? await page1.evaluate(() => {
    const el = document.querySelector('.cal-day-today');
    return el ? window.getComputedStyle(el).borderColor : 'none';
  }) : 'no today element';
  console.log('Today border color:', todayBorderColor);
  
  // Check hover transition exists
  const hasHoverTransition = await page1.evaluate(() => {
    const el = document.querySelector('.cal-day');
    return el ? window.getComputedStyle(el).transition : 'none';
  });
  console.log('Day card transition:', hasHoverTransition);
  
  // Cal-grid
  const gridDays = await page1.locator('.cal-day').count();
  console.log('Grid day cards (total):', gridDays);
  
  // Screenshot Studio
  await page1.screenshot({ path: '/tmp/studio-kalendar-full.png', fullPage: true });
  console.log('Screenshot saved: /tmp/studio-kalendar-full.png');
  
  await sleep(2000);

  // ======== TEST 2: Admin Rezervace ========
  console.log('\n=== ADMIN REZERVACE ===');
  const page2 = await ctx.newPage();
  await page2.goto('http://localhost:3000/cs/admin/login');
  await sleep(1500);
  
  await page2.fill('input[type="email"]', 'info@lovelygirls.cz');
  await page2.fill('input[type="password"]', 'test123');
  await page2.click('button[type="submit"]');
  await sleep(2500);
  
  await page2.goto('http://localhost:3000/cs/admin/rezervace');
  await sleep(3000);
  
  const adminUrl = page2.url();
  console.log('URL:', adminUrl);
  
  // Check iframe
  const iframeCount = await page2.locator('iframe').count();
  console.log('iFrame count:', iframeCount);
  
  // Check if calendars section exists (even without data)
  const calSection = await page2.evaluate(() => {
    // Look for text "Google Kalendáře" or similar
    const body = document.body.innerText;
    const hasCalText = body.includes('Google Kalendáře') || body.includes('Google Kalend');
    return { hasCalText, bodyText: body.slice(0, 500) };
  });
  console.log('Has Google Calendar text:', calSection.hasCalText);
  
  // Check if no-data message is shown (means calendar section is hidden due to no data)
  const noDataMsg = await page2.locator('text=Booking webhook integration').count();
  console.log('No bookings placeholder shown:', noDataMsg);
  
  // Check dark filter on iframe (if it exists)
  if (iframeCount > 0) {
    const filterStyle = await page2.evaluate(() => {
      const iframe = document.querySelector('iframe');
      return iframe ? window.getComputedStyle(iframe).filter : 'no iframe';
    });
    console.log('iFrame filter style:', filterStyle);
  } else {
    // Check in CSS if the class is defined
    const cssFilterDefined = await page2.evaluate(() => {
      // Check if .cal-google-iframe class has filter defined somewhere
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && rule.selectorText.includes('cal-google-iframe')) {
              return rule.cssText;
            }
          }
        } catch(e) {}
      }
      return 'not found in parsed CSS';
    });
    console.log('CSS .cal-google-iframe rule:', cssFilterDefined);
    
    // Check admin page has correct dark filter inline style (from page.tsx)
    const inlineFilterDefined = await page2.evaluate(() => {
      // admin/rezervace uses inline style on iframe, not class
      // Let's check the page source
      const html = document.documentElement.innerHTML;
      return html.includes('invert(1)') || html.includes('hue-rotate') ? 'YES - filter found in HTML' : 'NO - filter not in HTML';
    });
    console.log('Inline dark filter in admin page HTML:', inlineFilterDefined);
    
    console.log('NOTE: iframe not rendered — no girls have calendar_embed_url set in DB');
  }
  
  // Screenshot Admin
  await page2.screenshot({ path: '/tmp/admin-rezervace-full.png', fullPage: true });
  console.log('Screenshot saved: /tmp/admin-rezervace-full.png');
  
  // Keep browser visible
  await sleep(5000);
  await browser.close();
  
  console.log('\n=== SUMMARY ===');
  console.log(`Studio Kalendar: ${studioUrl.includes('kalendar') ? 'LOADED OK' : 'FAIL'}`);
  console.log(`Admin Rezervace: ${adminUrl.includes('rezervace') ? 'LOADED OK' : 'FAIL'}`);
  console.log(`Studio legend items: ${legendItems} (expected 3)`);
  console.log(`Studio today card: ${todayCount} (expected 1)`);
  console.log(`Admin iframe: ${iframeCount > 0 ? 'PRESENT' : 'ABSENT (no data in DB)'}`);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
