/**
 * STUDIOFLOW — Client queries for Klientske karty
 * Client list, detail, booking history, girl stats
 */

import { db } from './db';
import { decrypt, isEncrypted, safeDecrypt } from './crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClientListItem {
  id: number;
  clientNumber: string;
  nickname: string;
  trustLevel: string;  // new | verified | regular | vip
  totalVisits: number;
  noShowCount: number;
  isBanned: boolean;
  lastVisitDate: string | null;
  channels: string[];  // ['phone', 'telegram', 'whatsapp', 'email']
}

export interface ClientDetail {
  id: number;
  clientNumber: string;
  nickname: string;
  phoneEncrypted: string | null;
  phoneDecrypted: string | null;
  nameEncrypted: string | null;
  surnameEncrypted: string | null;
  emailEncrypted: string | null;
  emailDecrypted: string | null;
  telegramId: string | null;
  deepLinkToken: string | null;
  source: string;
  trustLevel: string;
  totalVisits: number;
  totalSpent: number;
  totalPoints: number;
  noShowCount: number;
  isBanned: boolean;
  banReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed
  firstVisitDate: string | null;
  lastVisitDate: string | null;
  regularSince: number | null; // visit number when became regular
  // Telegram user data (from telegram_users JOIN)
  telegramUserId: string | null;
  telegramName: string | null;
  telegramChatId: string | null;
  telegramActive: boolean;
  telegramLastInteraction: string | null;
}

export interface ClientBookingHistory {
  id: number;
  date: string;
  startTime: string;
  girlName: string;
  durationMinutes: number;
  channel: string;
  status: string;
  price: number | null;
  pointsEarned: number;
}

export interface ClientGirlStat {
  girlName: string;
  girlSlug: string;
  visitCount: number;
  photoUrl: string | null;
}

export interface ClientContact {
  id: number;
  channel: 'phone' | 'whatsapp' | 'telegram' | 'email';
  valueDecrypted: string | null;
  valueEncrypted: string | null;
  label: string | null;
  isPrimary: boolean;
  telegramUsername: string | null;
  verified: boolean;
}

// ---------------------------------------------------------------------------
// Client list with filtering & search
// ---------------------------------------------------------------------------

export async function getClientList(opts: {
  search?: string;
  filter?: string; // all | vip | regular | new | banned
  sort?: string;   // name | visits | last_visit | spent | created
  page?: number;
  pageSize?: number;
}): Promise<{ clients: ClientListItem[]; total: number }> {
  const { search, filter = 'all', sort, page = 1, pageSize = 50 } = opts;

  let where = 'WHERE 1=1';
  const args: (string | number)[] = [];

  // Trust level filter
  if (filter === 'vip') {
    where += " AND bc.trust_level = 'vip'";
  } else if (filter === 'regular') {
    where += " AND bc.trust_level = 'regular'";
  } else if (filter === 'new') {
    where += " AND bc.trust_level = 'new'";
  } else if (filter === 'banned') {
    where += ' AND bc.is_banned = 1';
  }

  // Search by nickname or client_number
  if (search && search.trim()) {
    where += ' AND (bc.nickname LIKE ? OR bc.client_number LIKE ?)';
    const term = `%${search.trim()}%`;
    args.push(term, term);
  }

  // Count
  const countRes = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM booking_clients bc ${where}`,
    args,
  });
  const total = Number(countRes.rows[0]?.c ?? 0);

  // Sort clause
  let orderBy: string;
  switch (sort) {
    case 'name':
      orderBy = 'bc.nickname COLLATE NOCASE';
      break;
    case 'visits':
      orderBy = 'bc.total_visits DESC';
      break;
    case 'last_visit':
      orderBy = 'last_visit DESC';
      break;
    case 'spent':
      orderBy = 'bc.total_spent DESC';
      break;
    case 'created':
      orderBy = 'bc.created_at DESC';
      break;
    default:
      orderBy = `CASE bc.trust_level WHEN 'vip' THEN 0 WHEN 'regular' THEN 1 WHEN 'verified' THEN 2 WHEN 'new' THEN 3 END, bc.total_visits DESC, bc.nickname`;
  }

  // Fetch page
  const offset = (page - 1) * pageSize;
  const result = await db.execute({
    sql: `
      SELECT
        bc.id, bc.client_number, bc.nickname, bc.trust_level,
        bc.total_visits, bc.no_show_count, bc.is_banned, bc.total_spent,
        (SELECT b.date FROM bookings_v2 b WHERE b.client_id = bc.id
         AND b.status IN ('completed', 'confirmed', 'in_progress')
         ORDER BY b.date DESC, b.start_time DESC LIMIT 1) AS last_visit,
        (SELECT GROUP_CONCAT(DISTINCT cc.channel) FROM client_contacts cc WHERE cc.client_id = bc.id) AS channels
      FROM booking_clients bc
      ${where}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `,
    args: [...args, pageSize, offset],
  });

  const clients: ClientListItem[] = result.rows.map((r) => ({
    id: Number(r.id),
    clientNumber: String(r.client_number),
    nickname: String(r.nickname),
    trustLevel: String(r.trust_level),
    totalVisits: Number(r.total_visits),
    noShowCount: Number(r.no_show_count),
    isBanned: Number(r.is_banned) === 1,
    lastVisitDate: r.last_visit ? String(r.last_visit) : null,
    channels: r.channels ? String(r.channels).split(',') : [],
  }));

  return { clients, total };
}

// ---------------------------------------------------------------------------
// Client detail
// ---------------------------------------------------------------------------

export async function getClientDetail(id: number): Promise<ClientDetail | null> {
  const result = await db.execute({
    sql: `
      SELECT
        bc.*,
        (SELECT b.date FROM bookings_v2 b WHERE b.client_id = bc.id
         AND b.status IN ('completed', 'confirmed', 'in_progress')
         ORDER BY b.date ASC LIMIT 1) AS first_visit,
        (SELECT b.date FROM bookings_v2 b WHERE b.client_id = bc.id
         AND b.status IN ('completed', 'confirmed', 'in_progress')
         ORDER BY b.date DESC LIMIT 1) AS last_visit,
        tu.telegram_user_id AS tg_user_id,
        tu.telegram_user_id_encrypted AS tg_user_id_enc,
        tu.telegram_name AS tg_name,
        tu.telegram_name_encrypted AS tg_name_enc,
        tu.chat_id AS tg_chat_id,
        tu.chat_id_encrypted AS tg_chat_id_enc,
        tu.is_active AS tg_is_active,
        tu.last_interaction AS tg_last_interaction
      FROM booking_clients bc
      LEFT JOIN telegram_users tu ON tu.client_id = bc.id
      WHERE bc.id = ?
    `,
    args: [id],
  });

  if (result.rows.length === 0) return null;

  const r = result.rows[0];

  // Decrypt PII fields for admin display
  const phoneRaw = r.phone_encrypted ? String(r.phone_encrypted) : null;
  let phoneDecrypted: string | null = null;
  if (phoneRaw && isEncrypted(phoneRaw)) {
    try { phoneDecrypted = decrypt(phoneRaw); } catch { /* decryption failed */ }
  }

  const emailRaw = r.email_encrypted ? String(r.email_encrypted) : null;
  let emailDecrypted: string | null = null;
  if (emailRaw && isEncrypted(emailRaw)) {
    try { emailDecrypted = decrypt(emailRaw); } catch { /* decryption failed */ }
  }

  return {
    id: Number(r.id),
    clientNumber: String(r.client_number),
    nickname: String(r.nickname),
    phoneEncrypted: phoneRaw,
    phoneDecrypted,
    nameEncrypted: r.name_encrypted ? String(r.name_encrypted) : null,
    surnameEncrypted: r.surname_encrypted ? String(r.surname_encrypted) : null,
    emailEncrypted: emailRaw,
    emailDecrypted,
    telegramId: safeDecrypt(r.telegram_id_encrypted ? String(r.telegram_id_encrypted) : null) ?? (r.telegram_id ? String(r.telegram_id) : null),
    deepLinkToken: r.deep_link_token ? String(r.deep_link_token) : null,
    source: String(r.source),
    trustLevel: String(r.trust_level),
    totalVisits: Number(r.total_visits),
    totalSpent: Number(r.total_spent),
    totalPoints: Number(r.total_points),
    noShowCount: Number(r.no_show_count),
    isBanned: Number(r.is_banned) === 1,
    banReason: r.ban_reason ? String(r.ban_reason) : null,
    notes: r.notes ? String(r.notes) : null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    firstVisitDate: r.first_visit ? String(r.first_visit) : null,
    lastVisitDate: r.last_visit ? String(r.last_visit) : null,
    regularSince: Number(r.total_visits) >= 3 ? 3 : null,
    telegramUserId: safeDecrypt(r.tg_user_id_enc ? String(r.tg_user_id_enc) : null) ?? (r.tg_user_id ? String(r.tg_user_id) : null),
    telegramName: safeDecrypt(r.tg_name_enc ? String(r.tg_name_enc) : null) ?? (r.tg_name ? String(r.tg_name) : null),
    telegramChatId: safeDecrypt(r.tg_chat_id_enc ? String(r.tg_chat_id_enc) : null) ?? (r.tg_chat_id ? String(r.tg_chat_id) : null),
    telegramActive: Number(r.tg_is_active ?? 0) === 1,
    telegramLastInteraction: r.tg_last_interaction ? String(r.tg_last_interaction) : null,
  };
}

// ---------------------------------------------------------------------------
// Booking history for a client
// ---------------------------------------------------------------------------

export async function getClientBookingHistory(
  clientId: number,
): Promise<ClientBookingHistory[]> {
  const result = await db.execute({
    sql: `
      SELECT
        b.id, b.date, b.start_time, b.duration_minutes,
        b.channel, b.status, b.price, b.points_earned,
        g.name AS girl_name
      FROM bookings_v2 b
      LEFT JOIN girls g ON g.id = b.girl_id
      WHERE b.client_id = ?
      ORDER BY b.date DESC, b.start_time DESC
    `,
    args: [clientId],
  });

  return result.rows.map((r) => ({
    id: Number(r.id),
    date: String(r.date),
    startTime: String(r.start_time).substring(0, 5),
    girlName: r.girl_name ? String(r.girl_name) : '?',
    durationMinutes: Number(r.duration_minutes),
    channel: String(r.channel),
    status: String(r.status),
    price: r.price != null ? Number(r.price) : null,
    pointsEarned: Number(r.points_earned),
  }));
}

// ---------------------------------------------------------------------------
// Girl stats for a client (which girls they visited and how often)
// ---------------------------------------------------------------------------

export async function getClientGirlStats(
  clientId: number,
): Promise<ClientGirlStat[]> {
  const result = await db.execute({
    sql: `
      SELECT g.name AS girl_name, g.slug, COUNT(*) AS cnt,
        (SELECT gp.url FROM girl_photos gp WHERE gp.girl_id = g.id
         AND gp.is_primary = 1 LIMIT 1) AS photo_url
      FROM bookings_v2 b
      JOIN girls g ON g.id = b.girl_id
      WHERE b.client_id = ?
        AND b.status IN ('completed', 'confirmed', 'in_progress')
      GROUP BY b.girl_id
      ORDER BY cnt DESC
    `,
    args: [clientId],
  });

  return result.rows.map((r) => ({
    girlName: String(r.girl_name),
    girlSlug: r.slug ? String(r.slug) : '',
    visitCount: Number(r.cnt),
    photoUrl: r.photo_url ? String(r.photo_url) : null,
  }));
}

// ---------------------------------------------------------------------------
// Client contacts (multi-channel)
// ---------------------------------------------------------------------------

export async function getClientContacts(clientId: number): Promise<ClientContact[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM client_contacts WHERE client_id = ? ORDER BY is_primary DESC, channel, id',
    args: [clientId],
  });

  return result.rows.map((r) => {
    const valRaw = r.value_encrypted ? String(r.value_encrypted) : null;
    let valDecrypted: string | null = null;
    if (valRaw && isEncrypted(valRaw)) {
      try { valDecrypted = decrypt(valRaw); } catch { /* decryption failed */ }
    } else if (valRaw) {
      // Non-encrypted value (telegram_id, etc.)
      valDecrypted = valRaw;
    }

    return {
      id: Number(r.id),
      channel: String(r.channel) as ClientContact['channel'],
      valueDecrypted: valDecrypted,
      valueEncrypted: valRaw,
      label: r.label ? String(r.label) : null,
      isPrimary: Number(r.is_primary) === 1,
      telegramUsername: safeDecrypt(r.telegram_username_encrypted ? String(r.telegram_username_encrypted) : null) ?? (r.telegram_username ? String(r.telegram_username) : null),
      verified: Number(r.verified) === 1,
    };
  });
}
