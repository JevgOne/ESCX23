import { test } from 'playwright/test';

const BASE = 'http://localhost:3000';

test('Debug: co se děje na /cs bez cookie', async ({ page }) => {
  // Smaž VŠECHNY cookies
  await page.context().clearCookies();
  console.log('Cookies smazány');

  // Ověř že žádné cookies nejsou
  const cookiesBefore = await page.context().cookies();
  console.log('Cookies před načtením:', cookiesBefore);

  await page.goto(`${BASE}/cs`);
  await page.waitForLoadState('networkidle');
  console.log('URL po načtení:', page.url());

  // Dump DOM - hledáme age gate elementy
  const ageGateElements = await page.evaluate(() => {
    const selectors = [
      '.age-gate-overlay',
      '.age-gate-modal',
      '.age-gate-confirm',
      '[class*="age-gate"]',
    ];
    return selectors.map(sel => {
      const el = document.querySelector(sel);
      return {
        selector: sel,
        found: !!el,
        visible: el ? (el as HTMLElement).offsetParent !== null : false,
        display: el ? window.getComputedStyle(el).display : 'n/a',
        visibility: el ? window.getComputedStyle(el).visibility : 'n/a',
      };
    });
  });
  console.log('Age gate elementy v DOM:', JSON.stringify(ageGateElements, null, 2));

  // Vypíš cookies po načtení
  const cookiesAfter = await page.context().cookies();
  console.log('Cookies po načtení:', cookiesAfter);

  // Screenshot
  await page.screenshot({ path: '/tmp/debug-agegate.png', fullPage: false });
  console.log('Screenshot: /tmp/debug-agegate.png');

  // Celý body HTML (prvních 2000 znaků)
  const bodyHtml = await page.evaluate(() => document.body.innerHTML.slice(0, 2000));
  console.log('Body HTML (2000 znaků):\n', bodyHtml);
});
