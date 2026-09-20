import { db } from '../db';
import { sendPhoto } from '../telegram';
import { logAudit } from '../audit';
import { startBookingFlow } from './booking-flow';
import { getCalendarGirls } from '../booking-queries';
import type { ClientContext } from './types';

// ---------------------------------------------------------------------------
// Prague timezone helpers
// ---------------------------------------------------------------------------

function getPragueNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
}

function getPragueToday(): string {
  const d = getPragueNow();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekMonday(): string {
  const d = getPragueNow();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function getWeekSunday(): string {
  const mon = new Date(getWeekMonday() + 'T12:00:00');
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

export async function handleToolCall(
  name: string,
  input: Record<string, unknown>,
  ctx: ClientContext,
): Promise<string> {
  try {
    switch (name) {
      case 'getAvailableGirls': return await getAvailableGirls(input, ctx);
      case 'getGirlProfile': return await getGirlProfile(input);
      case 'searchGirls': return await searchGirls(input);
      case 'checkAvailability': return await checkAvailability(input);
      case 'getWeekSchedule': return await getWeekSchedule(input);
      case 'getPricing': return await getPricing();
      case 'getClientBookings': return await getClientBookings(input, ctx);
      case 'cancelBooking': return await cancelBooking(input, ctx);
      case 'subscribeToGirl': return await subscribeToGirl(input, ctx);
      case 'registerNewClient': {
        const result = await handleRegisterNewClient(input, ctx);
        const parsed = JSON.parse(result);
        if (parsed.success) {
          ctx.isRegistered = true;
          ctx.clientId = parsed.clientId;
          ctx.clientNumber = parsed.clientNumber;
          ctx.nickname = parsed.nickname;
          ctx.trustLevel = 'new';
          ctx.totalVisits = 0;
        }
        return result;
      }
      case 'sendGirlPhoto': return await handleSendGirlPhoto(input, ctx);
      case 'startBookingFlow': return await handleStartBookingFlow(input, ctx);
      default: return JSON.stringify({ error: 'Unknown tool' });
    }
  } catch (error) {
    console.error(`[telegram-ai] Tool ${name} failed:`, error);
    return JSON.stringify({ error: 'Nastala chyba pri zpracovani.' });
  }
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

async function getAvailableGirls(input: Record<string, unknown>, ctx: ClientContext): Promise<string> {
  const date = (input.date as string) || getPragueToday();

  // Use the SAME query as the calendar to ensure consistency
  const calendarGirls = await getCalendarGirls(date);

  // Filter to only working girls (active status)
  let working = calendarGirls.filter((g) => g.isWorking && g.shiftStart && g.shiftEnd);

  // If asking about today, skip girls whose shift already ended
  if (date === getPragueToday()) {
    const now = getPragueNow();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    working = working.filter((g) => {
      const [eh, em] = g.shiftEnd!.split(':').map(Number);
      return eh * 60 + em > nowMinutes;
    });
  }

  // Fetch extra details (age, hair, nationality, rating, photo) for working girls
  const girls: {
    id: number;
    name: string;
    age: number;
    hair: string | null;
    nationality: string | null;
    rating: number | null;
    reviewsCount: number;
    shiftStart: string;
    shiftEnd: string;
    location: string | null;
    photoUrl: string | null;
  }[] = [];

  for (const cg of working) {
    const detail = await db.execute({
      sql: `SELECT g.age, g.hair, g.nationality, g.rating, g.reviews_count,
                   (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo_url
            FROM girls g WHERE g.id = ? AND g.status = 'active' LIMIT 1`,
      args: [cg.id],
    });

    if (detail.rows.length === 0) continue; // Not active

    const r = detail.rows[0];
    girls.push({
      id: cg.id,
      name: cg.name,
      age: Number(r.age),
      hair: r.hair ? String(r.hair) : null,
      nationality: r.nationality ? String(r.nationality) : null,
      rating: r.rating ? Number(r.rating) : null,
      reviewsCount: r.reviews_count ? Number(r.reviews_count) : 0,
      shiftStart: cg.shiftStart!,
      shiftEnd: cg.shiftEnd!,
      location: cg.locationName,
      photoUrl: r.photo_url ? String(r.photo_url) : null,
    });
  }

  // Send photos of all available girls directly into the chat
  for (const g of girls) {
    if (g.photoUrl) {
      const caption = `<b>${g.name}</b>, ${g.age} let` +
        (g.rating ? `\n⭐ ${g.rating}/5` + (g.reviewsCount ? ` (${g.reviewsCount} recenzi)` : '') : '') +
        `\n🟢 ${g.shiftStart} – ${g.shiftEnd}` +
        (g.location ? `\n📍 ${g.location}` : '');
      await sendPhoto(ctx.chatId, g.photoUrl, { caption }).catch((err) => {
        console.error(`[telegram-ai] Failed to send photo for ${g.name}:`, err);
      });
    }
  }

  return JSON.stringify({ date, girls, count: girls.length, photosSent: true });
}

async function getGirlProfile(input: Record<string, unknown>): Promise<string> {
  const girlId = input.girlId as number | undefined;
  const girlName = input.girlName as string | undefined;

  let sql: string;
  let args: (string | number)[];

  if (girlId) {
    sql = `SELECT id, name, age, height, weight, bust, hair, eyes, nationality,
                  languages, bio_cs, rating, reviews_count,
                  tattoo_description_cs, piercing, piercing_description_cs
           FROM girls WHERE id = ? AND status = 'active' LIMIT 1`;
    args = [girlId];
  } else if (girlName) {
    sql = `SELECT id, name, age, height, weight, bust, hair, eyes, nationality,
                  languages, bio_cs, rating, reviews_count,
                  tattoo_description_cs, piercing, piercing_description_cs
           FROM girls WHERE LOWER(name) = LOWER(?) AND status = 'active' LIMIT 1`;
    args = [girlName];
  } else {
    return JSON.stringify({ error: 'Zadej girlId nebo girlName' });
  }

  const result = await db.execute({ sql, args });
  if (result.rows.length === 0) {
    return JSON.stringify({ error: 'Divka nenalezena' });
  }

  const g = result.rows[0];
  const id = Number(g.id);

  // Get services
  const svcResult = await db.execute({
    sql: `SELECT s.name_cs, s.category
          FROM girl_services gs
          JOIN services s ON gs.service_id = s.id
          WHERE gs.girl_id = ?`,
    args: [id],
  });

  return JSON.stringify({
    id,
    name: String(g.name),
    age: Number(g.age),
    height: g.height ? Number(g.height) : null,
    weight: g.weight ? Number(g.weight) : null,
    bust: g.bust ? String(g.bust) : null,
    hair: g.hair ? String(g.hair) : null,
    eyes: g.eyes ? String(g.eyes) : null,
    nationality: g.nationality ? String(g.nationality) : null,
    languages: g.languages ? String(g.languages) : null,
    bio: g.bio_cs ? String(g.bio_cs) : null,
    rating: g.rating ? Number(g.rating) : null,
    reviewsCount: g.reviews_count ? Number(g.reviews_count) : 0,
    tattoo: g.tattoo_description_cs ? String(g.tattoo_description_cs) : null,
    piercing: g.piercing_description_cs ? String(g.piercing_description_cs) : null,
    services: svcResult.rows.map((s) => ({
      name: String(s.name_cs),
      category: String(s.category),
    })),
  });
}

async function searchGirls(input: Record<string, unknown>): Promise<string> {
  const conditions: string[] = ["g.status = 'active'"];
  const args: (string | number)[] = [];

  if (input.hairColor) {
    conditions.push('LOWER(g.hair) LIKE ?');
    args.push(`%${String(input.hairColor).toLowerCase()}%`);
  }
  if (input.language) {
    conditions.push('LOWER(g.languages) LIKE ?');
    args.push(`%${String(input.language).toLowerCase()}%`);
  }
  if (input.ageMin) {
    conditions.push('g.age >= ?');
    args.push(Number(input.ageMin));
  }
  if (input.ageMax) {
    conditions.push('g.age <= ?');
    args.push(Number(input.ageMax));
  }

  const result = await db.execute({
    sql: `SELECT g.id, g.name, g.age, g.hair, g.nationality,
                 g.languages, g.rating, g.reviews_count
          FROM girls g
          WHERE ${conditions.join(' AND ')}
          ORDER BY g.rating DESC, g.reviews_count DESC
          LIMIT 10`,
    args,
  });

  // If availableDate filter, post-filter by schedule
  let girls = result.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    age: Number(r.age),
    hair: r.hair ? String(r.hair) : null,
    nationality: r.nationality ? String(r.nationality) : null,
    languages: r.languages ? String(r.languages) : null,
    rating: r.rating ? Number(r.rating) : null,
    reviewsCount: Number(r.reviews_count ?? 0),
  }));

  if (input.availableDate) {
    const date = String(input.availableDate);
    // Use the same query as the calendar for consistency
    const calendarGirls = await getCalendarGirls(date);
    const workingIds = new Set(
      calendarGirls.filter((cg) => cg.isWorking).map((cg) => cg.id),
    );
    girls = girls.filter((g) => workingIds.has(g.id));
  }

  return JSON.stringify({ results: girls, count: girls.length });
}

async function checkAvailability(input: Record<string, unknown>): Promise<string> {
  const girlId = Number(input.girlId);
  const date = String(input.date);

  // 1. Get shift using the same query as the calendar
  const calendarGirls = await getCalendarGirls(date);
  const girl = calendarGirls.find((g) => g.id === girlId);

  if (!girl || !girl.isWorking || !girl.shiftStart || !girl.shiftEnd) {
    return JSON.stringify({ available: false, reason: 'Divka v tento den nepracuje.' });
  }

  // Per-girl booking config (Emily etc.)
  const configResult = await db.execute({
    sql: 'SELECT booking_start_offset, booking_break_minutes FROM girls WHERE id = ? LIMIT 1',
    args: [girlId],
  });
  const configRow = configResult.rows[0];
  const startOffset = configRow?.booking_start_offset ? Number(configRow.booking_start_offset) : 0;
  const breakMin = configRow?.booking_break_minutes ? Number(configRow.booking_break_minutes) : 10;

  const shiftStart = girl.shiftStart;
  const shiftEnd = girl.shiftEnd;

  // 2. Get existing bookings
  const bookingsResult = await db.execute({
    sql: `SELECT start_time, end_time FROM bookings_v2
          WHERE girl_id = ? AND date = ?
            AND status NOT IN ('cancelled_client', 'cancelled_girl', 'declined', 'expired')`,
    args: [girlId, date],
  });

  // 3. Get active drafts
  const draftsResult = await db.execute({
    sql: `SELECT start_time, end_time FROM booking_drafts
          WHERE girl_id = ? AND date = ? AND is_converted = 0
            AND expires_at > datetime('now')`,
    args: [girlId, date],
  });

  // 4. Get slot locks
  const locksResult = await db.execute({
    sql: `SELECT start_time, end_time FROM slot_locks
          WHERE girl_id = ? AND date = ? AND expires_at > datetime('now')`,
    args: [girlId, date],
  });

  // Build occupied set (in minutes from 00:00)
  const occupied = new Set<number>();
  const allBlocked = [
    ...bookingsResult.rows,
    ...draftsResult.rows,
    ...locksResult.rows,
  ];

  for (const row of allBlocked) {
    const [sh, sm] = String(row.start_time).substring(0, 5).split(':').map(Number);
    const [eh, em] = String(row.end_time).substring(0, 5).split(':').map(Number);
    // Add break buffer after each booking
    for (let m = sh * 60 + sm; m < eh * 60 + em + breakMin; m += 30) {
      occupied.add(m);
    }
  }

  // Generate free 30min slots
  const [startH, startM] = shiftStart.split(':').map(Number);
  const [endH, endM] = shiftEnd.split(':').map(Number);
  const shiftStartMin = startH * 60 + startM + startOffset; // Apply booking_start_offset
  const shiftEndMin = endH * 60 + endM;

  const freeSlots: string[] = [];
  for (let m = shiftStartMin; m < shiftEndMin; m += 30) {
    if (!occupied.has(m)) {
      freeSlots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
  }

  return JSON.stringify({
    available: freeSlots.length > 0,
    date,
    shift: `${shiftStart}-${shiftEnd}`,
    freeSlots,
    count: freeSlots.length,
  });
}

async function getWeekSchedule(input: Record<string, unknown>): Promise<string> {
  const girlId = Number(input.girlId);
  const monday = new Date(getWeekMonday() + 'T12:00:00');
  const days: Array<{ day: string; date: string; working: boolean; shift: string | null; location: string | null }> = [];
  const dayNames = ['Ne', 'Po', 'Ut', 'St', 'Ct', 'Pa', 'So'];

  const today = getPragueToday();

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const jsDay = d.getDay();

    // Skip past days — bot should never suggest booking in the past
    if (dateStr < today) {
      continue;
    }

    // Use the same query as the calendar for consistency
    const calendarGirls = await getCalendarGirls(dateStr);
    const girl = calendarGirls.find((g) => g.id === girlId);

    if (!girl || !girl.isWorking || !girl.shiftStart || !girl.shiftEnd) {
      days.push({ day: dayNames[jsDay], date: dateStr, working: false, shift: null, location: null });
    } else {
      days.push({
        day: dayNames[jsDay],
        date: dateStr,
        working: true,
        shift: `${girl.shiftStart}-${girl.shiftEnd}`,
        location: girl.locationName,
      });
    }
  }

  // Get girl name
  const nameResult = await db.execute({
    sql: 'SELECT name FROM girls WHERE id = ? LIMIT 1',
    args: [girlId],
  });
  const girlName = nameResult.rows[0] ? String(nameResult.rows[0].name) : 'Divka';

  return JSON.stringify({ girlId, girlName, week: days });
}

async function getPricing(): Promise<string> {
  const result = await db.execute({
    sql: `SELECT duration, price, night_price FROM pricing_plans ORDER BY duration`,
    args: [],
  });

  const plans = result.rows.map((r) => ({
    duration: Number(r.duration),
    price: Number(r.price),
    nightPrice: r.night_price ? Number(r.night_price) : null,
  }));

  return JSON.stringify({
    plans,
    note: 'Ceny v CZK. Nocni cena plati od 22:00 do 6:00.',
  });
}

async function getClientBookings(
  input: Record<string, unknown>,
  ctx: ClientContext,
): Promise<string> {
  if (!ctx.isRegistered || !ctx.clientId) {
    return JSON.stringify({ error: 'Nejsi registrovany klient.' });
  }

  const includeHistory = Boolean(input.includeHistory);
  const today = getPragueToday();

  // Active bookings
  const activeResult = await db.execute({
    sql: `SELECT b.id, b.date, b.start_time, b.end_time, b.duration_minutes,
                 b.status, b.price, g.name AS girl_name
          FROM bookings_v2 b
          JOIN girls g ON g.id = b.girl_id
          WHERE b.client_id = ? AND b.date >= ?
            AND b.status IN ('confirmed', 'pending', 'in_progress')
          ORDER BY b.date, b.start_time
          LIMIT 10`,
    args: [ctx.clientId, today],
  });

  const active = activeResult.rows.map((r) => ({
    id: Number(r.id),
    date: String(r.date),
    startTime: String(r.start_time).substring(0, 5),
    endTime: String(r.end_time).substring(0, 5),
    duration: Number(r.duration_minutes),
    status: String(r.status),
    price: Number(r.price),
    girl: String(r.girl_name),
  }));

  let history: typeof active = [];
  if (includeHistory) {
    const histResult = await db.execute({
      sql: `SELECT b.id, b.date, b.start_time, b.end_time, b.duration_minutes,
                   b.status, b.price, g.name AS girl_name
            FROM bookings_v2 b
            JOIN girls g ON g.id = b.girl_id
            WHERE b.client_id = ?
              AND (b.date < ? OR b.status IN ('completed', 'cancelled_client', 'cancelled_girl'))
            ORDER BY b.date DESC, b.start_time DESC
            LIMIT 10`,
      args: [ctx.clientId, today],
    });
    history = histResult.rows.map((r) => ({
      id: Number(r.id),
      date: String(r.date),
      startTime: String(r.start_time).substring(0, 5),
      endTime: String(r.end_time).substring(0, 5),
      duration: Number(r.duration_minutes),
      status: String(r.status),
      price: Number(r.price),
      girl: String(r.girl_name),
    }));
  }

  return JSON.stringify({ active, history });
}

async function cancelBooking(
  input: Record<string, unknown>,
  ctx: ClientContext,
): Promise<string> {
  if (!ctx.isRegistered || !ctx.clientId) {
    return JSON.stringify({ error: 'Nejsi registrovany klient.' });
  }

  const bookingId = Number(input.bookingId);

  const result = await db.execute({
    sql: `UPDATE bookings_v2
          SET status = 'cancelled_client', cancelled_at = CURRENT_TIMESTAMP,
              cancel_reason = 'Klient zrusil pres AI bota', updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND client_id = ? AND status IN ('confirmed', 'pending')`,
    args: [bookingId, ctx.clientId],
  });

  if (result.rowsAffected === 0) {
    return JSON.stringify({ error: 'Rezervace nenalezena nebo ji nelze zrusit.' });
  }

  // Release slot lock
  await db.execute({
    sql: `DELETE FROM slot_locks WHERE locked_by = ?`,
    args: [`booking:${bookingId}`],
  }).catch(() => {});

  // Audit
  logAudit({
    bookingId,
    userId: ctx.clientId,
    action: 'booking.cancel',
    actorType: 'bot',
    entityType: 'booking',
    entityId: bookingId,
    details: { reason: 'client_cancelled_via_ai', chatId: ctx.chatId },
  }).catch(() => {});

  return JSON.stringify({ success: true, bookingId, status: 'cancelled_client' });
}

async function handleRegisterNewClient(
  input: Record<string, unknown>,
  ctx: ClientContext,
): Promise<string> {
  // Guard: already registered
  if (ctx.isRegistered) {
    return JSON.stringify({ error: 'Klient je uz registrovany.', clientId: ctx.clientId });
  }

  // Guard: max 1 registration per chat_id
  const existing = await db.execute({
    sql: 'SELECT id FROM booking_clients WHERE telegram_id = ? LIMIT 1',
    args: [ctx.chatId],
  });
  if (existing.rows.length > 0) {
    return JSON.stringify({ error: 'Uz jsi registrovany.' });
  }

  const nickname = String(input.nickname || 'Klient').trim();

  // Generate client number (LG-XXXX format)
  const maxRes = await db.execute(
    "SELECT MAX(CAST(REPLACE(client_number, 'LG-', '') AS INTEGER)) AS mx FROM booking_clients WHERE client_number LIKE 'LG-%'",
  );
  const maxNum = Number(maxRes.rows[0]?.mx ?? 0);
  const clientNumber = `LG-${maxNum + 1}`;

  // Generate deep_link_token
  const crypto = await import('crypto');
  const deepLinkToken = crypto.randomBytes(8).toString('hex');

  // Create client record
  const result = await db.execute({
    sql: `INSERT INTO booking_clients
            (client_number, nickname, telegram_id, source, trust_level,
             total_visits, deep_link_token, created_at, updated_at)
          VALUES (?, ?, ?, 'telegram', 'new', 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [clientNumber, nickname, ctx.chatId, deepLinkToken],
  });

  const clientId = Number(result.lastInsertRowid);

  // Also create telegram_users record
  await db.execute({
    sql: `INSERT OR IGNORE INTO telegram_users
            (telegram_user_id, client_id, chat_id, is_active, activated_at)
          VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    args: [ctx.chatId, clientId, ctx.chatId],
  });

  // Audit
  logAudit({
    userId: clientId,
    action: 'client.register',
    actorType: 'bot',
    entityType: 'client',
    entityId: clientId,
    details: { source: 'telegram_auto', chatId: ctx.chatId, nickname },
  }).catch(() => {});

  return JSON.stringify({
    success: true,
    clientId,
    clientNumber,
    nickname,
    message: `Klient zaregistrovan jako ${nickname} (${clientNumber}). Nyni muzes pouzit startBookingFlow.`,
  });
}

async function handleSendGirlPhoto(
  input: Record<string, unknown>,
  ctx: ClientContext,
): Promise<string> {
  const girlId = Number(input.girlId);
  const caption = input.caption as string | undefined;

  // Get girl name + primary photo URL
  const result = await db.execute({
    sql: `SELECT g.name,
                 (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo_url
          FROM girls g
          WHERE g.id = ? AND g.status = 'active'
          LIMIT 1`,
    args: [girlId],
  });

  if (result.rows.length === 0) {
    return JSON.stringify({ error: 'Divka nenalezena.' });
  }

  const girlName = String(result.rows[0].name);
  const photoUrl = result.rows[0].photo_url ? String(result.rows[0].photo_url) : null;

  if (!photoUrl) {
    return JSON.stringify({ error: `${girlName} nema zadnou fotku.` });
  }

  // Send photo to Telegram
  const sent = await sendPhoto(ctx.chatId, photoUrl, {
    caption: caption || undefined,
  });

  if (!sent) {
    return JSON.stringify({ error: 'Nepodarilo se odeslat fotku.' });
  }

  return JSON.stringify({
    success: true,
    girlName,
    photoSent: true,
    message: `Fotka ${girlName} odeslana klientovi.`,
  });
}

async function handleStartBookingFlow(
  input: Record<string, unknown>,
  ctx: ClientContext,
): Promise<string> {
  const girlId = Number(input.girlId);
  const date = String(input.date);

  try {
    const result = await startBookingFlow(ctx.chatId, ctx, girlId, date);
    return JSON.stringify({
      success: true,
      sessionId: result.sessionId,
      girlName: result.girlName,
      date: result.date,
      message: 'Booking flow spusten — klient nyni vybira cas pres tlacitka. NEODPOVIDEJ textem, flow pokracuje automaticky.',
    });
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Nepodarilo se spustit booking flow.',
    });
  }
}

async function subscribeToGirl(
  input: Record<string, unknown>,
  ctx: ClientContext,
): Promise<string> {
  const girlId = Number(input.girlId);

  try {
    await db.execute({
      sql: `INSERT OR IGNORE INTO schedule_reminders (client_telegram_id, girl_id)
            VALUES (?, ?)`,
      args: [ctx.chatId, girlId],
    });
  } catch {
    return JSON.stringify({ error: 'Nepodarilo se prihlasit k notifikaci.' });
  }

  // Get girl name
  const nameResult = await db.execute({
    sql: 'SELECT name FROM girls WHERE id = ? LIMIT 1',
    args: [girlId],
  });
  const girlName = nameResult.rows[0] ? String(nameResult.rows[0].name) : 'divka';

  return JSON.stringify({
    success: true,
    girlId,
    girlName,
    message: `Prihlaseno — upozornime te kdyz ${girlName} bude v novem rozvrhu.`,
  });
}
