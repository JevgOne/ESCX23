/**
 * Import contacts from Google Contacts CSV into booking_clients.
 *
 * Usage:
 *   npx tsx scripts/import-contacts.ts                  # production run
 *   npx tsx scripts/import-contacts.ts --dry-run        # preview without writes
 *
 * Requires env vars: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN,
 *   BOOKING_ENCRYPTION_KEY, BOOKING_HMAC_SECRET
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@libsql/client';
import { encrypt, hmacSearch } from '../lib/crypto';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CSV_PATH = path.resolve('/Users/zen/Desktop/contacts.csv');
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 100;

// Load env files (try multiple, first non-empty value wins)
const envFiles = [
  '.env.local',
  '.env.prod.local',
  '.env.production.local',
  '.env.prod-pulled.local',
  '.env.vercel-prod.local',
];
for (const envFile of envFiles) {
  const envFilePath = path.resolve(process.cwd(), envFile);
  if (!fs.existsSync(envFilePath)) continue;
  const envContent = fs.readFileSync(envFilePath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    let val = trimmed.slice(eqIdx + 1);
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Only set if not already set AND value is non-empty
    if (!process.env[key] && val) process.env[key] = val;
  }
}

const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./data/app.db';
const dbAuthToken = process.env.TURSO_AUTH_TOKEN;
console.log(`[IMPORT] DB: ${dbUrl.startsWith('libsql://') ? dbUrl.split('?')[0] : dbUrl}`);

const db = createClient({
  url: dbUrl,
  ...(dbAuthToken ? { authToken: dbAuthToken } : {}),
});

// ---------------------------------------------------------------------------
// CSV Parsing — handle quoted fields
// ---------------------------------------------------------------------------

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

// ---------------------------------------------------------------------------
// Nickname cleaning
// ---------------------------------------------------------------------------

function cleanNickname(raw: string, rowNum: number): string {
  let name = raw.trim();
  // Strip leading ~
  name = name.replace(/^~\s*/, '');
  // Strip leading emoji
  name = name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+/u, '');
  name = name.trim();
  if (!name) return `Import-${rowNum}`;
  return name;
}

// ---------------------------------------------------------------------------
// Trust level classification
// ---------------------------------------------------------------------------

interface Classification {
  trustLevel: string;
  isBanned: number;
  noShowCount: number;
  totalVisits: number;
  notes: string | null;
}

function classify(firstName: string, csvNotes: string): Classification {
  // 1. Banned (⛔ in name or notes)
  if (firstName.includes('⛔') || csvNotes.includes('⛔')) {
    return {
      trustLevel: 'new',
      isBanned: 1,
      noShowCount: 0,
      totalVisits: 0,
      notes: csvNotes || null,
    };
  }

  // 2. Unreliable (neprisel variants or trailing NE)
  const lc = firstName.toLowerCase();
  const unreliableWords = ['neprisel', 'neprisla', 'nepřišel', 'nepřišla', 'zrusil', 'zrušil', 'zrusila', 'zrušila'];
  const hasUnreliable = unreliableWords.some((w) => lc.includes(w));
  const hasTrailingNE = /\bNE$/.test(firstName.trim());
  if (hasUnreliable || hasTrailingNE) {
    return {
      trustLevel: 'new',
      isBanned: 0,
      noShowCount: 1,
      totalVisits: 0,
      notes: 'unreliable (imported)',
    };
  }

  // 3. New client (starts with "Novy")
  if (lc.startsWith('novy') || lc.startsWith('nový')) {
    return {
      trustLevel: 'new',
      isBanned: 0,
      noShowCount: 0,
      totalVisits: 1,
      notes: null,
    };
  }

  // 4. Regular (starts with "Klient") or default
  return {
    trustLevel: 'regular',
    isBanned: 0,
    noShowCount: 0,
    totalVisits: 3,
    notes: null,
  };
}

// ---------------------------------------------------------------------------
// Main import
// ---------------------------------------------------------------------------

async function main() {
  console.log(`[IMPORT] ${DRY_RUN ? '=== DRY RUN ===' : '=== PRODUCTION RUN ==='}`);
  console.log(`[IMPORT] CSV: ${CSV_PATH}`);

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`[IMPORT] CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csvContent.split('\n').filter((l) => l.trim());

  if (lines.length < 2) {
    console.error('[IMPORT] CSV has no data rows');
    process.exit(1);
  }

  // Parse header to find column indices
  const header = parseCSVLine(lines[0]);
  const firstNameIdx = header.indexOf('First Name');
  const notesIdx = header.indexOf('Notes');
  const phoneIdx = header.indexOf('Phone 1 - Value');

  if (firstNameIdx === -1 || phoneIdx === -1) {
    console.error('[IMPORT] Cannot find required columns. Header:', header.slice(0, 5));
    process.exit(1);
  }

  console.log(`[IMPORT] Columns: First Name=${firstNameIdx}, Notes=${notesIdx}, Phone=${phoneIdx}`);
  console.log(`[IMPORT] Total rows: ${lines.length - 1}`);

  // Get max client_number
  const maxRes = await db.execute(
    "SELECT MAX(CAST(REPLACE(client_number, 'LG-', '') AS INTEGER)) AS max_num FROM booking_clients WHERE client_number LIKE 'LG-%'",
  );
  let nextNum = Number(maxRes.rows[0]?.max_num ?? 0) + 1;
  console.log(`[IMPORT] Starting client_number: LG-${nextNum}`);

  // Collect existing phone HMACs for dedup
  const existingHmacs = new Set<string>();
  const hmacRes = await db.execute('SELECT phone_hmac FROM booking_clients WHERE phone_hmac IS NOT NULL');
  for (const r of hmacRes.rows) {
    existingHmacs.add(String(r.phone_hmac));
  }
  console.log(`[IMPORT] Existing phone HMACs in DB: ${existingHmacs.size}`);

  let imported = 0;
  let skippedDup = 0;
  let skippedErr = 0;
  const batch: {
    clientNumber: string;
    nickname: string;
    phoneEncrypted: string | null;
    phoneHmac: string | null;
    trustLevel: string;
    isBanned: number;
    noShowCount: number;
    totalVisits: number;
    notes: string | null;
    deepLinkToken: string;
    source: string;
  }[] = [];

  async function flushBatch() {
    if (batch.length === 0 || DRY_RUN) {
      batch.length = 0;
      return;
    }

    for (const row of batch) {
      await db.execute({
        sql: `INSERT INTO booking_clients (
          client_number, nickname, phone_encrypted, phone_hmac,
          trust_level, is_banned, no_show_count, total_visits,
          notes, deep_link_token, source, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          row.clientNumber, row.nickname, row.phoneEncrypted, row.phoneHmac,
          row.trustLevel, row.isBanned, row.noShowCount, row.totalVisits,
          row.notes, row.deepLinkToken, row.source,
        ],
      });
    }
    batch.length = 0;
  }

  for (let i = 1; i < lines.length; i++) {
    try {
      const fields = parseCSVLine(lines[i]);
      const rawFirstName = fields[firstNameIdx] ?? '';
      const rawNotes = notesIdx >= 0 ? (fields[notesIdx] ?? '') : '';
      const rawPhone = fields[phoneIdx] ?? '';

      const nickname = cleanNickname(rawFirstName, i);
      const cls = classify(rawFirstName, rawNotes);

      // Phone handling
      let phoneEncrypted: string | null = null;
      let phoneHmac: string | null = null;

      if (rawPhone.trim()) {
        const hmac = hmacSearch(rawPhone.trim());
        if (existingHmacs.has(hmac)) {
          skippedDup++;
          console.log(`[IMPORT] Row ${i}: SKIP duplicate phone (${nickname})`);
          continue;
        }
        existingHmacs.add(hmac);
        phoneHmac = hmac;
        phoneEncrypted = encrypt(rawPhone.replace(/[\s\-\(\)]/g, ''));
      }

      const clientNumber = `LG-${nextNum}`;
      const deepLinkToken = crypto.randomBytes(8).toString('hex');
      nextNum++;

      batch.push({
        clientNumber,
        nickname,
        phoneEncrypted,
        phoneHmac,
        trustLevel: cls.trustLevel,
        isBanned: cls.isBanned,
        noShowCount: cls.noShowCount,
        totalVisits: cls.totalVisits,
        notes: cls.notes,
        deepLinkToken,
        source: 'phone',
      });

      imported++;

      if (i % 500 === 0) {
        console.log(`[IMPORT] Progress: ${i}/${lines.length - 1} (imported: ${imported}, dup: ${skippedDup})`);
      }

      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
      }
    } catch (err) {
      skippedErr++;
      console.error(`[IMPORT] Row ${i}: ERROR`, err);
    }
  }

  // Final flush
  await flushBatch();

  console.log('\n[IMPORT] ====== RESULTS ======');
  console.log(`[IMPORT] Imported:    ${imported}`);
  console.log(`[IMPORT] Dup skipped: ${skippedDup}`);
  console.log(`[IMPORT] Errors:      ${skippedErr}`);
  console.log(`[IMPORT] Total:       ${imported + skippedDup + skippedErr}`);
  if (DRY_RUN) {
    console.log('[IMPORT] DRY RUN — no data was written.');
  }
}

main().catch((err) => {
  console.error('[IMPORT] Fatal error:', err);
  process.exit(1);
});
