import { db } from '../lib/db';
async function main() {
  const r = await db.execute(`SELECT COUNT(*) as c FROM girl_services`);
  console.log('Total girl_services rows:', r.rows[0].c);
  const r2 = await db.execute(`SELECT s.slug, s.name_cs, COUNT(gs.girl_id) as count FROM services s LEFT JOIN girl_services gs ON gs.service_id = s.id GROUP BY s.id ORDER BY count DESC LIMIT 40`);
  console.log('\nUsage per service:');
  for (const row of r2.rows) console.log(`  ${row.count} × ${row.slug} (${row.name_cs})`);
}
main().catch(e => { console.error(e); process.exit(1); });
