/**
 * Migrate services table to Secretstory's 35 services.
 * - Map old slugs to new IDs where possible (preserves girl_services rows).
 * - Drop unmappable selections.
 */
import { db } from '../lib/db';
import { SERVICES } from '../lib/services';

// old slug → new Secretstory ID
const SLUG_MAP: Record<string, string> = {
  'klasicky-sex': 'classic',
  'oral-s-ochranou': 'blowjob_condom',
  'eroticka-masaz': 'erotic_massage',
  'mazleni': 'cuddling',
  'lizani-vsude': 'licking',
  'spolecna-sprcha': 'shared_shower',
  'francouzske-libani': 'kissing',
  'poloha-69': '69',
  'strikani-na-telo': 'cum_on_body',
  'oral-bez-ochrany': 'blowjob_no_condom',
  'strikani-do-ust': 'cim',
  'strikani-do-obliceje': 'cof',
  'hluboky-oral': 'deepthroat',
  'polyknuti': 'swallow',
  'analni-sex': 'anal_girl',
  'duo-service': 'lesbi_show',
  'striptyz': 'role_play',
  'hrani-roli': 'role_play',
  'prostatova-masaz': 'prostate_massage',
  'bdsm-lehke': 'light_sm',
  'nohy-fetis': 'foot_fetish',
  'zlaty-dest': 'piss_active',
  // unmappable (dropped): pse-pornstar-zkusenost, gfe-zkusenost-pritelkyne,
  //   strikani-divky, eroticke-pomucky, outcall, incall, overnight,
  //   vip-escort, dinner-date, travel-companion
};

async function main() {
  console.log('Starting services migration...');

  // 1. Load current girl_services + old slug map
  const oldServices = await db.execute(`SELECT id, slug FROM services`);
  const oldIdToSlug = new Map<number, string>();
  for (const r of oldServices.rows) {
    oldIdToSlug.set(Number(r.id), String(r.slug));
  }
  console.log(`Loaded ${oldIdToSlug.size} old services.`);

  const girlServices = await db.execute(`SELECT girl_id, service_id FROM girl_services`);
  console.log(`Loaded ${girlServices.rows.length} girl_services rows.`);

  // 2. Build girl_id → Set<new_slug> mapping (deduplicated)
  const girlNewSlugs = new Map<number, Set<string>>();
  let dropped = 0;
  for (const r of girlServices.rows) {
    const girlId = Number(r.girl_id);
    const oldSid = Number(r.service_id);
    const oldSlug = oldIdToSlug.get(oldSid);
    if (!oldSlug) { dropped++; continue; }
    const newSlug = SLUG_MAP[oldSlug];
    if (!newSlug) { dropped++; continue; }
    if (!girlNewSlugs.has(girlId)) girlNewSlugs.set(girlId, new Set());
    girlNewSlugs.get(girlId)!.add(newSlug);
  }
  console.log(`Mapped ${[...girlNewSlugs.values()].reduce((s, set) => s + set.size, 0)} assignments. Dropped ${dropped} unmappable.`);

  // 3. Wipe + reseed services table
  console.log('Wiping girl_services + services tables...');
  await db.execute(`DELETE FROM girl_services`);
  await db.execute(`DELETE FROM services`);

  console.log('Inserting 35 new services...');
  let newId = 1;
  const slugToNewId = new Map<string, number>();
  for (const s of SERVICES) {
    // DB CHECK constraint requires 'extras' (plural), our lib uses 'extra' (Secretstory parity)
    const dbCategory = s.category === 'extra' ? 'extras' : s.category;
    await db.execute({
      sql: `INSERT INTO services (id, slug, name_cs, name_en, name_de, name_uk, category, base_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      args: [newId, s.id, s.translations.cs, s.translations.en, s.translations.de, s.translations.uk, dbCategory],
    });
    slugToNewId.set(s.id, newId);
    newId++;
  }
  console.log(`Inserted ${newId - 1} services.`);

  // 4. Auto-include all 8 basic services for every girl
  const allGirls = await db.execute(`SELECT id FROM girls`);
  const basicSlugs = SERVICES.filter((s) => s.category === 'basic').map((s) => s.id);
  console.log(`Auto-including ${basicSlugs.length} basic services for ${allGirls.rows.length} girls.`);

  let inserted = 0;
  for (const g of allGirls.rows) {
    const girlId = Number(g.id);
    const set = girlNewSlugs.get(girlId) ?? new Set();
    // Always add all basic services
    for (const slug of basicSlugs) set.add(slug);

    for (const slug of set) {
      const newSid = slugToNewId.get(slug);
      if (!newSid) continue;
      await db.execute({
        sql: `INSERT INTO girl_services (girl_id, service_id, is_included, extra_price) VALUES (?, ?, 1, NULL)`,
        args: [girlId, newSid],
      });
      inserted++;
    }
  }
  console.log(`Inserted ${inserted} girl_services rows.`);

  console.log('Migration complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });
