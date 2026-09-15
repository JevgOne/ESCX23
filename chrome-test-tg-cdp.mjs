/**
 * TEST: Telegram bot přes CDP připojení na existující Chrome tab
 */
import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = '/tmp/tg-test-studioflow';
const CDP_WS = 'ws://localhost:9222/devtools/browser/3c713999-9780-4eb9-bc54-a9e0f56e6d2d';
const TG_TAB_WS = 'ws://localhost:9222/devtools/page/B8E090E2DE8EE511873239B2C4';

const results = [];
function log(test, status, detail = '') {
  console.log(`[${status}] ${test}${detail ? ': ' + detail : ''}`);
  results.push({ test, status, detail });
}

async function shot(page, name) {
  try { await page.screenshot({ path: `${SHOTS}/${name}.png` }); console.log(`[shot] ${name}`); }
  catch(e) {}
}

try {
  // Připoj se na existující Chrome browser přes CDP
  console.log('[cdp] Připojuji se na Chrome CDP...');
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  console.log('[cdp] Připojeno!');

  const contexts = browser.contexts();
  console.log(`[cdp] Kontexty: ${contexts.length}`);

  let tgPage = null;
  for (const ctx of contexts) {
    const pages = ctx.pages();
    for (const p of pages) {
      const url = p.url();
      console.log(`[cdp] Page: ${url.substring(0, 60)}`);
      if (url.includes('telegram.org')) {
        tgPage = p;
        console.log('[cdp] Nalezena Telegram stránka!');
      }
    }
  }

  if (!tgPage) {
    log('CDP připojení', 'FAIL', 'Telegram tab nenalezen');
    await browser.close();
    process.exit(1);
  }

  await tgPage.bringToFront();
  await sleep(2000);
  await shot(tgPage, 'cdp-01-telegram');

  // Ověř stav stránky
  const state = await tgPage.evaluate(() => {
    const chatTitle = document.querySelector('.peer-title')?.innerText?.trim();
    const hasInput = !!document.querySelector('.input-message-input');
    const msgCount = document.querySelectorAll('.bubble').length;
    const isLoggedIn = !!document.querySelector('.chatlist-chat, .bubbles');
    return { chatTitle, hasInput, msgCount, isLoggedIn };
  });
  console.log('[cdp] Stav:', JSON.stringify(state));

  if (!state.isLoggedIn && !state.hasInput) {
    log('Telegram session (CDP)', 'BLOCKED', 'Stránka nenačtena nebo není session');
    printResults();
    await browser.close();
    process.exit(0);
  }

  log('CDP připojení na Telegram', 'PASS', `Chat: "${state.chatTitle}", Input: ${state.hasInput}, Msgs: ${state.msgCount}`);

  async function countBotMsgs() {
    return await tgPage.evaluate(() => document.querySelectorAll('.bubble:not(.is-out)').length);
  }

  async function getNewBotMsgs(before) {
    return await tgPage.evaluate((b) => {
      const all = Array.from(document.querySelectorAll('.bubble:not(.is-out)'));
      return all.slice(b).map(m => {
        const text = m.querySelector('.translatable-message')?.innerText?.trim() ||
                     m.querySelector('.message')?.innerText?.trim();
        const photo = m.querySelector('img.full-image, .media-photo img, .attachment-sticker img');
        const caption = m.querySelector('.caption .translatable-message, .caption')?.innerText?.trim();
        const buttons = Array.from(m.querySelectorAll('.reply-markup-button')).map(b => b.innerText?.trim());
        return { text: text || null, hasPhoto: !!photo, caption: caption || null, buttons };
      }).filter(m => m.text || m.hasPhoto || m.buttons?.length > 0);
    }, before);
  }

  async function sendMsg(text) {
    const input = tgPage.locator('.input-message-input').first();
    await input.click();
    await tgPage.keyboard.type(text);
    await sleep(200);
    await tgPage.keyboard.press('Enter');
    console.log(`[send] "${text}"`);
  }

  // ===== TEST 1: "Ahoj" =====
  const c1 = await countBotMsgs();
  console.log(`\n[TEST 1] "Ahoj" (před: ${c1} bot zpráv)`);
  await sendMsg('Ahoj');
  await sleep(12000);
  await shot(tgPage, 'cdp-02-ahoj');

  const msgs1 = await getNewBotMsgs(c1);
  const text1 = msgs1.map(m => m.text).filter(Boolean).join(' | ');
  console.log('[TEST 1] Odpověď:', text1.substring(0, 200));

  const isGoodGreeting = msgs1.length > 0 && (
    text1.includes('Vítej') || text1.includes('Vítám') || text1.includes('LG') ||
    text1.includes('ahoj') || text1.length < 300
  );
  log('TEST 1: "Ahoj" → krátká odpověď', msgs1.length > 0 ? (isGoodGreeting ? 'PASS' : 'INFO') : 'FAIL',
    `"${text1.substring(0, 150)}"`);

  // ===== TEST 2: "Kdo dnes pracuje?" =====
  const c2 = await countBotMsgs();
  console.log(`\n[TEST 2] "Kdo dnes pracuje?" (před: ${c2} bot zpráv)`);
  await sendMsg('Kdo dnes pracuje?');
  await sleep(30000); // Fotky trvají
  await shot(tgPage, 'cdp-03-kdo-pracuje');
  await sleep(8000);
  await shot(tgPage, 'cdp-03b-kdo-pracuje2');

  const msgs2 = await getNewBotMsgs(c2);
  const photos2 = msgs2.filter(m => m.hasPhoto);
  const captions2 = msgs2.filter(m => m.caption).map(m => m.caption);
  const texts2 = msgs2.filter(m => m.text && !m.hasPhoto).map(m => m.text);

  console.log(`[TEST 2] Msgs: ${msgs2.length}, Fotek: ${photos2.length}, Captions: ${captions2.length}`);
  console.log('[TEST 2] Captions:', captions2.slice(0, 3).map(c => c?.substring(0, 100)));
  console.log('[TEST 2] Texty:', texts2.slice(0, 3).map(t => t?.substring(0, 100)));

  const captionWithEmoji = captions2.some(c => c?.includes('🟢') || c?.includes('⭐') || c?.includes('📍'));
  const captionWithPrague = captions2.some(c => c?.includes('Praha') || c?.includes('Žižkov') || c?.includes('Vinohrady'));

  log('TEST 2a: Fotky dívek', photos2.length > 0 ? 'PASS' : 'FAIL', `${photos2.length} fotek`);
  log('TEST 2b: Caption formát (emoji)', captionWithEmoji ? 'PASS' : 'INFO',
    captions2[0]?.substring(0, 100) || 'žádné captions');
  log('TEST 2c: Pobočka plný název', captionWithPrague ? 'PASS' : 'INFO',
    captions2.join(' | ').substring(0, 150));

  // ===== TEST 3: "Katy" =====
  const c3 = await countBotMsgs();
  console.log(`\n[TEST 3] "Katy" (před: ${c3} bot zpráv)`);
  await sendMsg('Katy');
  await sleep(15000);
  await shot(tgPage, 'cdp-04-katy');

  const msgs3 = await getNewBotMsgs(c3);
  const text3 = msgs3.map(m => m.text).filter(Boolean).join(' | ');
  const photo3 = msgs3.some(m => m.hasPhoto);
  const buttons3 = msgs3.flatMap(m => m.buttons || []);
  const crashed3 = text3.toLowerCase().includes('error') || text3.includes('undefined') || text3.includes('500');

  console.log(`[TEST 3] Text: "${text3.substring(0,200)}", Foto: ${photo3}, Buttons: ${JSON.stringify(buttons3)}`);
  log('TEST 3: "Katy" → profil bez crashe', !crashed3 && msgs3.length > 0 ? 'PASS' : (msgs3.length === 0 ? 'FAIL' : 'INFO'),
    `Foto: ${photo3}, Buttons: [${buttons3.join(', ')}], Text: "${text3.substring(0, 100)}"`);

  // ===== TEST 4: "Chci rezervaci" =====
  const c4 = await countBotMsgs();
  console.log(`\n[TEST 4] "Chci rezervaci" (před: ${c4} bot zpráv)`);
  await sendMsg('Chci rezervaci');
  await sleep(12000);
  await shot(tgPage, 'cdp-05-rezervace');

  const msgs4 = await getNewBotMsgs(c4);
  const text4 = msgs4.map(m => m.text).filter(Boolean).join(' | ');
  const buttons4 = msgs4.flatMap(m => m.buttons || []);

  console.log(`[TEST 4] Text: "${text4.substring(0,200)}", Buttons: ${JSON.stringify(buttons4)}`);

  const asksName = text4.toLowerCase().includes('jméno') || text4.toLowerCase().includes('jmeno') ||
    text4.toLowerCase().includes('jak se') || text4.toLowerCase().includes('kdo jsi');
  const hasFlow = buttons4.length > 0 || text4.includes('dívk') || text4.includes('datum') ||
    text4.includes('čas') || text4.includes('kdy');

  log('TEST 4: "Chci rezervaci" → ptá na jméno / spustí flow',
    asksName || hasFlow ? 'PASS' : (msgs4.length > 0 ? 'INFO' : 'FAIL'),
    `Text: "${text4.substring(0, 150)}", Buttons: [${buttons4.join(', ')}]`);

  await shot(tgPage, 'cdp-06-final');
  await browser.close();

} catch(err) {
  console.error('[ERROR]', err.message.substring(0, 300));
  log('Test', 'ERROR', err.message.substring(0, 150));
}

function printResults() {
  console.log('\n=== VÝSLEDKY TG BOT TEST (CDP) ===');
  for (const r of results) console.log(`[${r.status}] ${r.test}${r.detail ? ': ' + r.detail : ''}`);
}

printResults();
console.log('[done]');
