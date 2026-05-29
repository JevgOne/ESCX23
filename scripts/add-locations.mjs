#!/usr/bin/env node
/**
 * Add Praha 3 and Praha 5 locations to production DB.
 * Usage: node scripts/add-locations.mjs
 * Requires: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars
 */
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('Missing TURSO_DATABASE_URL or DATABASE_URL');
  process.exit(1);
}

const db = createClient({ url, ...(authToken ? { authToken } : {}) });

// Check existing
const before = await db.execute('SELECT id, name, display_name FROM locations ORDER BY id');
console.log(`Before: ${before.rows.length} locations`);
for (const r of before.rows) {
  console.log(`  id=${r.id} name=${r.name} display=${r.display_name}`);
}

// Add Praha 3 if not exists
const has3 = before.rows.some(r => r.name === 'praha-3');
if (!has3) {
  await db.execute({
    sql: `INSERT INTO locations (name, display_name, district, city, is_active, is_primary) VALUES (?, ?, ?, ?, 1, 0)`,
    args: ['praha-3', 'Praha 3 — Žižkov', 'Praha 3', 'Praha'],
  });
  console.log('Added Praha 3 — Žižkov');
} else {
  console.log('Praha 3 already exists');
}

// Add Praha 5 if not exists
const has5 = before.rows.some(r => r.name === 'praha-5');
if (!has5) {
  await db.execute({
    sql: `INSERT INTO locations (name, display_name, district, city, is_active, is_primary) VALUES (?, ?, ?, ?, 1, 0)`,
    args: ['praha-5', 'Praha 5 — Anděl', 'Praha 5', 'Praha'],
  });
  console.log('Added Praha 5 — Anděl');
} else {
  console.log('Praha 5 already exists');
}

// Verify
const after = await db.execute('SELECT id, name, display_name FROM locations ORDER BY id');
console.log(`\nAfter: ${after.rows.length} locations`);
for (const r of after.rows) {
  console.log(`  id=${r.id} name=${r.name} display=${r.display_name}`);
}
