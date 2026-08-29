import { chromium } from 'playwright';
const B='https://www.lovelygirls.cz';
const PAGES=['/','/cs','/girls','/cs/divky','/cs/rozvrh','/cs/profil/luna','/cs/cenik'];
const b=await chromium.launch();
const out=[];
for(const path of PAGES){
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'});
  const p=await ctx.newPage();
  const res=[];
  p.on('response',async r=>{
    try{ const h=r.headers(); res.push({u:r.url(),t:(h['content-type']||'').split(';')[0],
      s:Number(h['content-length']||0)}); }catch{}
  });
  await ctx.addCookies([{name:'age_verified',value:'1',domain:'www.lovelygirls.cz',path:'/'}]);
  const t0=Date.now();
  await p.goto(B+path,{waitUntil:'load',timeout:60000});
  const m=await p.evaluate(()=>new Promise(res=>{
    let lcp=0,cls=0;
    new PerformanceObserver(l=>{for(const e of l.getEntries())lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)cls+=e.value;}).observe({type:'layout-shift',buffered:true});
    setTimeout(()=>{
      const nav=performance.getEntriesByType('navigation')[0]||{};
      const fcp=(performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime||0;
      res({lcp:Math.round(lcp),cls:+cls.toFixed(3),fcp:Math.round(fcp),
        ttfb:Math.round(nav.responseStart||0),dom:document.querySelectorAll('*').length});
    },4000);
  }));
  const by={};
  for(const r of res){ const k=r.t.includes('javascript')?'JS':r.t.includes('css')?'CSS':r.t.startsWith('image')?'obrázky':r.t.includes('html')?'HTML':r.t.includes('font')?'fonty':'jiné';
    by[k]=(by[k]||0)+r.s; }
  const kb=n=>Math.round((n||0)/1024);
  out.push({path,...m,celkem:kb(Object.values(by).reduce((a,c)=>a+c,0)),
    js:kb(by.JS),img:kb(by['obrázky']),css:kb(by.CSS),html:kb(by.HTML),req:res.length});
  await ctx.close();
}
await b.close();
console.log('MOBIL (iPhone, 390px)\n');
console.log('stránka'.padEnd(20),'LCP'.padStart(7),'CLS'.padStart(7),'FCP'.padStart(7),'TTFB'.padStart(6),'DOM'.padStart(6),'JS kB'.padStart(7),'obr kB'.padStart(7),'celk kB'.padStart(8),'req'.padStart(5));
for(const o of out) console.log(o.path.padEnd(20),String(o.lcp).padStart(7),String(o.cls).padStart(7),String(o.fcp).padStart(7),String(o.ttfb).padStart(6),String(o.dom).padStart(6),String(o.js).padStart(7),String(o.img).padStart(7),String(o.celkem).padStart(8),String(o.req).padStart(5));
console.log('\nprahy: LCP dobré <2500 ms · špatné >4000 | CLS dobré <0.1 · špatné >0.25');
