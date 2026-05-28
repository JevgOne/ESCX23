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

const prod = createClient({ url, authToken });
const local = createClient({ url: 'file:./data/app.db' });

// Get girls slug → id map on both sides
const localGirls = await local.execute('SELECT id, slug FROM girls');
const prodGirls = await prod.execute('SELECT id, slug FROM girls');

const localIdToSlug = new Map(localGirls.rows.map((r) => [Number(r.id), String(r.slug)]));
const prodSlugToId = new Map(prodGirls.rows.map((r) => [String(r.slug), Number(r.id)]));

console.log(`Local girls: ${localGirls.rows.length}`);
console.log(`Prod girls: ${prodGirls.rows.length}`);

// Get local schedules
const sched = await local.execute('SELECT girl_id, day_of_week, start_time, end_time, is_active FROM girl_schedules WHERE is_active = 1');
console.log(`Local schedule rows: ${sched.rows.length}`);

// Wipe + insert
await prod.execute('DELETE FROM girl_schedules');
let inserted = 0;
let skipped = 0;
for (const r of sched.rows) {
  const slug = localIdToSlug.get(Number(r.girl_id));
  if (!slug) { skipped++; continue; }
  const prodGirlId = prodSlugToId.get(slug);
  if (!prodGirlId) { skipped++; continue; }
  await prod.execute({
    sql: `INSERT INTO girl_schedules (girl_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?)`,
    args: [prodGirlId, Number(r.day_of_week), String(r.start_time), String(r.end_time), 1],
  });
  inserted++;
}
console.log(`Inserted ${inserted}, skipped ${skipped} (no matching prod girl)`);
