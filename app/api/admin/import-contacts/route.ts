/**
 * One-time API route for importing contacts from CSV.
 * Secured with SESSION_SECRET header check.
 *
 * GET  → diagnostic (check DB state, encrypted phones count)
 * POST → run import (reads CSV from request body)
 *
 * Usage:
 *   curl -H "Authorization: Bearer $SESSION_SECRET" https://lovelygirls.cz/api/admin/import-contacts
 *   curl -X POST -H "Authorization: Bearer $SESSION_SECRET" \
 *     -H "Content-Type: text/csv" --data-binary @contacts.csv \
 *     https://lovelygirls.cz/api/admin/import-contacts
 *
 * Add ?dry-run=1 for preview without writes.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { encrypt, hmacSearch } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min for large imports

function auth(req: NextRequest): boolean {
  const secret = process.env.IMPORT_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  // Check both Bearer format and raw token
  return header === `Bearer ${secret}` || header === secret;
}


// ---------------------------------------------------------------------------
// GET — diagnostic
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const total = await db.execute('SELECT COUNT(*) AS cnt FROM booking_clients');
  const encrypted = await db.execute(
    'SELECT COUNT(*) AS cnt FROM booking_clients WHERE phone_encrypted IS NOT NULL',
  );
  const maxNum = await db.execute(
    "SELECT MAX(CAST(REPLACE(client_number, 'LG-', '') AS INTEGER)) AS max_num FROM booking_clients WHERE client_number LIKE 'LG-%'",
  );

  const hasEncKey = !!process.env.BOOKING_ENCRYPTION_KEY;
  const hasHmacKey = !!process.env.BOOKING_HMAC_SECRET;

  return NextResponse.json({
    totalClients: Number(total.rows[0]?.cnt ?? 0),
    encryptedPhones: Number(encrypted.rows[0]?.cnt ?? 0),
    maxClientNumber: Number(maxNum.rows[0]?.max_num ?? 0),
    hasEncryptionKey: hasEncKey,
    hasHmacSecret: hasHmacKey,
  });
}

// ---------------------------------------------------------------------------
// CSV Parsing
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
          i++;
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

function cleanNickname(raw: string, rowNum: number): string {
  let name = raw.trim();
  name = name.replace(/^~\s*/, '');
  name = name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+/u, '');
  name = name.trim();
  if (!name) return `Import-${rowNum}`;
  return name;
}

interface Classification {
  trustLevel: string;
  isBanned: number;
  noShowCount: number;
  totalVisits: number;
  notes: string | null;
}

function classify(firstName: string, csvNotes: string): Classification {
  if (firstName.includes('⛔') || csvNotes.includes('⛔')) {
    return { trustLevel: 'new', isBanned: 1, noShowCount: 0, totalVisits: 0, notes: csvNotes || null };
  }

  const lc = firstName.toLowerCase();
  const unreliableWords = ['neprisel', 'neprisla', 'nepřišel', 'nepřišla', 'zrusil', 'zrušil', 'zrusila', 'zrušila'];
  const hasUnreliable = unreliableWords.some((w) => lc.includes(w));
  const hasTrailingNE = /\bNE$/.test(firstName.trim());
  if (hasUnreliable || hasTrailingNE) {
    return { trustLevel: 'new', isBanned: 0, noShowCount: 1, totalVisits: 0, notes: 'unreliable (imported)' };
  }

  if (lc.startsWith('novy') || lc.startsWith('nový')) {
    return { trustLevel: 'new', isBanned: 0, noShowCount: 0, totalVisits: 1, notes: null };
  }

  return { trustLevel: 'regular', isBanned: 0, noShowCount: 0, totalVisits: 3, notes: null };
}

// ---------------------------------------------------------------------------
// POST — run import
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const dryRun = req.nextUrl.searchParams.get('dry-run') === '1';
  const csvContent = await req.text();

  if (!csvContent.trim()) {
    return NextResponse.json({ error: 'empty CSV body' }, { status: 400 });
  }

  const lines = csvContent.split('\n').filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 });
  }

  const header = parseCSVLine(lines[0]);
  const firstNameIdx = header.indexOf('First Name');
  const notesIdx = header.indexOf('Notes');
  const phoneIdx = header.indexOf('Phone 1 - Value');

  if (firstNameIdx === -1 || phoneIdx === -1) {
    return NextResponse.json({ error: 'Missing required columns', header: header.slice(0, 5) }, { status: 400 });
  }

  // Get max client_number
  const maxRes = await db.execute(
    "SELECT MAX(CAST(REPLACE(client_number, 'LG-', '') AS INTEGER)) AS max_num FROM booking_clients WHERE client_number LIKE 'LG-%'",
  );
  let nextNum = Number(maxRes.rows[0]?.max_num ?? 0) + 1;

  // Existing phone HMACs for dedup
  const existingHmacs = new Set<string>();
  const hmacRes = await db.execute('SELECT phone_hmac FROM booking_clients WHERE phone_hmac IS NOT NULL');
  for (const r of hmacRes.rows) {
    existingHmacs.add(String(r.phone_hmac));
  }

  // Existing nicknames for phoneless dedup
  const existingNicknames = new Set<string>();
  const nickRes = await db.execute('SELECT nickname FROM booking_clients WHERE phone_hmac IS NULL');
  for (const r of nickRes.rows) {
    existingNicknames.add(String(r.nickname));
  }

  let imported = 0;
  let skippedDup = 0;
  let skippedErr = 0;
  const log: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const fields = parseCSVLine(lines[i]);
      const rawFirstName = fields[firstNameIdx] ?? '';
      const rawNotes = notesIdx >= 0 ? (fields[notesIdx] ?? '') : '';
      const rawPhone = fields[phoneIdx] ?? '';

      const nickname = cleanNickname(rawFirstName, i);
      const cls = classify(rawFirstName, rawNotes);

      let phoneEncrypted: string | null = null;
      let phoneHmac: string | null = null;

      if (rawPhone.trim()) {
        const hmac = hmacSearch(rawPhone.trim());
        if (existingHmacs.has(hmac)) {
          skippedDup++;
          if (skippedDup <= 20) log.push(`Row ${i}: SKIP dup (${nickname})`);
          continue;
        }
        existingHmacs.add(hmac);
        phoneHmac = hmac;
        phoneEncrypted = encrypt(rawPhone.replace(/[\s\-\(\)]/g, ''));
      } else {
        // No phone — dedup by nickname
        if (existingNicknames.has(nickname)) {
          skippedDup++;
          if (skippedDup <= 20) log.push(`Row ${i}: SKIP dup nickname (${nickname})`);
          continue;
        }
        existingNicknames.add(nickname);
      }

      const clientNumber = `LG-${nextNum}`;
      const deepLinkToken = crypto.randomBytes(8).toString('hex');
      nextNum++;

      if (!dryRun) {
        await db.execute({
          sql: `INSERT INTO booking_clients (
            client_number, nickname, phone_encrypted, phone_hmac,
            trust_level, is_banned, no_show_count, total_visits,
            notes, deep_link_token, source, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [
            clientNumber, nickname, phoneEncrypted, phoneHmac,
            cls.trustLevel, cls.isBanned, cls.noShowCount, cls.totalVisits,
            cls.notes, deepLinkToken, 'phone',
          ],
        });
      }

      imported++;
      if (imported <= 10 || imported % 500 === 0) {
        log.push(`Row ${i}: ${nickname} → ${clientNumber} (${cls.trustLevel}, phone: ${phoneHmac ? 'yes' : 'no'})`);
      }
    } catch (err) {
      skippedErr++;
      log.push(`Row ${i}: ERROR ${String(err)}`);
    }
  }

  return NextResponse.json({
    dryRun,
    totalRows: lines.length - 1,
    imported,
    skippedDuplicate: skippedDup,
    errors: skippedErr,
    log,
  });
}

// ---------------------------------------------------------------------------
// DELETE — deduplicate phoneless records (keep lowest id per nickname)
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const dryRun = req.nextUrl.searchParams.get('dry-run') === '1';

  // Find duplicate phoneless nicknames (keeping the one with lowest id)
  const dupsRes = await db.execute(`
    SELECT id, nickname, client_number FROM booking_clients
    WHERE phone_hmac IS NULL
      AND id NOT IN (
        SELECT MIN(id) FROM booking_clients WHERE phone_hmac IS NULL GROUP BY nickname
      )
    ORDER BY id
  `);

  const duplicates = dupsRes.rows.map((r) => ({
    id: Number(r.id),
    nickname: String(r.nickname),
    clientNumber: String(r.client_number),
  }));

  if (!dryRun && duplicates.length > 0) {
    const ids = duplicates.map((d) => d.id);
    // Delete in batches of 100
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const placeholders = batch.map(() => '?').join(',');
      await db.execute({
        sql: `DELETE FROM booking_clients WHERE id IN (${placeholders})`,
        args: batch,
      });
    }
  }

  return NextResponse.json({
    dryRun,
    duplicatesFound: duplicates.length,
    sample: duplicates.slice(0, 20).map((d) => `${d.clientNumber} ${d.nickname}`),
  });
}
