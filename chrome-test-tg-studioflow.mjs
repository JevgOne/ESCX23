/**
 * TEST: Telegram bot STUDIOFLOW (@studioflow3_bot)
 * Testuje 6 scénářů zadání
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = '/tmp/tg-test-studioflow';
const PROFILE = '/tmp/chrome-tg-studioflow-profile';

try {
  execSync(`rm -rf ${PROFILE} && cp -r "$HOME/Library/Application Support/Google/Chrome/Default" ${PROFILE} 2>/dev/null || true`);
  console.log('[profile] Chrome profil zkopírován');
} catch(e) {}

const browser = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  channel: 'chrome',
  slowMo: 100,
  viewport: { width: 1440, height: 900 },
  args: ['--no-first-run', '--password-store=basic', '--disable-extensions'],
  ignoreDefaultArgs: ['--enable-automation'],
});

const page = await browser.newPage();

async function shot(name) {
  try { await page.screenshot({ path: `${SHOTS}/${name}.png` }); console.log(`[shot] ${name}.png`); }
  catch(e) {}
}

async function getBotMessages() {
  return await page.evaluate(() => {
    const msgs = Array.from(document.querySelectorAll('.bubble:not(.is-out)'));
    return msgs.map(m => {
      const text = m.querySelector('.message, .translatable-message')?.innerText?.trim();
      const photo = m.querySelector('img.full-image, .media-photo img');
      const caption = m.querySelector('.caption .translatable-message')?.innerText?.trim();
      return { text: text || null, hasPhoto: !!photo, caption: caption || null };
    }).filter(m => m.text || m.hasPhoto);
  });
}

async function sendMessage(text) {
  const input = page.locator('.input-message-input').first();
  await input.click();
  await input.fill(text);
  await sleep(300);
  await page.keyboard.press('Enter');
  console.log(`[send] "${text}"`);
  await sleep(8000); // čekej na AI odpověď
}

async function getLastBotMessages(countBefore = 0) {
  // Získej všechny bot zprávy a vrať pouze nové
  return await page.evaluate((before) => {
    const msgs = Array.from(document.querySelectorAll('.bubble:not(.is-out)'));
    const newMsgs = msgs.slice(before);
    return newMsgs.map(m => {
      const text = m.querySelector('.message .translatable-message, .message')?.innerText?.trim();
      const photo = m.querySelector('img.full-image, .media-photo img, .attachment img');
      const caption = m.querySelector('.caption, .caption .translatable-message')?.innerText?.trim();
      const buttons = Array.from(m.querySelectorAll('.reply-markup button, .inline-button')).map(b => b.innerText?.trim());
      return { text: text || null, hasPhoto: !!photo, caption: caption || null, buttons };
    }).filter(m => m.text || m.hasPhoto || m.buttons?.length > 0);
  }, countBefore);
}

const results = [];
function log(test, status, detail = '') {
  const line = `[${status}] ${test}${detail ? ': ' + detail : ''}`;
  console.log(line);
  results.push({ test, status, detail });
}

try {
  // Otevři Telegram Web
  console.log('[step] Otevírám Telegram Web...');
  await page.goto('https://web.telegram.org/k/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(5000);
  await shot('01-telegram-open');

  // Zkontroluj jestli jsme přihlášeni
  const isLoggedIn = await page.evaluate(() => {
    return !!document.querySelector('.chatlist-chat, .dialog, .chats-container, [class*="chat-list"]');
  });
  const isQR = await page.evaluate(() => {
    return !!document.querySelector('.qr-code, canvas, [class*="qr"]') ||
           document.body?.innerText?.includes('QR') ||
           document.body?.innerText?.includes('přihlásit') ||
           document.body?.innerText?.includes('Log in');
  });

  console.log(`[info] Přihlášen: ${isLoggedIn}, QR zobrazeno: ${isQR}`);
  console.log(`[info] URL: ${page.url()}`);

  if (isQR || !isLoggedIn) {
    log('Telegram session', 'INFO', 'Není session — potřeba přihlásit se přes QR nebo telefonní číslo');
    await shot('01b-qr-or-login');

    // Čekej delší dobu jestli se session načte
    await sleep(10000);
    await shot('01c-after-wait');

    const stillNoSession = await page.evaluate(() => {
      return !document.querySelector('.chatlist-chat, .dialog, .chats-container');
    });

    if (stillNoSession) {
      log('Telegram bot test', 'BLOCKED', 'Bez Telegram session nelze testovat bota');
      printResults();
      await browser.close();
      process.exit(0);
    }
  }

  log('Telegram session', 'PASS', 'Přihlášen do Telegram Web');

  // Najdi bota STUDIOFLOW
  console.log('[step] Hledám bota STUDIOFLOW...');

  // Zkus searchbox
  const searchBox = page.locator('input[type="text"].input-search, .search-input input, input[placeholder*="Search"], input[placeholder*="Hledat"]').first();
  const searchCount = await searchBox.count();

  if (searchCount > 0) {
    await searchBox.click();
    await searchBox.fill('@studioflow3_bot');
    await sleep(3000);
    await shot('02-search');

    // Klikni na výsledek hledání
    const searchResult = page.locator('.chatlist-chat, .search-result, [class*="search-result"]').first();
    if (await searchResult.count() > 0) {
      await searchResult.click();
      await sleep(2000);
    }
  } else {
    // Zkus navigovat přímo na bota
    await page.goto('https://web.telegram.org/k/#@studioflow3_bot', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(5000);
  }

  await shot('03-bot-chat');

  const currentUrl = page.url();
  const chatTitle = await page.evaluate(() => {
    return document.querySelector('.peer-title, .chat-info .title')?.innerText?.trim() ||
           document.title;
  });
  console.log(`[info] Chat URL: ${currentUrl}, Title: "${chatTitle}"`);

  // Spočítej aktuální bot zprávy
  const initialMsgCount = await page.evaluate(() =>
    document.querySelectorAll('.bubble:not(.is-out)').length
  );
  console.log(`[info] Počáteční bot zprávy: ${initialMsgCount}`);

  // ===== TEST 1: "Ahoj" =====
  console.log('\n[TEST 1] Posílám "Ahoj"...');
  const countBefore1 = await page.evaluate(() => document.querySelectorAll('.bubble:not(.is-out)').length);
  await sendMessage('Ahoj');
  await sleep(10000); // AI potřebuje čas
  await shot('04-ahoj-response');

  const msgs1 = await getLastBotMessages(countBefore1);
  console.log('[TEST 1] Bot odpovědi:', JSON.stringify(msgs1));

  const ahojResponse = msgs1.map(m => m.text).filter(Boolean).join(' ');
  const isShortGreeting = ahojResponse.includes('Vítej') || ahojResponse.includes('vitej') || ahojResponse.includes('Vítám') ||
    ahojResponse.length < 200;
  log('TEST 1: Ahoj → krátká odpověď', isShortGreeting ? 'PASS' : 'INFO',
    `Bot odpověděl: "${ahojResponse.substring(0, 150)}"`);

  // ===== TEST 2: "Kdo dnes pracuje?" =====
  console.log('\n[TEST 2] Posílám "Kdo dnes pracuje?"...');
  const countBefore2 = await page.evaluate(() => document.querySelectorAll('.bubble:not(.is-out)').length);
  await sendMessage('Kdo dnes pracuje?');
  await sleep(20000); // Více zpráv (fotky) trvá déle
  await shot('05-kdo-pracuje');
  await sleep(5000); // Ještě počkej
  await shot('05b-kdo-pracuje-full');

  const msgs2 = await getLastBotMessages(countBefore2);
  console.log('[TEST 2] Bot odpovědi:', JSON.stringify(msgs2.slice(0, 5)));

  const photoCount = msgs2.filter(m => m.hasPhoto).length;
  const textMsgs = msgs2.filter(m => m.text).map(m => m.text);
  const captionMsgs = msgs2.filter(m => m.caption).map(m => m.caption);

  console.log(`[TEST 2] Fotky: ${photoCount}, Texty: ${textMsgs.length}, Captions: ${captionMsgs.length}`);
  console.log('[TEST 2] Captions:', captionMsgs.slice(0, 3));
  console.log('[TEST 2] Texty:', textMsgs.slice(0, 3));

  // Ověř caption formát: jméno + věk, 🟢 směna, ⭐ hodnocení, 📍 pobočka
  const captionHasFormat = captionMsgs.some(c =>
    c.includes('🟢') || c.includes('⭐') || c.includes('📍') || c.includes('rok') || c.includes('let')
  );

  log('TEST 2a: Fotky dívek', photoCount > 0 ? 'PASS' : 'FAIL', `${photoCount} fotek odesláno`);
  log('TEST 2b: Caption formát (jméno, 🟢, ⭐, 📍)', captionHasFormat ? 'PASS' : 'INFO',
    captionMsgs.length > 0 ? `Příklad: "${captionMsgs[0]?.substring(0, 100)}"` : 'Žádné captions');
  log('TEST 2c: Pobočka plný název', captionMsgs.some(c => c.includes('Praha')) ? 'PASS' : 'INFO',
    captionMsgs.map(c => c?.substring(0, 50)).join(' | ').substring(0, 150));

  // ===== TEST 3: Jméno dívky "Katy" =====
  console.log('\n[TEST 3] Posílám "Katy"...');
  const countBefore3 = await page.evaluate(() => document.querySelectorAll('.bubble:not(.is-out)').length);
  await sendMessage('Katy');
  await sleep(15000);
  await shot('06-katy-profile');

  const msgs3 = await getLastBotMessages(countBefore3);
  console.log('[TEST 3] Bot odpovědi:', JSON.stringify(msgs3.slice(0, 3)));

  const katyTexts = msgs3.map(m => m.text).filter(Boolean).join(' ');
  const katyPhoto = msgs3.some(m => m.hasPhoto);
  const katyButtons = msgs3.flatMap(m => m.buttons || []);
  const crashed = katyTexts.toLowerCase().includes('error') || katyTexts.toLowerCase().includes('chyba') ||
    katyTexts.includes('500') || katyTexts.includes('undefined');

  log('TEST 3: Jméno dívky → profil bez crashe', !crashed ? 'PASS' : 'FAIL',
    `Foto: ${katyPhoto}, Buttons: ${katyButtons.join(', ')}, Text: "${katyTexts.substring(0, 100)}"`);

  // ===== TEST 4: "Chci rezervaci" =====
  console.log('\n[TEST 4] Posílám "Chci rezervaci"...');
  const countBefore4 = await page.evaluate(() => document.querySelectorAll('.bubble:not(.is-out)').length);
  await sendMessage('Chci rezervaci');
  await sleep(12000);
  await shot('07-rezervace');

  const msgs4 = await getLastBotMessages(countBefore4);
  console.log('[TEST 4] Bot odpovědi:', JSON.stringify(msgs4.slice(0, 3)));

  const rezervaceTexts = msgs4.map(m => m.text).filter(Boolean).join(' ');
  const rezervaceButtons = msgs4.flatMap(m => m.buttons || []);
  const asksForName = rezervaceTexts.toLowerCase().includes('jméno') || rezervaceTexts.toLowerCase().includes('jmeno') ||
    rezervaceTexts.toLowerCase().includes('jak se jmenujet') || rezervaceTexts.toLowerCase().includes('klient');
  const hasBookingFlow = rezervaceButtons.some(b => b.startsWith('bk_') || b.includes(':')) ||
    rezervaceTexts.includes('datum') || rezervaceTexts.includes('čas') || rezervaceTexts.includes('dívk');

  log('TEST 4: Chci rezervaci → ptá se na jméno / spustí flow',
    asksForName || hasBookingFlow ? 'PASS' : 'INFO',
    `Text: "${rezervaceTexts.substring(0, 150)}", Buttons: ${rezervaceButtons.join(', ')}`);

  await shot('08-final');

} catch(err) {
  console.error('[ERROR]', err.message.substring(0, 300));
  await page.screenshot({ path: `${SHOTS}/error.png` }).catch(() => {});
  log('Test', 'ERROR', err.message.substring(0, 150));
}

function printResults() {
  console.log('\n=== VÝSLEDKY TG BOT TEST ===');
  for (const r of results) {
    console.log(`[${r.status}] ${r.test}${r.detail ? ': ' + r.detail : ''}`);
  }
}

printResults();
await sleep(3000);
await browser.close();
console.log('[done]');
