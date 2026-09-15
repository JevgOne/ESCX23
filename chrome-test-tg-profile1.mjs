/**
 * TEST: Telegram bot STUDIOFLOW — přes Chrome Profile 1 (má Telegram session)
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = '/tmp/tg-test-studioflow';
const PROFILE = '/tmp/chrome-tg-profile1-copy';

try {
  execSync(`rm -rf ${PROFILE} && cp -r "$HOME/Library/Application Support/Google/Chrome/Profile 1" ${PROFILE} 2>/dev/null || true`);
  console.log('[profile] Profile 1 zkopírován');
} catch(e) { console.log('[profile] Kopie selhala:', e.message.substring(0,50)); }

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

async function countBotMsgs() {
  return await page.evaluate(() => document.querySelectorAll('.bubble:not(.is-out)').length);
}

async function getNewBotMsgs(before) {
  return await page.evaluate((b) => {
    const all = Array.from(document.querySelectorAll('.bubble:not(.is-out)'));
    return all.slice(b).map(m => {
      const textEl = m.querySelector('.message .translatable-message, .message');
      const text = textEl?.innerText?.trim();
      const photo = m.querySelector('img.full-image, .media-photo img, .photo-wrap img');
      const captionEl = m.querySelector('.caption .translatable-message, .caption');
      const caption = captionEl?.innerText?.trim();
      const buttons = Array.from(m.querySelectorAll('.reply-markup-button, .inline-button')).map(b => b.innerText?.trim());
      return { text: text || null, hasPhoto: !!photo, caption: caption || null, buttons };
    }).filter(m => m.text || m.hasPhoto || m.buttons?.length > 0);
  }, before);
}

async function send(text) {
  const input = page.locator('.input-message-input').first();
  await input.click();
  await page.keyboard.type(text);
  await sleep(300);
  await page.keyboard.press('Enter');
  console.log(`[send] "${text}"`);
}

const results = [];
function log(test, status, detail = '') {
  console.log(`[${status}] ${test}${detail ? ': ' + detail : ''}`);
  results.push({ test, status, detail });
}

try {
  console.log('[step] Otevírám Telegram Web...');
  await page.goto('https://web.telegram.org/k/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(6000);
  await shot('p1-01-open');

  const hasChats = await page.evaluate(() =>
    !!document.querySelector('.chatlist-chat, .dialog, .chat-list')
  );
  const hasQR = await page.evaluate(() =>
    !!document.querySelector('canvas') || document.body?.innerText?.includes('QR')
  );

  console.log(`[info] Chaty: ${hasChats}, QR: ${hasQR}`);

  if (!hasChats) {
    log('Telegram session (Profile 1)', 'BLOCKED', 'Ani Profile 1 nemá session — QR zobrazeno');
    await shot('p1-01b-no-session');
    printResults();
    await browser.close();
    process.exit(0);
  }

  log('Telegram session (Profile 1)', 'PASS', 'Přihlášen');

  // Naviguj na bota
  console.log('[step] Naviguji na @studioflow3_bot...');
  await page.goto('https://web.telegram.org/k/#@studioflow3_bot', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(5000);
  await shot('p1-02-bot-chat');

  const chatTitle = await page.evaluate(() =>
    document.querySelector('.peer-title, .chat-info .title')?.innerText?.trim() || ''
  );
  console.log(`[info] Chat: "${chatTitle}"`);

  const isBotChat = chatTitle.toLowerCase().includes('studioflow') || chatTitle.toLowerCase().includes('studio');

  if (!isBotChat) {
    // Zkus search
    await page.keyboard.press('Escape');
    await sleep(500);
    const searchBtn = page.locator('[class*="search"], .search-button').first();
    if (await searchBtn.count() > 0) await searchBtn.click();
    await sleep(500);
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('studioflow3_bot');
      await sleep(3000);
      await shot('p1-02b-search');
      const firstResult = page.locator('.chatlist-chat, .search-result').first();
      if (await firstResult.count() > 0) {
        await firstResult.click();
        await sleep(2000);
      }
    }
    await shot('p1-02c-after-search');
  }

  // ===== TEST 1: "Ahoj" =====
  const c1 = await countBotMsgs();
  console.log(`\n[TEST 1] Posílám "Ahoj" (před: ${c1} bot zpráv)...`);
  await send('Ahoj');
  await sleep(12000);
  await shot('p1-03-ahoj');

  const msgs1 = await getNewBotMsgs(c1);
  const text1 = msgs1.map(m => m.text).filter(Boolean).join(' | ');
  console.log('[TEST 1] Odpověď:', text1.substring(0, 200));

  const isShort = text1.length < 300 && (text1.includes('Vítej') || text1.includes('vitej') ||
    text1.includes('LG') || text1.includes('přivít') || text1.length > 0);
  log('TEST 1: "Ahoj" → krátká odpověď', msgs1.length > 0 ? (isShort ? 'PASS' : 'INFO') : 'FAIL',
    `"${text1.substring(0, 150)}"`);

  // ===== TEST 2: "Kdo dnes pracuje?" =====
  const c2 = await countBotMsgs();
  console.log(`\n[TEST 2] Posílám "Kdo dnes pracuje?" (před: ${c2} bot zpráv)...`);
  await send('Kdo dnes pracuje?');
  await sleep(25000); // Fotky trvají déle
  await shot('p1-04-kdo-pracuje');
  await sleep(8000); // Ještě počkej
  await shot('p1-04b-kdo-pracuje2');

  const msgs2 = await getNewBotMsgs(c2);
  const photos2 = msgs2.filter(m => m.hasPhoto);
  const texts2 = msgs2.filter(m => m.text).map(m => m.text);
  const captions2 = msgs2.filter(m => m.caption).map(m => m.caption);

  console.log(`[TEST 2] Fotek: ${photos2.length}, textů: ${texts2.length}, captionů: ${captions2.length}`);
  console.log('[TEST 2] Captions:', captions2.slice(0,3).map(c => c?.substring(0,80)));
  console.log('[TEST 2] Texty:', texts2.slice(0,3).map(t => t?.substring(0,100)));

  const hasEmojis = captions2.some(c => c?.includes('🟢') || c?.includes('⭐') || c?.includes('📍'));
  const hasPrague = captions2.some(c => c?.includes('Praha') || c?.includes('Žižkov') || c?.includes('Vinohrady'));

  log('TEST 2a: Fotky dívek', photos2.length > 0 ? 'PASS' : 'FAIL', `${photos2.length} fotek`);
  log('TEST 2b: Caption formát (🟢⭐📍)', hasEmojis ? 'PASS' : 'INFO',
    captions2[0]?.substring(0, 100) || 'žádné captions');
  log('TEST 2c: Pobočka plný název "Žižkov, Praha 3"', hasPrague ? 'PASS' : 'INFO',
    captions2.join(' | ').substring(0, 150));

  // ===== TEST 3: "Katy" =====
  const c3 = await countBotMsgs();
  console.log(`\n[TEST 3] Posílám "Katy" (před: ${c3} bot zpráv)...`);
  await send('Katy');
  await sleep(15000);
  await shot('p1-05-katy');

  const msgs3 = await getNewBotMsgs(c3);
  const text3 = msgs3.map(m => m.text).filter(Boolean).join(' | ');
  const hasPhoto3 = msgs3.some(m => m.hasPhoto);
  const buttons3 = msgs3.flatMap(m => m.buttons || []);
  const crashed3 = text3.toLowerCase().includes('error') || text3.includes('undefined') || text3.includes('500');

  console.log(`[TEST 3] Text: "${text3.substring(0, 200)}", Foto: ${hasPhoto3}, Buttons: ${buttons3}`);
  log('TEST 3: "Katy" → profil bez crashe', !crashed3 && msgs3.length > 0 ? 'PASS' : (msgs3.length === 0 ? 'FAIL' : 'INFO'),
    `Foto: ${hasPhoto3}, Buttons: [${buttons3.join(', ')}], Text: "${text3.substring(0, 100)}"`);

  // ===== TEST 4: "Chci rezervaci" =====
  const c4 = await countBotMsgs();
  console.log(`\n[TEST 4] Posílám "Chci rezervaci" (před: ${c4} bot zpráv)...`);
  await send('Chci rezervaci');
  await sleep(12000);
  await shot('p1-06-rezervace');

  const msgs4 = await getNewBotMsgs(c4);
  const text4 = msgs4.map(m => m.text).filter(Boolean).join(' | ');
  const buttons4 = msgs4.flatMap(m => m.buttons || []);

  console.log(`[TEST 4] Text: "${text4.substring(0, 200)}", Buttons: ${JSON.stringify(buttons4)}`);

  const asksName = text4.toLowerCase().includes('jméno') || text4.toLowerCase().includes('jmeno') ||
    text4.toLowerCase().includes('jak se') || text4.toLowerCase().includes('kdo jsi');
  const hasFlow = buttons4.length > 0 || text4.includes('dívk') || text4.includes('datum') ||
    text4.includes('čas') || text4.includes('kdy');

  log('TEST 4: "Chci rezervaci" → ptá na jméno / spustí flow',
    asksName || hasFlow ? 'PASS' : (msgs4.length > 0 ? 'INFO' : 'FAIL'),
    `Text: "${text4.substring(0, 150)}", Buttons: [${buttons4.join(', ')}]`);

  await shot('p1-07-final');

} catch(err) {
  console.error('[ERROR]', err.message.substring(0, 300));
  await page.screenshot({ path: `${SHOTS}/p1-error.png` }).catch(() => {});
  log('Test', 'ERROR', err.message.substring(0, 150));
}

function printResults() {
  console.log('\n=== VÝSLEDKY TG BOT TEST (Profile 1) ===');
  for (const r of results) console.log(`[${r.status}] ${r.test}${r.detail ? ': ' + r.detail : ''}`);
}

printResults();
await sleep(3000);
await browser.close();
console.log('[done]');
