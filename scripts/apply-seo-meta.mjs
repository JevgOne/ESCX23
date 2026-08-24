#!/usr/bin/env node
/**
 * Writes the reviewed meta titles/descriptions into seo_metadata and adds the
 * birthday discount, against the production Turso DB.
 *
 * This database is shared with the live site, so the script backs up every row
 * it is about to touch before touching it, refuses to run against a database
 * that does not look like ours, and only ever writes the fields listed here.
 *
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/apply-seo-meta.mjs --dry
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/apply-seo-meta.mjs --write
 */
import { createClient } from '@libsql/client';
import { writeFileSync } from 'node:fs';

const WRITE = process.argv.includes('--write');
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Chybí TURSO_DATABASE_URL nebo TURSO_AUTH_TOKEN.');
  process.exit(1);
}

/** page_path → { title, description }. Numbers verified against the live site. */
const META = {
  '/cs/divky': {
    meta_title: 'Společnice Praha — 15 ověřených dívek | LovelyGirls',
    meta_description:
      'Ověřené společnice v Praze s reálnými fotkami. Filtruj podle dostupnosti, čtvrti a služeb. Privátní apartmány Praha 2, 3 a 5, denně 10–22:30.',
  },
  '/en/divky': {
    meta_title: 'Prague Escort — 15 Verified Companions | LovelyGirls',
    meta_description:
      'Verified escorts in Prague with real photos. Filter by availability, district and services. Private flats in Prague 2, 3 and 5, daily 10:00–22:30.',
  },
  '/cs/cenik': {
    meta_title: 'Ceník escort Praha — od 2 000 Kč / 30 min | LovelyGirls',
    meta_description:
      'Pět programů od 30 do 120 minut: 30 min 2 000 Kč, 60 min 2 500 Kč, 120 min 4 500 Kč. Cena včetně apartmánu, platba hotově, žádné skryté poplatky.',
  },
  '/en/cenik': {
    meta_title: 'Prague Escort Prices — from 2,000 CZK / 30 min | LovelyGirls',
    meta_description:
      'Five programs from 30 to 120 minutes: 30 min 2,000 CZK, 60 min 2,500 CZK, 120 min 4,500 CZK. Apartment included, cash on arrival, no hidden fees.',
  },
  '/cs/faq': {
    meta_title: 'Časté dotazy — escort Praha | LovelyGirls',
    meta_description:
      'Je to legální? Jak se objednat? Kde a čím se platí? Odpovědi na rezervaci, diskrétnost, platby i průběh setkání. Bez obcházení.',
  },
  '/en/faq': {
    meta_title: 'Prague Escort FAQ — Booking, Prices, Discretion | LovelyGirls',
    meta_description:
      'Is it legal? How do I book? Where and how do I pay? Straight answers on booking, discretion, payment and what a meeting looks like.',
  },
};

const db = createClient({ url, authToken });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');

async function main() {
  // Refuse to touch a database that is not the site's.
  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('girls','seo_metadata','discounts')"
  );
  const found = tables.rows.map((r) => String(r.name));
  for (const t of ['girls', 'seo_metadata', 'discounts']) {
    if (!found.includes(t)) {
      console.error(`Tohle není produkční DB webu — chybí tabulka "${t}". Nic jsem nezapsal.`);
      process.exit(1);
    }
  }
  console.log(`Připojeno: ${url}`);

  // ---- backup first, always, even on a dry run ----
  const seoRows = await db.execute('SELECT * FROM seo_metadata');
  const discountRows = await db.execute('SELECT * FROM discounts');
  const backup = `seo-backup-${stamp}.json`;
  writeFileSync(
    backup,
    JSON.stringify({ takenAt: stamp, url, seo_metadata: seoRows.rows, discounts: discountRows.rows }, null, 2)
  );
  console.log(`Záloha: ${backup}  (${seoRows.rows.length} seo řádků, ${discountRows.rows.length} slev)\n`);

  const existing = new Map(seoRows.rows.map((r) => [String(r.page_path), r]));

  for (const [path, m] of Object.entries(META)) {
    const before = existing.get(path);
    console.log(`${path}`);
    console.log(`  teď:    ${before ? String(before.meta_title ?? '—') : '(řádek neexistuje)'}`);
    console.log(`  nově:   ${m.meta_title}`);
    if (!WRITE) continue;

    if (before) {
      await db.execute({
        sql: 'UPDATE seo_metadata SET meta_title = ?, meta_description = ?, updated_at = CURRENT_TIMESTAMP WHERE page_path = ?',
        args: [m.meta_title, m.meta_description, path],
      });
    } else {
      await db.execute({
        sql: `INSERT INTO seo_metadata (page_path, page_type, locale, meta_title, meta_description)
              VALUES (?, 'static', ?, ?, ?)`,
        args: [path, path.split('/')[1] || 'cs', m.meta_title, m.meta_description],
      });
    }
    console.log('  zapsáno');
  }

  // ---- birthday discount ----
  // It already exists in the table, just switched off — activate rather than
  // insert, so its wording and icon stay whatever the admin set.
  const birthday = discountRows.rows.find((r) =>
    String(r.name_cs ?? '').toLowerCase().includes('narozenin')
  );
  if (!birthday) {
    console.log('\nNarozeninová sleva: v tabulce není — nechávám být, přidej ji v adminu.');
  } else if (Number(birthday.is_active) === 1) {
    console.log('\nNarozeninová sleva: už je aktivní, nic neměním.');
  } else {
    console.log(`\nNarozeninová sleva (#${birthday.id}): vypnutá → zapnout`);
    if (WRITE) {
      await db.execute({
        sql: 'UPDATE discounts SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [birthday.id],
      });
      console.log('  zapnuta');
    }
  }

  console.log(WRITE ? '\nHotovo.' : '\nSuchý běh — nic se nezapsalo. Spusť s --write.');
}

main().catch((e) => {
  console.error('CHYBA:', e.message);
  process.exit(1);
});
