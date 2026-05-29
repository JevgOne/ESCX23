#!/usr/bin/env node
/**
 * One-time cleanup: delete duplicate FAQ rows (IDs 15-28).
 * The seed was accidentally run twice, creating exact duplicates.
 *
 * Usage: node scripts/cleanup-faq-duplicates.mjs
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

// Show current state
const before = await db.execute('SELECT id, question_cs, created_at FROM faq_items ORDER BY id');
console.log(`Before: ${before.rows.length} FAQ rows`);
for (const r of before.rows) {
  console.log(`  id=${r.id}  created=${r.created_at}  q="${String(r.question_cs).slice(0, 50)}"`);
}

// Delete the duplicate batch (IDs 15-28)
const result = await db.execute('DELETE FROM faq_items WHERE id BETWEEN 15 AND 28');
console.log(`\nDeleted ${result.rowsAffected} duplicate rows.`);

// Verify
const after = await db.execute('SELECT id, question_cs FROM faq_items WHERE is_active = 1 ORDER BY display_order');
console.log(`\nAfter: ${after.rows.length} active FAQ rows remaining:`);
for (const r of after.rows) {
  console.log(`  id=${r.id}  q="${String(r.question_cs).slice(0, 60)}"`);
}
