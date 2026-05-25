import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../data/app.db');

const email = process.env.EMAIL || 'info@lovelygirls.cz';
const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/set-admin-password.mjs <password>');
  process.exit(1);
}

const db = createClient({ url: `file:${dbPath}` });
const hash = await bcrypt.hash(password, 12);

const result = await db.execute({
  sql: "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?",
  args: [hash, email],
});

if (result.rowsAffected === 0) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

console.log(`Password updated for ${email}`);
db.close();
