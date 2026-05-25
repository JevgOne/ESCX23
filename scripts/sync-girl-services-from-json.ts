/**
 * Sync girl_services rows from the JSON array stored in girls.services.
 * Secretstory stored each girl's offered services as a JSON slug array
 * on the girls row. The earlier migrate-services.ts script only inserted
 * the 8 basic services and dropped every extra. This rebuilds girl_services
 * from the canonical JSON so every extras assignment is restored.
 */
import { db } from '../lib/db';

async function main() {
  const services = await db.execute(`SELECT id, slug, category FROM services`);
  const slugToId = new Map<string, number>();
  for (const r of services.rows) {
    slugToId.set(String(r.slug), Number(r.id));
  }

  const girls = await db.execute(`SELECT id, name, services FROM girls`);
  console.log(`Loaded ${girls.rows.length} girls and ${slugToId.size} services.`);

  let inserted = 0;
  let skippedUnknown = 0;
  let girlsTouched = 0;

  for (const g of girls.rows) {
    const girlId = Number(g.id);
    const raw = g.services == null ? '' : String(g.services).trim();
    if (!raw || raw === '[]') continue;

    let slugs: string[];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      slugs = parsed.map((s) => String(s));
    } catch {
      console.warn(`girl ${girlId} (${g.name}): invalid JSON, skipping`);
      continue;
    }

    const existing = await db.execute({
      sql: `SELECT service_id FROM girl_services WHERE girl_id = ?`,
      args: [girlId],
    });
    const existingIds = new Set(existing.rows.map((r) => Number(r.service_id)));

    let addedForGirl = 0;
    for (const slug of slugs) {
      const sid = slugToId.get(slug);
      if (!sid) { skippedUnknown++; continue; }
      if (existingIds.has(sid)) continue;
      await db.execute({
        sql: `INSERT INTO girl_services (girl_id, service_id, is_included, extra_price) VALUES (?, ?, 1, NULL)`,
        args: [girlId, sid],
      });
      inserted++;
      addedForGirl++;
    }
    if (addedForGirl > 0) {
      girlsTouched++;
      console.log(`  ${g.name} (#${girlId}): +${addedForGirl} services`);
    }
  }

  console.log(`\nDone. Inserted ${inserted} rows for ${girlsTouched} girls. Skipped ${skippedUnknown} unknown slugs.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
