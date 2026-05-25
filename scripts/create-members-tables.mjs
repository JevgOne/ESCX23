import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

const db = createClient({ url: `file:${dbPath}` });

await db.execute({
  sql: `CREATE TABLE IF NOT EXISTS member_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  args: [],
});
console.log('member_applications table: OK');

await db.execute({
  sql: `CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    member_number TEXT UNIQUE,
    tier TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'active',
    loyalty_visit_count INTEGER DEFAULT 0,
    loyalty_discount_pct INTEGER DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_visit_at DATETIME
  )`,
  args: [],
});
console.log('members table: OK');

const tables = await db.execute({
  sql: `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_applications','members')`,
  args: [],
});
console.log('Tables confirmed:', tables.rows.map((r) => r.name).join(', '));
