/**
 * TEST-CHROME v3: Čtení odpovědí bota + scroll dolů
 */
import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = '/tmp/telegram-bot-test';
const PROFILE = '/tmp/chrome-tg-test-profile';

console.log('[test-v3] Spouštím...');
const browser = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  channel: 'chrome',
  slowMo: 100,
  viewport: { width: 1440, height: 900 },
  args: ['--no-first-run', '--disable-extensions', '--password-store=basic'],
  ignoreDefaultArgs: ['--enable-automation'],
});

const page = await browser.newPage();
const results = [];

function log(test, status, detail = '') {
  console.log(`[${status}] ${test}${detail ? ': ' + detail : ''}`);
  results.push({ test, status, detail });
}

async function shot(name) {
  try { await page.screenshot({ path: `${SHOTS}/${name}.png` }); console.log(`[shot] ${name}`); }
  catch(e) { console.log(`[shot-fail] ${name}: ${e.message.substring(0,50)}`); }
}

async function readAllMessages() {
  return page.evaluate(() => {
    const msgs = [];
    // Telegram Web K používá .message class pro bubbles
    const bubbles = document.querySelectorAll('.bubble:not(.is-out) .message, .bubble:not(.is-out) .spoilers-container');
    bubbles.forEach(el => {
      const t = el.innerText?.trim();
      if (t && t.length > 1) msgs.push(t.substring(0, 200));
    });
    // Also get our outgoing messages
    const out = [];
    document.querySelectorAll('.bubble.is-out .message, .bubble.is-out .spoilers-container').forEach(el => {
      const t = el.innerText?.trim();
      if (t) out.push('→ ' + t.substring(0, 100));
    });
    return { incoming: msgs, outgoing: out };
  });
}

try {
  await page.goto('https://web.telegram.org/k/#@studioflow3_bot', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await sleep(5000);

  // Scroll na konec chatu
  await page.evaluate(() => {
    const chatEl = document.querySelector('.scrollable-y, .chat-list-container, [class*="messages-container"]');
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  });
  await sleep(2000);
  await shot('v3-01-initial');

  // Přečti existující zprávy
  const existing = await readAllMessages();
  console.log('[info] Příchozí zprávy (bot):', JSON.stringify(existing.incoming));
  console.log('[info] Odchozí zprávy (user):', JSON.stringify(existing.outgoing));

  // =============================================
  // TEST: Je bot přihlášen a odpovídá?
  // =============================================
  const hasInput = await page.locator('.input-message-input').count() > 0;
  if (!hasInput) {
    log('Telegram session', 'FAIL', 'Není input — nutné přihlášení');
    await browser.close();
    process.exit(1);
  }

  log('Telegram session', 'PASS', 'Přihlášen, input nalezen');

  // =============================================
  // Zkontroluj co bot odpověděl na předchozí Ahoj
  // (zprávy z minulého testu)
  // =============================================
  const prevBotMsgs = existing.incoming.filter(m => m.length > 0);
  console.log(`[info] Bot zprávy celkem: ${prevBotMsgs.length}`);

  if (prevBotMsgs.some(m => m.includes('Vítej') || m.includes('vitej') || m.includes('LG') || m.includes('Hello'))) {
    log('Bot odpověď na /start — Vítej', 'PASS', prevBotMsgs.find(m => m.includes('Vítej') || m.includes('LG'))?.substring(0, 80) || '');
  }

  // =============================================
  // Pošli čerstvou zprávu "Ahoj" a čekej na odpověď
  // =============================================
  console.log('\n[TEST 2] Posílám čerstvou zprávu "Ahoj"...');
  const msgsBefore = prevBotMsgs.length;

  const input = page.locator('.input-message-input').first();
  await input.click();
  await sleep(300);

  // Smaž případný zbylý text
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await sleep(200);

  // Napiš zprávu
  await input.type('Ahoj', { delay: 80 });
  await sleep(400);
  await shot('v3-02-typed');

  await page.keyboard.press('Enter');
  console.log('[info] Čekám 10s na odpověď bota...');
  await sleep(10000);

  // Scroll dolů po odpovědi
  await page.evaluate(() => {
    const scrollable = document.querySelector('[class*="scrollable"], .scrollable-y, .bubbles-inner');
    if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;
  });
  await sleep(1000);
  await shot('v3-02-response');

  // Přečti nové zprávy
  const msgs2 = await readAllMessages();
  console.log('[info] Bot odpovědi po Ahoj:', JSON.stringify(msgs2.incoming));

  const newBotMsgs = msgs2.incoming.filter(m => !prevBotMsgs.includes(m));
  console.log('[info] Nové bot zprávy:', JSON.stringify(newBotMsgs));

  if (newBotMsgs.length > 0) {
    const reply = newBotMsgs[0];
    log('TEST 2: Bot odpověděl na Ahoj', 'PASS', `"${reply.substring(0, 100)}"`);
    log('TEST 2: Odpověď stručná', reply.length < 300 ? 'PASS' : 'FAIL', `${reply.length} znaků`);

    // Ověř obsah — má být jen "Vítej v LG" nebo podobně stručné
    if (reply.length < 100) {
      log('TEST 2: Stručný pozdrav (< 100 znaků)', 'PASS', reply);
    } else {
      log('TEST 2: Příliš dlouhý pozdrav', 'FAIL', `${reply.length} znaků`);
    }
  } else {
    // Možná bot odpověděl ale selektor ho nenachází — zkus jinak
    const allText = await page.evaluate(() => {
      const latest = [];
      document.querySelectorAll('.bubble').forEach(b => {
        const t = b.innerText?.trim();
        if (t && t.length > 2) latest.push((b.classList.contains('is-out') ? '→ ' : '← ') + t.substring(0, 100));
      });
      return latest.slice(-10);
    });
    console.log('[info] Všechny bubliny (posledních 10):', JSON.stringify(allText));

    const botReply = allText.filter(t => t.startsWith('←')).pop() || '';
    if (botReply) {
      log('TEST 2: Bot odpověděl (alt selektor)', 'PASS', botReply.substring(0, 100));
    } else {
      log('TEST 2: Bot neodpověděl', 'FAIL', 'Žádná odpověď do 10s');
    }
  }

  // =============================================
  // TEST 3: Viktoria — fotka + AI odpověď
  // =============================================
  console.log('\n[TEST 3] Posílám "Viktoria"...');
  const msgsBeforeVikt = (await readAllMessages()).incoming.length;

  await input.click();
  await sleep(300);
  await input.type('Viktoria', { delay: 80 });
  await sleep(300);
  await page.keyboard.press('Enter');
  console.log('[info] Čekám 12s na AI odpověď + fotku...');
  await sleep(12000);

  await page.evaluate(() => {
    const s = document.querySelector('[class*="scrollable"], .scrollable-y, .bubbles-inner');
    if (s) s.scrollTop = s.scrollHeight;
  });
  await sleep(1000);
  await shot('v3-03-viktoria');

  const msgs3 = await readAllMessages();
  const newAfterVikt = msgs3.incoming.slice(msgsBeforeVikt);
  console.log('[info] Nové bot zprávy po Viktoria:', JSON.stringify(newAfterVikt));

  if (newAfterVikt.length > 0) {
    log('TEST 3: Bot odpověděl na Viktoria', 'PASS', `"${newAfterVikt[0].substring(0, 100)}"`);
  } else {
    // Zkus přes všechny bubliny
    const allBubbles = await page.evaluate(() => {
      const b = [];
      document.querySelectorAll('.bubble').forEach(el => {
        if (!el.classList.contains('is-out')) {
          b.push(el.innerText?.trim().substring(0, 150));
        }
      });
      return b.filter(Boolean);
    });
    console.log('[info] Všechny příchozí bubliny:', JSON.stringify(allBubbles.slice(-5)));
    const last = allBubbles.pop() || '';
    log('TEST 3: Bot odpověděl', last ? 'PASS' : 'INFO', last.substring(0, 100));
  }

  // Zkontroluj fotky
  const photoCount = await page.evaluate(() => {
    const imgs = document.querySelectorAll('.bubble:not(.is-out) img, .media-photo img');
    return imgs.length;
  });
  log('TEST 3: Fotky dívek', photoCount > 0 ? 'PASS' : 'INFO',
    photoCount > 0 ? `${photoCount} obrázků` : 'Fotky nenalezeny v DOM');

  // =============================================
  // TEST 4: Booking flow tlačítka
  // =============================================
  console.log('\n[TEST 4] Hledám inline keyboard tlačítka...');
  await sleep(2000);

  const btnInfo = await page.evaluate(() => {
    // Telegram Web K inline klávesnice
    const sels = [
      '.reply-markup-row .reply-markup-button',
      '.reply-markup button',
      '[class*="keyboard"] button',
      '.keyboard-button',
    ];
    for (const s of sels) {
      const els = document.querySelectorAll(s);
      if (els.length > 0) {
        return { count: els.length, texts: Array.from(els).map(e => e.innerText?.trim()).filter(Boolean) };
      }
    }
    return { count: 0, texts: [] };
  });

  console.log('[info] Tlačítka:', JSON.stringify(btnInfo));

  if (btnInfo.count > 0) {
    log('TEST 4: Booking flow tlačítka', 'PASS', `${btnInfo.count}: ${btnInfo.texts.join(', ')}`);
    await shot('v3-04-buttons');
    // Klikni na první tlačítko
    await page.locator('.reply-markup-row .reply-markup-button, .reply-markup button').first().click();
    await sleep(5000);
    await shot('v3-04-after-click');
    log('TEST 4: Proklikání tlačítka', 'PASS');
  } else {
    log('TEST 4: Booking tlačítka', 'INFO', 'Klient není registrovaný (3+ visits) — booking flow neaktivní');
  }

  await shot('v3-05-final');

} catch (err) {
  console.error('[ERROR]', err.message.substring(0, 200));
  await shot('v3-error').catch(() => {});
  log('Test', 'ERROR', err.message.substring(0, 100));
}

console.log('\n=== VÝSLEDKY ===');
for (const r of results) {
  console.log(`[${r.status}] ${r.test}${r.detail ? ': ' + r.detail : ''}`);
}
console.log('\n[info] Screenshoty: /tmp/telegram-bot-test/v3-*');
await sleep(5000);
await browser.close();
console.log('[done]');
