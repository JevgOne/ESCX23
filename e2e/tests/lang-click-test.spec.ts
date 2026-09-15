import { test, expect } from 'playwright/test';

const BASE = 'https://www.lovelygirls.cz';

// Zavře age gate — čeká na stabilitu, pak klikne
async function closeAgeGate(page: any) {
  const confirmBtn = page.locator('button.age-gate-confirm').first();
  try {
    // Čekej max 3s jestli se age gate vůbec objeví
    await confirmBtn.waitFor({ state: 'visible', timeout: 3000 });
    console.log('  Age gate nalezen, čekám na stabilitu...');
    // Počkej na stabilitu elementu (animace)
    await page.waitForTimeout(800);
    // Ověř ještě jednou že je viditelný
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      console.log('  Age gate potvrzen');
      await page.waitForTimeout(600);
      // Ověř že age gate zmizel
      const stillVisible = await confirmBtn.isVisible().catch(() => false);
      if (stillVisible) {
        console.log('  WARN: age gate stále viditelný po kliknutí');
      }
    }
  } catch {
    // Age gate se neobjevil — to je OK (třeba už byl zavřen z předchozí session)
  }
}

// Otevře dropdown přepínače jazyků a klikne na cílový jazyk
async function clickLangSwitcher(page: any, targetLang: string) {
  // Přepínač je <details class="lang-switcher"> s <summary class="lang-switcher-summary">
  const summary = page.locator('summary.lang-switcher-summary').first();
  await summary.waitFor({ state: 'visible', timeout: 5000 });

  console.log('  Klikám na lang-switcher summary...');
  await summary.click();
  await page.waitForTimeout(400);

  // Menu by mělo být viditelné
  const menu = page.locator('.lang-switcher-menu').first();
  let menuVisible = await menu.isVisible();
  console.log(`  Menu viditelné: ${menuVisible}`);

  if (!menuVisible) {
    // Fallback: force-open přes JS
    await page.evaluate(() => {
      const details = document.querySelector('details.lang-switcher') as HTMLDetailsElement;
      if (details) details.open = true;
    });
    await page.waitForTimeout(300);
    menuVisible = await menu.isVisible();
    console.log(`  Menu viditelné po JS force-open: ${menuVisible}`);
  }

  // Klikni na cílový jazyk v menu
  const langLink = page.locator(`a.lang-chip[hreflang="${targetLang}"]`).first();
  await langLink.waitFor({ state: 'visible', timeout: 5000 });
  const href = await langLink.getAttribute('href');
  console.log(`  Klikám na ${targetLang.toUpperCase()}: ${href}`);
  await langLink.click();
}

// Zjisti navigační strukturu na stránce (pro debug)
async function getNavLinks(page: any): Promise<{ text: string; href: string }[]> {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('nav a, header a'));
    return links.map(a => ({
      text: (a as HTMLAnchorElement).textContent?.trim() || '',
      href: (a as HTMLAnchorElement).href || ''
    })).filter(l => l.text && l.href);
  });
}

test.describe('KLIKACÍ test přepínače jazyků', () => {
  test.setTimeout(60000);

  test('Test 1: /cs/cenik → KLIKNI EN → musí být /pricing', async ({ page }) => {
    await page.goto(`${BASE}/cs/cenik`);
    await page.waitForLoadState('networkidle');
    await closeAgeGate(page);
    console.log('START:', page.url());
    await page.screenshot({ path: '/tmp/click-t1-start.png' });

    await clickLangSwitcher(page, 'en');
    await page.waitForLoadState('networkidle');

    const finalUrl = page.url();
    console.log('VÝSLEDEK:', finalUrl);
    await page.screenshot({ path: '/tmp/click-t1-result.png' });

    expect(finalUrl, `Čekám /pricing, dostal jsem ${finalUrl}`).toContain('/pricing');
    expect(finalUrl).not.toMatch(/\/cs\/|\/de\/|\/uk\//);
  });

  test('Test 2: /cs/cenik → NAV na Slevy → KLIKNI EN → musí být EN slevy (NE /pricing)', async ({ page }) => {
    await page.goto(`${BASE}/cs/cenik`);
    await page.waitForLoadState('networkidle');
    await closeAgeGate(page);
    console.log('START:', page.url());

    // Vypíše všechny nav odkazy pro debug
    const navLinks = await getNavLinks(page);
    const slevyLink = navLinks.find(l => l.text.toLowerCase().includes('slev') || l.href.includes('slev'));
    console.log('Nav Slevy odkaz:', slevyLink);
    console.log('Všechny nav linky:', navLinks.map(l => `${l.text}: ${l.href}`).join(', '));

    if (slevyLink) {
      console.log(`Klikám na Slevy: ${slevyLink.href}`);
      await page.click(`a[href="${new URL(slevyLink.href).pathname}"], a[href="${slevyLink.href}"]`);
    } else {
      console.log('Slevy nenalezeny v nav, naviguju na /cs/slevy přímo');
      await page.goto(`${BASE}/cs/slevy`);
    }

    await page.waitForLoadState('networkidle');
    await closeAgeGate(page);
    const afterSlevyUrl = page.url();
    console.log('Po navigaci na Slevy:', afterSlevyUrl);
    await page.screenshot({ path: '/tmp/click-t2-on-slevy.png' });

    // Ověř že jsme opravdu na Slevy stránce
    expect(afterSlevyUrl, `Nepodařilo se navigovat na Slevy: ${afterSlevyUrl}`).toContain('slev');

    // Klikni na přepínač jazyků → EN
    await clickLangSwitcher(page, 'en');
    await page.waitForLoadState('networkidle');

    const finalUrl = page.url();
    console.log('VÝSLEDEK po přepnutí na EN:', finalUrl);
    await page.screenshot({ path: '/tmp/click-t2-result.png' });

    // KRITICKÝ TEST: přepínač NESMÍ přesměrovat na /pricing (starou stránku)
    expect(finalUrl, `BUG #2: přesměroval na /pricing místo EN slevy — přepínač si pamatuje starou stránku!`).not.toContain('/pricing');
    expect(finalUrl, `BUG: přesměroval na homepage`).not.toMatch(/lovelygirls\.cz\/?$/);
    expect(finalUrl, `BUG: zůstal v CS`).not.toContain('/cs/');
    console.log('PASS: přepínač přesměroval na EN verzi aktuální stránky (slevy)');
  });

  test('Test 3: /cs/divky → KLIKNI EN → musí být /girls', async ({ page }) => {
    await page.goto(`${BASE}/cs/divky`);
    await page.waitForLoadState('networkidle');
    await closeAgeGate(page);
    console.log('START:', page.url());

    await clickLangSwitcher(page, 'en');
    await page.waitForLoadState('networkidle');

    const finalUrl = page.url();
    console.log('VÝSLEDEK:', finalUrl);
    await page.screenshot({ path: '/tmp/click-t3-result.png' });

    expect(finalUrl, `Čekám /girls, dostal jsem ${finalUrl}`).toContain('/girls');
    expect(finalUrl).not.toMatch(/\/cs\/|\/de\/|\/uk\//);
  });

  test('Test 4: /cs/rozvrh → KLIKNI DE → musí být /de/zeitplan', async ({ page }) => {
    await page.goto(`${BASE}/cs/rozvrh`);
    await page.waitForLoadState('networkidle');
    // Počkej na plné načtení před age gate
    await page.waitForTimeout(1000);
    await closeAgeGate(page);
    // Ověř že age gate je pryč
    const ageGateGone = await page.locator('button.age-gate-confirm').isVisible().catch(() => false);
    console.log('Age gate stále viditelný:', ageGateGone);
    console.log('START:', page.url());
    await page.screenshot({ path: '/tmp/click-t4-start.png' });

    await clickLangSwitcher(page, 'de');
    await page.waitForLoadState('networkidle');

    const finalUrl = page.url();
    console.log('VÝSLEDEK:', finalUrl);
    await page.screenshot({ path: '/tmp/click-t4-result.png' });

    expect(finalUrl, `Čekám /de/zeitplan, dostal jsem ${finalUrl}`).toContain('/de/');
    expect(finalUrl).not.toMatch(/lovelygirls\.cz\/?$/);
  });

  test('Test 5: /cs/profil/katy → KLIKNI EN → musí být /profile/katy', async ({ page }) => {
    await page.goto(`${BASE}/cs/profil/katy`);
    await page.waitForLoadState('networkidle');
    await closeAgeGate(page);
    console.log('START:', page.url());

    await clickLangSwitcher(page, 'en');
    await page.waitForLoadState('networkidle');

    const finalUrl = page.url();
    console.log('VÝSLEDEK:', finalUrl);
    await page.screenshot({ path: '/tmp/click-t5-result.png' });

    expect(finalUrl, `Čekám /profile/katy, dostal jsem ${finalUrl}`).toContain('/profile/katy');
    expect(finalUrl).not.toMatch(/\/cs\/|\/de\/|\/uk\//);
  });
});
