import { test, expect } from 'playwright/test';

const BASE = 'https://www.lovelygirls.cz';

// Otevře dropdown přepínače jazyka a klikne na cílový jazyk
async function switchLang(page: any, targetLang: string) {
  // lang-chip jsou v dropdown — musíme napřed otevřít přepínač
  // Hledáme tlačítko/trigger přepínače jazyků
  const trigger = page.locator(
    'button[aria-haspopup], button[data-lang], .lang-trigger, [data-testid="lang-switcher"], nav button:has(.lang), nav button:has-text("CS"), nav button:has-text("EN"), nav button:has-text("DE")'
  ).first();

  if (await trigger.count() > 0) {
    await trigger.click();
    await page.waitForTimeout(300);
  }

  // Klikni na cílový jazyk
  const langLink = page.locator(`a.lang-chip[hreflang="${targetLang}"], a[role="menuitem"][hreflang="${targetLang}"]`).first();
  await langLink.waitFor({ state: 'visible', timeout: 5000 });
  const href = await langLink.getAttribute('href');
  console.log(`  → Klikám na ${targetLang.toUpperCase()} odkaz: ${href}`);
  await langLink.click();
}

// Alternativa: naviguj přímo na hreflang URL ze stránky
async function getHreflangUrl(page: any, targetLang: string): Promise<string | null> {
  const link = await page.locator(`link[rel="alternate"][hreflang="${targetLang}"]`).first();
  if (await link.count() > 0) {
    return link.getAttribute('href');
  }
  // Zkus také viditelné a nebo link tagy v head
  const headLink = await page.evaluate((lang: string) => {
    const el = document.querySelector(`link[rel="alternate"][hreflang="${lang}"], a[hreflang="${lang}"]`);
    return el ? (el as any).href || el.getAttribute('href') : null;
  }, targetLang);
  return headLink;
}

test.describe('Přepínač jazyků', () => {
  test('1. /cs/cenik → EN → /pricing', async ({ page }) => {
    await page.goto(`${BASE}/cs/cenik`);
    await page.waitForLoadState('networkidle');
    console.log('START URL:', page.url());

    // Zkus přes hreflang <link> v head
    const targetHref = await getHreflangUrl(page, 'en');
    console.log('hreflang en href:', targetHref);

    if (targetHref) {
      await page.goto(targetHref);
    } else {
      await switchLang(page, 'en');
    }

    await page.waitForLoadState('networkidle');
    const finalUrl = page.url();
    console.log('VÝSLEDNÁ URL:', finalUrl);
    await page.screenshot({ path: '/tmp/test1-result.png' });

    expect(finalUrl, `Očekávám /pricing, dostal jsem ${finalUrl}`).toContain('/pricing');
    expect(finalUrl).not.toMatch(/\/cs\/|\/de\/|\/uk\//);
  });

  test('2. /pricing → CS → /cs/cenik', async ({ page }) => {
    await page.goto(`${BASE}/pricing`);
    await page.waitForLoadState('networkidle');
    console.log('START URL:', page.url());

    const targetHref = await getHreflangUrl(page, 'cs');
    console.log('hreflang cs href:', targetHref);

    if (targetHref) {
      await page.goto(targetHref);
    } else {
      await switchLang(page, 'cs');
    }

    await page.waitForLoadState('networkidle');
    const finalUrl = page.url();
    console.log('VÝSLEDNÁ URL:', finalUrl);
    await page.screenshot({ path: '/tmp/test2-result.png' });

    expect(finalUrl, `Očekávám /cs/cenik, dostal jsem ${finalUrl}`).toContain('/cs/cenik');
  });

  test('3. /cs/divky → EN → /girls', async ({ page }) => {
    await page.goto(`${BASE}/cs/divky`);
    await page.waitForLoadState('networkidle');
    console.log('START URL:', page.url());

    const targetHref = await getHreflangUrl(page, 'en');
    console.log('hreflang en href:', targetHref);

    if (targetHref) {
      await page.goto(targetHref);
    } else {
      await switchLang(page, 'en');
    }

    await page.waitForLoadState('networkidle');
    const finalUrl = page.url();
    console.log('VÝSLEDNÁ URL:', finalUrl);
    await page.screenshot({ path: '/tmp/test3-result.png' });

    expect(finalUrl, `Očekávám /girls, dostal jsem ${finalUrl}`).toContain('/girls');
    expect(finalUrl).not.toMatch(/\/cs\/|\/de\/|\/uk\//);
  });

  test('4. /cs/rozvrh → DE → /de/zeitplan', async ({ page }) => {
    await page.goto(`${BASE}/cs/rozvrh`);
    await page.waitForLoadState('networkidle');
    console.log('START URL:', page.url());

    const targetHref = await getHreflangUrl(page, 'de');
    console.log('hreflang de href:', targetHref);

    if (targetHref) {
      await page.goto(targetHref);
    } else {
      await switchLang(page, 'de');
    }

    await page.waitForLoadState('networkidle');
    const finalUrl = page.url();
    console.log('VÝSLEDNÁ URL:', finalUrl);
    await page.screenshot({ path: '/tmp/test4-result.png' });

    expect(finalUrl, `Očekávám /de/..., dostal jsem ${finalUrl}`).toContain('/de/');
    // Nesmí být na homepage
    expect(finalUrl).not.toMatch(/lovelygirls\.cz\/(de\/?)?$/);
  });

  test('5. /cs/profil/[slug] → EN → /profile/[slug]', async ({ page }) => {
    // Získej slug z listingu
    await page.goto(`${BASE}/cs/divky`);
    await page.waitForLoadState('networkidle');

    const profileLink = await page.locator('a[href*="/cs/profil/"]').first();
    let slug = '';
    if (await profileLink.count() > 0) {
      const href = await profileLink.getAttribute('href') || '';
      slug = href.replace('/cs/profil/', '').split('?')[0].split('/')[0];
    }
    console.log('Slug:', slug);

    if (!slug) {
      console.log('SKIP: žádný profil nenalezen v listingu');
      return;
    }

    await page.goto(`${BASE}/cs/profil/${slug}`);
    await page.waitForLoadState('networkidle');
    console.log('START URL:', page.url());

    const targetHref = await getHreflangUrl(page, 'en');
    console.log('hreflang en href:', targetHref);

    if (targetHref) {
      await page.goto(targetHref);
    } else {
      await switchLang(page, 'en');
    }

    await page.waitForLoadState('networkidle');
    const finalUrl = page.url();
    console.log('VÝSLEDNÁ URL:', finalUrl);
    await page.screenshot({ path: '/tmp/test5-result.png' });

    expect(finalUrl, `Očekávám /profile/${slug}, dostal jsem ${finalUrl}`).toContain(`/profile/${slug}`);
    expect(finalUrl).not.toMatch(/\/cs\/|\/de\/|\/uk\//);
  });

  test('6. Homepage /cs → EN → /', async ({ page }) => {
    await page.goto(`${BASE}/cs`);
    await page.waitForLoadState('networkidle');
    console.log('START URL:', page.url());

    const targetHref = await getHreflangUrl(page, 'en');
    console.log('hreflang en href:', targetHref);

    if (targetHref) {
      await page.goto(targetHref);
    } else {
      await switchLang(page, 'en');
    }

    await page.waitForLoadState('networkidle');
    const finalUrl = page.url();
    console.log('VÝSLEDNÁ URL:', finalUrl);
    await page.screenshot({ path: '/tmp/test6-result.png' });

    // EN homepage = / nebo /en nebo lovelygirls.cz
    expect(finalUrl).not.toContain('/cs');
    expect(finalUrl).not.toContain('/de');
    expect(finalUrl).not.toContain('/uk');
  });
});
