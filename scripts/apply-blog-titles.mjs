#!/usr/bin/env node
/**
 * Shortens the blog post titles that ran past what Google shows.
 *
 * Applied to production on 2026-08-27; kept here so the change is reviewable
 * and reversible rather than living only in a terminal. Rerunning it is a
 * no-op — it writes the same values.
 *
 * Why: the audit found 18 titles over ~65 characters, three of them past 100.
 * The template's double brand accounted for most of the 131 findings and was
 * fixed in code (6e6632e); these are the ones that were long on their own.
 * "Z archivu", "Kompletní" and "An Interview With" carried no search value, so
 * they went first and the search phrase moved to the front.
 *
 * Backs up every row it touches before writing, refuses a database that does
 * not look like ours, and only ever writes title_cs and title_en.
 *
 *   node scripts/apply-blog-titles.mjs --dry     # local data/app.db
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/apply-blog-titles.mjs --dry
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/apply-blog-titles.mjs --write
 */
import { createClient } from '@libsql/client';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
const url = process.env.TURSO_DATABASE_URL || `file:${join(ROOT, 'data/app.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;
const isRemote = !url.startsWith('file:');

if (isRemote && !authToken) {
  console.error('Vzdálená DB bez TURSO_AUTH_TOKEN.');
  process.exit(1);
}
if (WRITE && !isRemote) {
  console.error('--write proti lokální DB nedává smysl. Nastav TURSO_DATABASE_URL.');
  process.exit(1);
}

/** slug → { cs, en }; null means that locale was already short enough. */
const TITLES = {
  'adriana---dominantni-brunetka-privat-praha-s-gfe-zazitkem': {
    cs: 'Rozhovor s Adrianou: dominantní bruneta a GFE v Praze',
    en: 'Interview With Adriana: Dominant Brunette, GFE in Prague',
  },
  'daniela---submisivni-brunetka-privat-praha-s-gfe-zazitkem': {
    cs: 'Rozhovor s Danielou: submisivní bruneta a GFE v Praze',
    en: 'Interview With Daniela: Submissive Brunette, GFE in Prague',
  },
  'ema---young-blonde-escort-prague-for-sensual-gfe-experience': {
    cs: 'Rozhovor s Emou: mladá blondýna a smyslné GFE v Praze',
    en: 'Interview With Ema: Young Blonde and Sensual GFE in Prague',
  },
  'vip-escort-praha': {
    cs: 'VIP escort Praha: co ten pojem znamená a co dostanete',
    en: 'VIP Escort in Prague: What the Label Actually Means',
  },
  'girlfriend-experience-gfe-praha': {
    cs: 'Girlfriend Experience (GFE) Praha: co to je a proč táhne',
    en: 'Girlfriend Experience (GFE) in Prague: What It Is',
  },
  'soukrome-apartmany-escort-praha': {
    cs: 'Soukromé apartmány pro escort v Praze: diskrétnost a klid',
    en: 'Private Escort Apartments in Prague: Discretion and Comfort',
  },
  'kalendar-dostupnosti-jak-ho-cist-a-rychle-domluvit': {
    cs: 'Rozvrh společnic: jak ho číst a rychle se domluvit',
    en: null,
  },
  'escort-praha-kompletni-pruvodce': {
    cs: 'Escort Praha 2026: průvodce diskrétními setkáními',
    en: null,
  },
  'ceny-escortu-v-praze-co-ovlivnuje-cenu': {
    cs: 'Ceny escortu v Praze: co je ovlivňuje a kolik zaplatíte',
    en: 'Escort Prices in Prague: What Drives the Cost',
  },
  'prvni-navsteva-escort-agentury': {
    cs: 'První návštěva escort agentury: návod krok za krokem',
    en: 'Your First Visit to an Escort Agency: Step by Step',
  },
  'jak-vybrat-bezpecnou-escort-platformu': {
    cs: 'Jak vybrat bezpečnou eskortní platformu: na co se dívat',
    en: null,
  },
  'jak-vybrat-spolecnici-praha': {
    cs: null,
    en: 'How to Choose a Companion in Prague: 7 Client Tips',
  },
  'diskretni-setkani-praha': {
    cs: null,
    en: 'Discreet Meetings in Prague: Privacy and Security',
  },
};

const MAX = 65;
const db = createClient(isRemote ? { url, authToken } : { url });

async function main() {
  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('blog_posts','girls')",
  );
  const found = tables.rows.map((r) => String(r.name));
  for (const t of ['blog_posts', 'girls']) {
    if (!found.includes(t)) {
      console.error(`Tohle není produkční DB webu — chybí tabulka "${t}". Nic jsem nezapsal.`);
      process.exit(1);
    }
  }
  console.log(`Připojeno: ${isRemote ? url : 'LOKÁLNÍ ' + url}`);
  console.log(WRITE ? 'Režim: ZÁPIS\n' : 'Režim: suchý běh\n');

  const slugs = Object.keys(TITLES);
  const rows = await db.execute({
    sql: `SELECT slug, title_cs, title_en FROM blog_posts WHERE slug IN (${slugs.map(() => '?').join(',')})`,
    args: slugs,
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(ROOT, 'backups');
  mkdirSync(backupDir, { recursive: true });
  const backup = join(backupDir, `blog-titles-${stamp}.json`);
  writeFileSync(backup, JSON.stringify({ takenAt: stamp, url, rows: rows.rows }, null, 2));
  console.log(`Záloha: ${backup} (${rows.rows.length} článků)\n`);

  if (rows.rows.length !== slugs.length) {
    const have = new Set(rows.rows.map((r) => String(r.slug)));
    console.error(`V DB chybí: ${slugs.filter((s) => !have.has(s)).join(', ')}. Nic nezapisuji.`);
    process.exit(1);
  }

  const current = new Map(rows.rows.map((r) => [String(r.slug), r]));

  for (const [slug, t] of Object.entries(TITLES)) {
    const before = current.get(slug);
    const sets = [];
    const args = [];

    for (const loc of ['cs', 'en']) {
      const value = t[loc];
      if (!value) continue;
      if (value.length > MAX) {
        console.error(`  ${slug} (${loc}): návrh má ${value.length} znaků, limit je ${MAX}. Nic nezapisuji.`);
        process.exit(1);
      }
      sets.push(`title_${loc}=?`);
      args.push(value);
    }
    if (!sets.length) continue;

    console.log(slug);
    for (const loc of ['cs', 'en']) {
      if (!t[loc]) continue;
      const old = String(before[`title_${loc}`] ?? '');
      console.log(`  ${loc}  ${old.length} → ${t[loc].length} zn.`);
      console.log(`      ${t[loc]}`);
    }
    if (!WRITE) continue;

    args.push(slug);
    await db.execute({
      sql: `UPDATE blog_posts SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE slug = ?`,
      args,
    });
    console.log('  zapsáno');
  }

  console.log(WRITE ? '\nHotovo.' : '\nSuchý běh — nic se nezapsalo. Spusť s --write.');
}

main().catch((e) => {
  console.error('CHYBA:', e.message);
  process.exit(1);
});
