import { createClient } from '@libsql/client';
import fs from 'node:fs';

const envText = fs.readFileSync('.env.production', 'utf8');
const env = {};
for (const line of envText.split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq <= 0) continue;
  const key = line.slice(0, eq).trim();
  let val = line.slice(eq + 1).trim();
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  env[key] = val;
}

const url = env.TURSO_DATABASE_URL;
const authToken = env.TURSO_AUTH_TOKEN;

if (!url) { console.error('No TURSO_DATABASE_URL'); process.exit(1); }

const db = createClient({ url, authToken });

const posts = [
  {
    slug: 'pruvodce-escort-praha',
    title: 'Průvodce escort službami v Praze',
    excerpt: 'Co očekávat, jak vybrat společnici a na co se zeptat. Praktický průvodce diskrétními setkáními v Praze.',
    content: '# Průvodce escort službami v Praze\n\nPraha je jednou z nejvyhledávanějších destinací pro premium escort služby v Evropě. V tomto průvodci najdete vše, co potřebujete vědět pro první návštěvu — jak vybírat ověřené společnice, na co se zeptat, jak probíhá komunikace a co očekávat během setkání.\n\n## Ověřené profily jsou základ\n\nVe světě escort služeb je důvěra klíčová. LovelyGirls Praha osobně ověřuje každou společnici. Fotografie odpovídají realitě, profily nejsou retušované přes míru a jména jsou jejich vlastní pseudonymy.\n\n## Diskrétní apartmány\n\nVšechny naše čtyři apartmány leží v centru Prahy (Praha 1, 2, 3, 8). Diskrétní vstup, soukromý vchod, klimatizace, sprcha. Adresu obdržíte až po potvrzení termínu.\n\n## Hotovostní platba\n\nPlatba probíhá v hotovosti v apartmánu — v Kč nebo EUR. Žádné karty, žádné účtenky. Plná diskrétnost.',
    cover_url: null,
    author: 'LovelyGirls Praha',
  },
  {
    slug: 'tipy-pro-prvni-navstevu',
    title: 'Tipy pro první návštěvu',
    excerpt: 'Co dělat a čemu se vyhnout při prvním setkání. Jak se připravit, jak komunikovat a co očekávat.',
    content: '# Tipy pro první návštěvu\n\nPřišel čas na první setkání. Tady je deset zlatých pravidel, která vám usnadní orientaci a postarají se o to, aby byl zážitek pro obě strany příjemný.\n\n1. **Komunikujte předem.** Přes WhatsApp nebo Telegram dohodněte čas, program a apartmán.\n2. **Buďte přesný.** Pozdní příchod krátí váš čas.\n3. **Hotovost připravená.** Platba se řeší na začátku setkání.\n4. **Diskrétnost je oboustranná.** Nevoláme, neposíláme SMS po setkání.\n5. **Respekt.** Společnice mají právo odmítnout cokoli, co se neslíbilo předem.',
    cover_url: null,
    author: 'LovelyGirls Praha',
  },
  {
    slug: 'nase-apartmany',
    title: 'Naše diskrétní apartmány',
    excerpt: 'Čtyři apartmány v centru Prahy. Vybavení, lokace, dostupnost MHD. Co najdete v každém z nich.',
    content: '# Naše diskrétní apartmány\n\nLovelyGirls Praha provozuje čtyři privátní apartmány v centru Prahy. Každý je vybavený diskrétně, ale nadstandardně — soukromý vchod ze dvora, plně zařízený byt, klimatizace, sprcha, Wi-Fi.\n\n## Vinohrady (Praha 2)\nHlavní pobočka. Vinohradská třída, výborná dostupnost MHD — metro a tramvaj minutu pěšky.\n\n## Karlín (Praha 8)\nModerní lokalita, pět minut od metra Florenc.\n\n## Nové Město (Praha 1)\nCentrum, dva kroky od Václavského náměstí.\n\n## Žižkov (Praha 3)\nKlidná čtvrť, snadný příjezd autem, modré zóny v okolí.',
    cover_url: null,
    author: 'LovelyGirls Praha',
  },
  {
    slug: 'verifikace-profilu',
    title: 'Jak ověřujeme profily našich společnic',
    excerpt: 'Proces verifikace profilů: osobní setkání, fotografie, identita. Proč na ověření klademe důraz.',
    content: '# Jak ověřujeme profily našich společnic\n\nVerifikace není jen razítko — je to základní pilíř důvěry. Ke každé společnici v naší agentuře přistupujeme osobně. \n\n## Osobní setkání\nKaždá společnice prochází osobním pohovorem před zveřejněním profilu.\n\n## Fotografie\nFotografie pořizujeme nebo schvalujeme my. Žádné retušování přes míru, žádné fake fotky.\n\n## Identita\nVerifikujeme občanský průkaz a kontaktní údaje. Údaje samozřejmě nikam nepublikujeme.\n\n## Pravidelná aktualizace\nKaždé 3 měsíce ověřujeme aktivní profily — fotky, dostupnost, kontaktní údaje.',
    cover_url: null,
    author: 'LovelyGirls Praha',
  },
];

const existing = await db.execute('SELECT slug FROM blog_posts WHERE status = ?', ['published']);
const existingSlugs = new Set(existing.rows.map((r) => String(r.slug)));
console.log(`Existing published posts: ${existingSlugs.size}`);

let inserted = 0;
for (const p of posts) {
  if (existingSlugs.has(p.slug)) {
    console.log(`SKIP exists: ${p.slug}`);
    continue;
  }
  await db.execute({
    sql: `INSERT INTO blog_posts (slug, title, excerpt, content, cover_url, author, status)
          VALUES (?, ?, ?, ?, ?, ?, 'published')`,
    args: [p.slug, p.title, p.excerpt, p.content, p.cover_url, p.author],
  });
  inserted++;
  console.log(`INSERTED: ${p.slug}`);
}
console.log(`Done. Inserted ${inserted} posts.`);
