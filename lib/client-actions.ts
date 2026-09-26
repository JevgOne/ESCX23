'use server';

import { db } from './db';
import { requireBooking } from './auth';
import { encrypt, hmacSearch, hashForSearch } from './crypto';

// ---------------------------------------------------------------------------
// Update client notes
// ---------------------------------------------------------------------------

export async function updateClientNotes(
  clientId: number,
  notes: string,
): Promise<{ ok: true } | { error: string }> {
  await requireBooking();

  await db.execute({
    sql: 'UPDATE booking_clients SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [notes || null, clientId],
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Update trust level
// ---------------------------------------------------------------------------

const VALID_TRUST_LEVELS = ['new', 'verified', 'regular', 'vip'];

export async function updateClientTrustLevel(
  clientId: number,
  trustLevel: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireBooking();
  if (user.role !== 'admin') {
    return { error: 'Pouze admin muze menit trust level.' };
  }

  if (!VALID_TRUST_LEVELS.includes(trustLevel)) {
    return { error: 'Neplatny trust level.' };
  }

  await db.execute({
    sql: 'UPDATE booking_clients SET trust_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [trustLevel, clientId],
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Ban / unban client
// ---------------------------------------------------------------------------

export async function toggleClientBan(
  clientId: number,
  ban: boolean,
  reason?: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireBooking();
  if (user.role !== 'admin') {
    return { error: 'Pouze admin muze banovat klienty.' };
  }

  await db.execute({
    sql: 'UPDATE booking_clients SET is_banned = ?, ban_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [ban ? 1 : 0, ban ? (reason ?? null) : null, clientId],
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Update client basic info (nickname)
// ---------------------------------------------------------------------------

export async function updateClientNickname(
  clientId: number,
  nickname: string,
): Promise<{ ok: true } | { error: string }> {
  await requireBooking();

  if (!nickname.trim()) {
    return { error: 'Prezdivka nemuze byt prazdna.' };
  }

  await db.execute({
    sql: 'UPDATE booking_clients SET nickname = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [nickname.trim(), clientId],
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Add client contact (multi-channel)
// ---------------------------------------------------------------------------

const VALID_CHANNELS = ['phone', 'whatsapp', 'telegram', 'email'];

export async function addClientContact(
  clientId: number,
  channel: string,
  value: string,
  label?: string,
  isPrimary?: boolean,
): Promise<{ ok: true; contactId: number } | { error: string }> {
  await requireBooking();

  if (!VALID_CHANNELS.includes(channel)) {
    return { error: 'Neplatny kanal.' };
  }
  if (!value.trim()) {
    return { error: 'Hodnota nemuze byt prazdna.' };
  }

  const trimmed = value.trim();

  // Encrypt value and create HMAC for searchable fields
  let valueEncrypted: string;
  let valueHmac: string | null = null;

  if (channel === 'phone' || channel === 'whatsapp') {
    valueEncrypted = encrypt(trimmed);
    valueHmac = hmacSearch(trimmed);
  } else if (channel === 'email') {
    valueEncrypted = encrypt(trimmed);
    valueHmac = hashForSearch(trimmed.toLowerCase());
  } else {
    // telegram — store as-is (telegram IDs/usernames are not PII)
    valueEncrypted = trimmed;
    valueHmac = null;
  }

  // If setting as primary, clear primary flag on other contacts of same channel
  if (isPrimary) {
    await db.execute({
      sql: 'UPDATE client_contacts SET is_primary = 0 WHERE client_id = ? AND channel = ?',
      args: [clientId, channel],
    });
  }

  const result = await db.execute({
    sql: `INSERT INTO client_contacts (client_id, channel, value_encrypted, value_hmac, label, is_primary)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [clientId, channel, valueEncrypted, valueHmac, label?.trim() || null, isPrimary ? 1 : 0],
  });

  return { ok: true, contactId: Number(result.lastInsertRowid) };
}

// ---------------------------------------------------------------------------
// Remove client contact
// ---------------------------------------------------------------------------

export async function removeClientContact(
  clientId: number,
  contactId: number,
): Promise<{ ok: true } | { error: string }> {
  await requireBooking();

  await db.execute({
    sql: 'DELETE FROM client_contacts WHERE id = ? AND client_id = ?',
    args: [contactId, clientId],
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Find duplicate clients
// ---------------------------------------------------------------------------

export async function findDuplicates(clientId: number): Promise<{
  clientId: number;
  clientNumber: string;
  nickname: string;
  matchType: 'phone' | 'telegram' | 'name';
  matchDetail: string;
}[]> {
  await requireBooking();

  const duplicates: {
    clientId: number;
    clientNumber: string;
    nickname: string;
    matchType: 'phone' | 'telegram' | 'name';
    matchDetail: string;
  }[] = [];

  const seen = new Set<number>();

  // Match by phone HMAC (via client_contacts)
  const phoneMatches = await db.execute({
    sql: `
      SELECT DISTINCT bc.id, bc.client_number, bc.nickname
      FROM client_contacts cc1
      JOIN client_contacts cc2 ON cc1.value_hmac = cc2.value_hmac AND cc1.client_id != cc2.client_id
      JOIN booking_clients bc ON bc.id = cc2.client_id
      WHERE cc1.client_id = ? AND cc1.channel IN ('phone', 'whatsapp') AND cc1.value_hmac IS NOT NULL
    `,
    args: [clientId],
  });
  for (const r of phoneMatches.rows) {
    const id = Number(r.id);
    if (!seen.has(id)) {
      seen.add(id);
      duplicates.push({
        clientId: id,
        clientNumber: String(r.client_number),
        nickname: String(r.nickname),
        matchType: 'phone',
        matchDetail: 'Stejne telefonni cislo',
      });
    }
  }

  // Match by telegram_id (via HMAC, with plaintext fallback)
  const client = await db.execute({
    sql: 'SELECT telegram_id, telegram_id_hmac, nickname FROM booking_clients WHERE id = ?',
    args: [clientId],
  });
  if (client.rows.length > 0 && (client.rows[0].telegram_id_hmac || client.rows[0].telegram_id)) {
    const tgHmac = client.rows[0].telegram_id_hmac ? String(client.rows[0].telegram_id_hmac) : null;
    const tgId = client.rows[0].telegram_id ? String(client.rows[0].telegram_id) : null;

    // Prefer HMAC-based matching
    if (tgHmac) {
      const tgMatches = await db.execute({
        sql: `SELECT id, client_number, nickname FROM booking_clients WHERE telegram_id_hmac = ? AND id != ?`,
        args: [tgHmac, clientId],
      });
      for (const r of tgMatches.rows) {
        const id = Number(r.id);
        if (!seen.has(id)) {
          seen.add(id);
          duplicates.push({
            clientId: id,
            clientNumber: String(r.client_number),
            nickname: String(r.nickname),
            matchType: 'telegram',
            matchDetail: 'Stejny Telegram',
          });
        }
      }
    } else if (tgId) {
      // Fallback to plaintext for pre-migration data
      const tgMatches = await db.execute({
        sql: `SELECT id, client_number, nickname FROM booking_clients WHERE telegram_id = ? AND id != ?`,
        args: [tgId, clientId],
      });
      for (const r of tgMatches.rows) {
        const id = Number(r.id);
        if (!seen.has(id)) {
          seen.add(id);
          duplicates.push({
            clientId: id,
            clientNumber: String(r.client_number),
            nickname: String(r.nickname),
            matchType: 'telegram',
            matchDetail: 'Stejny Telegram',
          });
        }
      }
    }
  }

  // Match by similar nickname
  if (client.rows.length > 0) {
    const nickname = String(client.rows[0].nickname);
    if (nickname.length >= 3) {
      const nameMatches = await db.execute({
        sql: `SELECT id, client_number, nickname FROM booking_clients WHERE nickname LIKE ? AND id != ? LIMIT 5`,
        args: [`%${nickname}%`, clientId],
      });
      for (const r of nameMatches.rows) {
        const id = Number(r.id);
        if (!seen.has(id)) {
          seen.add(id);
          duplicates.push({
            clientId: id,
            clientNumber: String(r.client_number),
            nickname: String(r.nickname),
            matchType: 'name',
            matchDetail: 'Podobna prezdivka',
          });
        }
      }
    }
  }

  return duplicates;
}

// ---------------------------------------------------------------------------
// Merge clients (deduplicate)
// ---------------------------------------------------------------------------

export async function mergeClients(
  keepId: number,
  mergeId: number,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireBooking();
  if (user.role !== 'admin') {
    return { error: 'Pouze admin muze slucovat klienty.' };
  }

  if (keepId === mergeId) {
    return { error: 'Nelze sloucit klienta sam se sebou.' };
  }

  // Load both clients
  const keepRes = await db.execute({
    sql: 'SELECT * FROM booking_clients WHERE id = ?',
    args: [keepId],
  });
  const mergeRes = await db.execute({
    sql: 'SELECT * FROM booking_clients WHERE id = ?',
    args: [mergeId],
  });

  if (keepRes.rows.length === 0 || mergeRes.rows.length === 0) {
    return { error: 'Klient nenalezen.' };
  }

  const mergeRow = mergeRes.rows[0];

  // Move bookings
  await db.execute({
    sql: 'UPDATE bookings_v2 SET client_id = ? WHERE client_id = ?',
    args: [keepId, mergeId],
  });

  // Move contacts
  await db.execute({
    sql: 'UPDATE client_contacts SET client_id = ? WHERE client_id = ?',
    args: [keepId, mergeId],
  });

  // Move telegram_users
  await db.execute({
    sql: 'UPDATE telegram_users SET client_id = ? WHERE client_id = ?',
    args: [keepId, mergeId],
  });

  // Move booking_drafts
  await db.execute({
    sql: 'UPDATE booking_drafts SET client_id = ? WHERE client_id = ?',
    args: [keepId, mergeId],
  });

  // Merge statistics
  await db.execute({
    sql: `UPDATE booking_clients SET
            total_visits = total_visits + ?,
            total_spent = total_spent + ?,
            no_show_count = no_show_count + ?,
            notes = CASE
              WHEN notes IS NULL OR notes = '' THEN ?
              WHEN ? IS NULL OR ? = '' THEN notes
              ELSE notes || char(10) || '---' || char(10) || 'Slouceno z ' || ? || ':' || char(10) || ?
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [
      Number(mergeRow.total_visits),
      Number(mergeRow.total_spent),
      Number(mergeRow.no_show_count),
      mergeRow.notes ? String(mergeRow.notes) : null,
      mergeRow.notes, mergeRow.notes,
      String(mergeRow.client_number),
      mergeRow.notes ? String(mergeRow.notes) : '',
      keepId,
    ],
  });

  // Delete merged client
  await db.execute({
    sql: 'DELETE FROM booking_clients WHERE id = ?',
    args: [mergeId],
  });

  return { ok: true };
}
