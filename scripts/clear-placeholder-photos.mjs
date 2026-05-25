/**
 * One-off script: lists all girl_photos rows that still use picsum/placeholder URLs.
 * Run this when you want to review which photos need to be re-uploaded.
 *
 * Usage:
 *   node scripts/clear-placeholder-photos.mjs
 *
 * To actually delete them, change DRY_RUN to false below.
 */

import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

const db = createClient({ url: `file:${dbPath}` });

const DRY_RUN = true;

const placeholders = await db.execute({
  sql: `SELECT id, girl_id, url FROM girl_photos WHERE url LIKE '%picsum%' OR url LIKE '%placehold%' OR url LIKE '%placeholder%'`,
  args: [],
});

console.log(`Found ${placeholders.rows.length} placeholder photo(s):\n`);

for (const row of placeholders.rows) {
  console.log(`  id=${row.id}  girl_id=${row.girl_id}  url=${row.url}`);
}

if (DRY_RUN) {
  console.log('\nDRY_RUN=true — nothing deleted. Set DRY_RUN=false to actually delete.');
} else {
  const ids = placeholders.rows.map((r) => r.id);
  if (ids.length === 0) {
    console.log('Nothing to delete.');
  } else {
    const placeholderList = ids.map(() => '?').join(',');
    const del = await db.execute({
      sql: `DELETE FROM girl_photos WHERE id IN (${placeholderList})`,
      args: ids,
    });
    console.log(`\nDeleted ${del.rowsAffected} row(s).`);
  }
}
