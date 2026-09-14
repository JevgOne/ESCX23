/**
 * Seed STUDIOFLOW test users.
 * Run: npx tsx scripts/seed-studioflow-users.ts
 *
 * Creates 3 test users:
 *   admin@lovelygirls.cz   / admin123    / role: admin
 *   operatorka@lovelygirls.cz / oper123  / role: operator
 *   emily@lovelygirls.cz   / emily123    / role: girl / girl_id: 28
 */

import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? 'file:./data/app.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, ...(authToken ? { authToken } : {}) });

interface SeedUser {
  email: string;
  password: string;
  role: string;
  display_name: string;
  girl_id: number | null;
}

const USERS: SeedUser[] = [
  { email: 'admin@lovelygirls.cz', password: 'admin123', role: 'admin', display_name: 'Admin', girl_id: null },
  { email: 'operatorka@lovelygirls.cz', password: 'oper123', role: 'operator', display_name: 'Operátorka', girl_id: null },
  { email: 'emily@lovelygirls.cz', password: 'emily123', role: 'girl', display_name: 'Emily', girl_id: 28 },
];

async function seed() {
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 12);

    // Upsert — update if email exists, insert if not
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [u.email],
    });

    if (existing.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE users SET password_hash = ?, role = ?, display_name = ?, girl_id = ?, is_active = 1 WHERE email = ?',
        args: [hash, u.role, u.display_name, u.girl_id, u.email],
      });
      console.log(`Updated: ${u.email} (${u.role})`);
    } else {
      await db.execute({
        sql: 'INSERT INTO users (email, password_hash, role, display_name, girl_id, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        args: [u.email, hash, u.role, u.display_name, u.girl_id],
      });
      console.log(`Created: ${u.email} (${u.role})`);
    }
  }

  console.log('\nDone. Test credentials:');
  for (const u of USERS) {
    console.log(`  ${u.email} / ${u.password} → ${u.role}`);
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
