/**
 * STUDIOFLOW — Client queries for Klientske karty
 * Client list, detail, booking history, girl stats
 */

import { db } from './db';

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
}

export interface ClientDetail {
  id: number;
  clientNumber: string;
  nickname: string;
  phoneEncrypted: string | null;
  nameEncrypted: string | null;
  surnameEncrypted: string | null;
  emailEncrypted: string | null;
  telegramId: string | null;
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
  visitCount: number;
}

// ---------------------------------------------------------------------------
// Client list with filtering & search
// ---------------------------------------------------------------------------

export async function getClientList(opts: {
  search?: string;
  filter?: string; // all | vip | regular | new | banned
  page?: number;
  pageSize?: number;
}): Promise<{ clients: ClientListItem[]; total: number }> {
  const { search, filter = 'all', page = 1, pageSize = 50 } = opts;

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

  // Fetch page
  const offset = (page - 1) * pageSize;
  const result = await db.execute({
    sql: `
      SELECT
        bc.id, bc.client_number, bc.nickname, bc.trust_level,
        bc.total_visits, bc.no_show_count, bc.is_banned,
        (SELECT b.date FROM bookings_v2 b WHERE b.client_id = bc.id
         AND b.status IN ('completed', 'confirmed', 'in_progress')
         ORDER BY b.date DESC, b.start_time DESC LIMIT 1) AS last_visit
      FROM booking_clients bc
      ${where}
      ORDER BY
        CASE bc.trust_level WHEN 'vip' THEN 0 WHEN 'regular' THEN 1 WHEN 'verified' THEN 2 WHEN 'new' THEN 3 END,
        bc.total_visits DESC,
        bc.nickname
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
         ORDER BY b.date DESC LIMIT 1) AS last_visit
      FROM booking_clients bc
      WHERE bc.id = ?
    `,
    args: [id],
  });

  if (result.rows.length === 0) return null;

  const r = result.rows[0];
  return {
    id: Number(r.id),
    clientNumber: String(r.client_number),
    nickname: String(r.nickname),
    phoneEncrypted: r.phone_encrypted ? String(r.phone_encrypted) : null,
    nameEncrypted: r.name_encrypted ? String(r.name_encrypted) : null,
    surnameEncrypted: r.surname_encrypted ? String(r.surname_encrypted) : null,
    emailEncrypted: r.email_encrypted ? String(r.email_encrypted) : null,
    telegramId: r.telegram_id ? String(r.telegram_id) : null,
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
      SELECT g.name AS girl_name, COUNT(*) AS cnt
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
    visitCount: Number(r.cnt),
  }));
}
