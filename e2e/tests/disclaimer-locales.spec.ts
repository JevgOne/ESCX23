import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:3001';

// Konfigurace pro každý locale
const LOCALES = [
  {
    code: 'cs',
    homepage: '/cs',
    subpage: '/cs/cenik',
    btnPartial: 'Souhlas', // "Souhlasím a potvrzuji výše uvedené"
  },
  {
    code: 'en',
    homepage: '/en',
    subpage: '/en/pricing',
    btnPartial: 'Agree',   // "I agree and confirm..."
  },
  {
    code: 'de',
    homepage: '/de',
    subpage: '/de/preise',
    btnPartial: 'Stimmz',  // "Ich stimme zu..."
  },
  {
    code: 'uk',
    homepage: '/uk',
    subpage: '/uk/tsiny',
    btnPartial: 'Погоджу', // "Погоджуюсь..."
  },
];

// Smaže cookies/storage aby se age gate vždy ukázal
// MUSÍ být voláno před goto()
async function clearStorage(page: any) {
  await page.context().clearCookies();
  // localStorage lze smazat jen po načtení stránky — uděláme to po goto
}

// Zkontroluje přítomnost a obsah age gate — čeká max 3s
async function checkAgeGate(page: any, locale: typeof LOCALES[0]) {
  const modal = page.locator('.age-gate-modal, .age-gate-overlay').first();
  // Čekej až 3s na zobrazení (může být animace)
  const isVisible = await modal.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);

  if (!isVisible) {
    console.log(`  [${locale.code}] FAIL: age gate se nezobrazil`);
    return false;
  }
  console.log(`  [${locale.code}] age gate viditelný ✓`);

  // Ověř obsah tlačítka — musí být přeložený
  const btn = page.locator('button.age-gate-confirm').first();
  const btnVisible = await btn.isVisible().catch(() => false);
  if (!btnVisible) {
    console.log(`  [${locale.code}] FAIL: tlačítko age-gate-confirm nenalezeno`);
    return false;
  }

  const btnText = await btn.textContent();
  console.log(`  [${locale.code}] tlačítko: "${btnText?.trim()}"`);

  // Ověř že text tlačítka odpovídá locale
  const hasExpectedText = btnText?.includes(locale.btnPartial);
  if (!hasExpectedText) {
    console.log(`  [${locale.code}] WARN: text tlačítka neobsahuje "${locale.btnPartial}" — možná nepřeloženo`);
  } else {
    console.log(`  [${locale.code}] přeložený text tlačítka ✓`);
  }

  // Ověř obsah modalu — vypíše prvních 200 znaků textu
  const modalText = await modal.textContent().catch(() => '');
  console.log(`  [${locale.code}] obsah modalu (prvních 150 znaků): "${modalText?.trim().slice(0, 150)}"`);

  return true;
}

for (const locale of LOCALES) {
  test.describe(`Age gate — ${locale.code.toUpperCase()}`, () => {
    test.setTimeout(45000);

    test(`1. Homepage /${locale.code} — zobrazí disclaimer a lze ho potvrdit`, async ({ page }) => {
      await clearStorage(page);
      await page.goto(`${BASE}${locale.homepage}`);
      await page.waitForLoadState('networkidle');
      // Smaž localStorage po načtení stránky
      await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
      console.log(`\nSTART: ${page.url()}`);
      await page.screenshot({ path: `/tmp/disclaimer-${locale.code}-start.png` });

      // Ověř přítomnost age gate
      const shown = await checkAgeGate(page, locale);
      expect(shown, `Age gate se nezobrazil na /${locale.code}`).toBe(true);

      // Klikni na tlačítko potvrzení
      const btn = page.locator('button.age-gate-confirm').first();
      await btn.click();
      console.log(`  [${locale.code}] kliknuto na potvrzení`);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `/tmp/disclaimer-${locale.code}-after-confirm.png` });

      // Ověř že modal zmizel
      const stillVisible = await page.locator('.age-gate-modal, .age-gate-overlay').first().isVisible().catch(() => false);
      expect(stillVisible, `Age gate stále viditelný po potvrzení`).toBe(false);
      console.log(`  [${locale.code}] age gate po potvrzení zmizel ✓`);

      // Počkej na přesměrování po server action (setAgeVerified redirect)
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      console.log(`  [${locale.code}] URL po potvrzení: ${page.url()}`);
      await page.screenshot({ path: `/tmp/disclaimer-${locale.code}-content.png` });

      // Ověř že age gate je pryč a vidíme obsah stránky
      const gateGone = !(await page.locator('.age-gate-overlay').isVisible().catch(() => false));
      expect(gateGone, `Age gate stále viditelný po potvrzení`).toBe(true);
      const hasContent = await page.locator('nav, main, h1, header').first().isVisible({ timeout: 3000 }).catch(() => false);
      if (!hasContent) {
        console.log(`  [${locale.code}] WARN: nav/main/h1 není viditelný — možná prázdná homepage`);
      } else {
        console.log(`  [${locale.code}] obsah stránky viditelný ✓`);
      }
    });

    test(`2. /${locale.code} — po potvrzení disclaimer se NEOBJEVÍ znovu při navigaci`, async ({ page }) => {
      await clearStorage(page);
      await page.goto(`${BASE}${locale.homepage}`);
      await page.waitForLoadState('networkidle');

      // Potvrď age gate
      const btn = page.locator('button.age-gate-confirm').first();
      await btn.waitFor({ state: 'visible', timeout: 5000 });
      await btn.click();
      await page.waitForTimeout(600);
      console.log(`  [${locale.code}] age gate potvrzen`);

      // Naviguj na jinou stránku v rámci locale
      await page.goto(`${BASE}${locale.subpage}`);
      await page.waitForLoadState('networkidle');
      console.log(`  [${locale.code}] navigoval na: ${page.url()}`);
      await page.screenshot({ path: `/tmp/disclaimer-${locale.code}-nav-no-gate.png` });

      // Ověř že age gate se NEZOBRAZIL
      const gateVisible = await page.locator('.age-gate-modal, .age-gate-overlay').first().isVisible().catch(() => false);
      expect(gateVisible, `BUG: age gate se znovu zobrazil po navigaci na ${locale.subpage}`).toBe(false);
      console.log(`  [${locale.code}] age gate se po navigaci NEobjevil ✓`);
    });

    test(`3. Přímý vstup na podstránku ${locale.subpage} — disclaimer se musí zobrazit`, async ({ page }) => {
      await clearStorage(page);
      await page.goto(`${BASE}${locale.subpage}`);
      await page.waitForLoadState('networkidle');
      console.log(`\nPřímý vstup: ${page.url()}`);
      await page.screenshot({ path: `/tmp/disclaimer-${locale.code}-subpage-entry.png` });

      // Ověř přítomnost age gate
      const shown = await checkAgeGate(page, locale);
      expect(shown, `Age gate se nezobrazil při přímém vstupu na ${locale.subpage}`).toBe(true);
      console.log(`  [${locale.code}] age gate na podstránce ✓`);
    });
  });
}
