import { chromium } from 'playwright';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  console.log('\n=== CHECKING lovelygirls.cz/cs homepage ===');
  await page.goto('https://www.lovelygirls.cz/cs', { waitUntil: 'networkidle' });
  await sleep(3000);

  // 1. Check for .featured-new element
  const featuredNewCount = await page.locator('.featured-new').count();
  console.log('1. .featured-new elements found:', featuredNewCount);

  // 2. Check any element with "NOVÁ" text or badge
  const novaBadgeCount = await page.locator('text=NOVÁ').count();
  const novaAltCount = await page.locator('text=NOVA').count();
  console.log('2. "NOVÁ" text elements found:', novaBadgeCount);
  console.log('2b. "NOVA" text elements found:', novaAltCount);

  // 3. Check for "Nově na webu" heading
  const headingCount = await page.locator('text=Nově na webu').count();
  console.log('3. "Nově na webu" heading found:', headingCount);

  // 4. Check for "Kim" name
  const kimCount = await page.locator('text=Kim').count();
  console.log('4. "Kim" name found:', kimCount);

  // 5. Broader check - any section/div with "new" in class containing a girl name
  const sectionInfo = await page.evaluate(() => {
    // Look for featured-new or similar
    const selectors = [
      '.featured-new',
      '[class*="featured-new"]',
      '[class*="new-girl"]',
      '[class*="nova"]',
      '[class*="nová"]',
      '[class*="new"]',
    ];
    const results = {};
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        results[sel] = {
          count: els.length,
          html: Array.from(els).slice(0, 2).map(el => el.outerHTML.slice(0, 300))
        };
      }
    }
    return results;
  });
  console.log('5. Elements with "new" related classes:', JSON.stringify(sectionInfo, null, 2));

  // 6. Check full page text for "Nově" and "NOVÁ"
  const pageText = await page.evaluate(() => document.body.innerText);
  const hasNoveNaWebu = pageText.includes('Nově na webu');
  const hasNova = pageText.includes('NOVÁ') || pageText.includes('Nová') || pageText.includes('NOVA');
  console.log('6. Page text includes "Nově na webu":', hasNoveNaWebu);
  console.log('6b. Page text includes NOVÁ/Nová/NOVA:', hasNova);

  // 7. Check what sections exist after hero
  const mainSections = await page.evaluate(() => {
    const sections = document.querySelectorAll('section, .section, main > div, main > section');
    return Array.from(sections).slice(0, 10).map(el => ({
      tag: el.tagName,
      className: el.className.slice(0, 100),
      id: el.id,
      firstText: el.innerText?.slice(0, 80)
    }));
  });
  console.log('7. Main page sections:', JSON.stringify(mainSections, null, 2));

  // 8. Screenshot
  await page.screenshot({ path: '/tmp/lovelygirls-homepage.png', fullPage: false });
  console.log('8. Screenshot saved: /tmp/lovelygirls-homepage.png');

  // 9. Full page screenshot
  await page.screenshot({ path: '/tmp/lovelygirls-homepage-full.png', fullPage: true });
  console.log('9. Full page screenshot saved: /tmp/lovelygirls-homepage-full.png');

  // 10. Scroll down to see section below hero
  await page.evaluate(() => window.scrollBy(0, 800));
  await sleep(1500);
  await page.screenshot({ path: '/tmp/lovelygirls-below-hero.png' });
  console.log('10. Below-hero screenshot saved: /tmp/lovelygirls-below-hero.png');

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`.featured-new present: ${featuredNewCount > 0 ? 'YES' : 'NO'}`);
  console.log(`"Nově na webu" heading: ${headingCount > 0 ? 'YES' : 'NO'}`);
  console.log(`"NOVÁ" badge: ${novaBadgeCount > 0 ? 'YES' : 'NO'}`);
  console.log(`"Kim" name: ${kimCount > 0 ? 'YES' : 'NO'}`);

  await sleep(4000);
  await browser.close();
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
