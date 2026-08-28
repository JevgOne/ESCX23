import { webkit, chromium } from 'playwright';
for (const [jmeno, engine] of [['WebKit (Safari)', webkit], ['Chromium', chromium]]) {
  let b;
  try { b = await engine.launch(); }
  catch(e) { console.log(`${jmeno}: nelze spustit — ${e.message.slice(0,60)}`); continue; }
  const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
  const hops=[];
  p.on('framenavigated', f=>{ if(f===p.mainFrame()) hops.push(f.url().replace('https://www.lovelygirls.cz','')||'/'); });
  await p.goto('https://www.lovelygirls.cz/',{waitUntil:'domcontentloaded'});
  const g=await p.$('[class*="age-gate"] button'); if(g){await g.click().catch(()=>{});await p.waitForTimeout(700);}
  await p.click('.lang-switcher summary'); await p.waitForTimeout(400);
  const cs=await p.$('.lang-switcher-menu a[hreflang="cs"]');
  const href=cs ? await cs.getAttribute('href') : '(nenalezen)';
  hops.length=0;
  if(cs) await cs.click();
  await p.waitForTimeout(3000);
  console.log(`${jmeno}`);
  console.log(`   href v HTML : ${href}`);
  console.log(`   skončil na  : ${p.url()}`);
  console.log(`   skoky       : ${hops.join('  →  ')||'(žádné)'}`);
  console.log(`   H1          : ${(await p.textContent('h1').catch(()=>'—'))?.replace(/\s+/g,' ').trim().slice(0,50)}`);
  await b.close();
}
