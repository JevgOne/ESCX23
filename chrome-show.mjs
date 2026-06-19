import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 400 });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// --- Tab 1: Admin login → Rezervace ---
const p1 = await ctx.newPage();
await p1.goto('http://localhost:3000/cs/admin/login');
await sleep(1200);
await p1.fill('input[type="email"]', 'info@lovelygirls.cz');
await p1.fill('input[type="password"]', 'test123');
await p1.click('button[type="submit"]');
await sleep(2500);
await p1.goto('http://localhost:3000/cs/admin/rezervace');
await sleep(3000);
// Scroll dolů ke Google Kalendářům
await p1.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
await sleep(2000);

// --- Tab 2: Studio login → Kalendář ---
const p2 = await ctx.newPage();
await p2.goto('http://localhost:3000/cs/studio/login');
await sleep(1200);
await p2.fill('input[type="email"]', 'lunamanazer@gmail.com');
await p2.fill('input[type="password"]', 'test123');
await p2.click('button[type="submit"]');
await sleep(2500);
await p2.goto('http://localhost:3000/cs/studio/kalendar');
await sleep(3000);

// Screenshoty
await p1.bringToFront();
await sleep(1000);
await p1.screenshot({ path: '/tmp/admin-rezervace-iframe.png', fullPage: true });

await p2.bringToFront();
await sleep(1000);
await p2.screenshot({ path: '/tmp/studio-kalendar-redesign.png', fullPage: true });

console.log('Screenshots saved. Browser stays open for 30s...');
await sleep(30000);
await browser.close();
