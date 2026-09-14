import { db } from '../db';
import { logAudit } from '../audit';
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

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
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
      case 'getAvailableGirls': return await getAvailableGirls(input);
      case 'getGirlProfile': return await getGirlProfile(input);
      case 'searchGirls': return await searchGirls(input);
      case 'checkAvailability': return await checkAvailability(input);
      case 'getWeekSchedule': return await getWeekSchedule(input);
      case 'getPricing': return await getPricing();
      case 'createBooking': return await createBooking(input, ctx);
      case 'getClientBookings': return await getClientBookings(input, ctx);
      case 'cancelBooking': return await cancelBooking(input, ctx);
      case 'subscribeToGirl': return await subscribeToGirl(input, ctx);
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

async function getAvailableGirls(input: Record<string, unknown>): Promise<string> {
  const date = (input.date as string) || getPragueToday();
  const d = new Date(date + 'T12:00:00');
  const dayOfWeek = d.getDay();

  const result = await db.execute({
    sql: `
      SELECT g.id, g.name, g.age, g.hair, g.nationality,
             gs.start_time, gs.end_time, l.name AS location_name
      FROM girls g
      JOIN girl_schedules gs ON g.id = gs.girl_id
        AND gs.day_of_week = ? AND gs.is_active = 1
        AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
      LEFT JOIN locations l ON l.id = gs.location_id
      WHERE g.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM schedule_exceptions se
          WHERE se.girl_id = g.id AND se.date = ? AND se.type = 'unavailable'
        )
      ORDER BY g.name
    `,
    args: [dayOfWeek, date, date],
  });

  const girls = result.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    age: Number(r.age),
    hair: r.hair ? String(r.hair) : null,
    nationality: r.nationality ? String(r.nationality) : null,
    shiftStart: String(r.start_time).substring(0, 5),
    shiftEnd: String(r.end_time).substring(0, 5),
    location: r.location_name ? String(r.location_name) : null,
  }));

  return JSON.stringify({ date, girls, count: girls.length });
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
    const dow = new Date(date + 'T12:00:00').getDay();
    const available: typeof girls = [];
    for (const g of girls) {
      const sched = await db.execute({
        sql: `SELECT 1 FROM girl_schedules
              WHERE girl_id = ? AND day_of_week = ? AND is_active = 1
              LIMIT 1`,
        args: [g.id, dow],
      });
      if (sched.rows.length > 0) available.push(g);
    }
    girls = available;
  }

  return JSON.stringify({ results: girls, count: girls.length });
}

async function checkAvailability(input: Record<string, unknown>): Promise<string> {
  const girlId = Number(input.girlId);
  const date = String(input.date);
  const dow = new Date(date + 'T12:00:00').getDay();

  // 1. Get shift
  const shiftResult = await db.execute({
    sql: `SELECT gs.start_time, gs.end_time,
                 se.type AS ex_type, se.start_time AS ex_start, se.end_time AS ex_end
          FROM girl_schedules gs
          LEFT JOIN schedule_exceptions se ON se.girl_id = gs.girl_id AND se.date = ?
          WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
            AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
          ORDER BY gs.effective_from DESC NULLS LAST
          LIMIT 1`,
    args: [date, girlId, dow, date],
  });

  if (shiftResult.rows.length === 0) {
    return JSON.stringify({ available: false, reason: 'Divka v tento den nepracuje.' });
  }

  const sr = shiftResult.rows[0];
  if (String(sr.ex_type) === 'unavailable') {
    return JSON.stringify({ available: false, reason: 'Divka ma v tento den volno.' });
  }

  let shiftStart = String(sr.start_time).substring(0, 5);
  let shiftEnd = String(sr.end_time).substring(0, 5);
  if (String(sr.ex_type) === 'custom_hours') {
    if (sr.ex_start) shiftStart = String(sr.ex_start).substring(0, 5);
    if (sr.ex_end) shiftEnd = String(sr.ex_end).substring(0, 5);
  }

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
    // Add 15min buffer after each booking
    for (let m = sh * 60 + sm; m < eh * 60 + em + 15; m += 30) {
      occupied.add(m);
    }
  }

  // Generate free 30min slots
  const [startH, startM] = shiftStart.split(':').map(Number);
  const [endH, endM] = shiftEnd.split(':').map(Number);
  const shiftStartMin = startH * 60 + startM;
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

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dow = d.getDay();

    const result = await db.execute({
      sql: `SELECT gs.start_time, gs.end_time, l.name AS location_name,
                   se.type AS ex_type, se.start_time AS ex_start, se.end_time AS ex_end
            FROM girl_schedules gs
            LEFT JOIN locations l ON l.id = gs.location_id
            LEFT JOIN schedule_exceptions se ON se.girl_id = gs.girl_id AND se.date = ?
            WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
              AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
            ORDER BY gs.effective_from DESC NULLS LAST
            LIMIT 1`,
      args: [dateStr, girlId, dow, dateStr],
    });

    if (result.rows.length === 0 || String(result.rows[0].ex_type) === 'unavailable') {
      days.push({ day: dayNames[dow], date: dateStr, working: false, shift: null, location: null });
    } else {
      const r = result.rows[0];
      let start = String(r.start_time).substring(0, 5);
      let end = String(r.end_time).substring(0, 5);
      if (String(r.ex_type) === 'custom_hours') {
        if (r.ex_start) start = String(r.ex_start).substring(0, 5);
        if (r.ex_end) end = String(r.ex_end).substring(0, 5);
      }
      days.push({
        day: dayNames[dow],
        date: dateStr,
        working: true,
        shift: `${start}-${end}`,
        location: r.location_name ? String(r.location_name) : null,
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

async function createBooking(
  input: Record<string, unknown>,
  ctx: ClientContext,
): Promise<string> {
  if (!ctx.isRegistered || !ctx.clientId) {
    return JSON.stringify({ error: 'Pro rezervaci musis byt registrovany klient.' });
  }
  if (ctx.totalVisits < 3) {
    return JSON.stringify({ error: 'Rezervace pres bota je dostupna od 3 navstev. Zavolej nam pro objednani.' });
  }
  if (ctx.isBanned) {
    return JSON.stringify({ error: 'Tvuj ucet je zablokovany. Kontaktuj studio.' });
  }

  const girlId = Number(input.girlId);
  const date = String(input.date);
  const startTime = String(input.startTime);
  const duration = Number(input.durationMinutes);

  // Validate date is in current week
  const weekMon = getWeekMonday();
  const weekSun = getWeekSunday();
  if (date < weekMon || date > weekSun) {
    return JSON.stringify({ error: 'Lze bookovat pouze aktualni tyden.' });
  }

  // Validate duration
  if (![30, 45, 60, 90, 120].includes(duration)) {
    return JSON.stringify({ error: 'Platne delky: 30, 45, 60, 90, 120 minut.' });
  }

  const endTime = addMinutes(startTime, duration);

  // Check availability first
  const availJson = await checkAvailability({ girlId, date });
  const avail = JSON.parse(availJson);
  if (!avail.available) {
    return JSON.stringify({ error: avail.reason ?? 'Divka neni dostupna.' });
  }
  if (!avail.freeSlots.includes(startTime)) {
    return JSON.stringify({ error: `Slot ${startTime} neni volny. Volne: ${avail.freeSlots.slice(0, 5).join(', ')}` });
  }

  // Get price
  const priceResult = await db.execute({
    sql: 'SELECT price, night_price FROM pricing_plans WHERE duration = ? LIMIT 1',
    args: [duration],
  });
  const priceRow = priceResult.rows[0];
  const [sh] = startTime.split(':').map(Number);
  const isNight = sh >= 22 || sh < 6;
  const price = priceRow
    ? (isNight && priceRow.night_price ? Number(priceRow.night_price) : Number(priceRow.price))
    : 0;

  // Slot lock
  try {
    await db.execute({
      sql: `INSERT INTO slot_locks (girl_id, date, start_time, end_time, locked_by, expires_at)
            VALUES (?, ?, ?, ?, 'ai_booking', datetime('now', '+5 minutes'))`,
      args: [girlId, date, startTime, endTime],
    });
  } catch {
    return JSON.stringify({ error: 'Slot je prave obsazovany nekym jinym. Zkus jiny cas.' });
  }

  // Create booking (auto-confirmed for established clients via bot)
  const bookingResult = await db.execute({
    sql: `INSERT INTO bookings_v2 (
            client_id, girl_id, date, start_time, end_time, duration_minutes,
            price, points_earned, status, source, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'ai_operator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [ctx.clientId, girlId, date, startTime, endTime, duration, price, price],
  });

  const bookingId = Number(bookingResult.lastInsertRowid);

  // Update slot lock
  await db.execute({
    sql: `UPDATE slot_locks SET locked_by = ? WHERE girl_id = ? AND date = ? AND start_time = ? AND end_time = ?`,
    args: [`booking:${bookingId}`, girlId, date, startTime, endTime],
  }).catch(() => {});

  // Audit log
  logAudit({
    bookingId,
    userId: ctx.clientId,
    action: 'booking.create',
    actorType: 'bot',
    entityType: 'booking',
    entityId: bookingId,
    details: { source: 'ai_operator', chatId: ctx.chatId },
  }).catch(() => {});

  // Get girl name and location for confirmation
  const girlResult = await db.execute({
    sql: `SELECT g.name, l.name AS location_name
          FROM girls g
          LEFT JOIN girl_schedules gs ON gs.girl_id = g.id AND gs.day_of_week = ? AND gs.is_active = 1
          LEFT JOIN locations l ON l.id = gs.location_id
          WHERE g.id = ?
          LIMIT 1`,
    args: [new Date(date + 'T12:00:00').getDay(), girlId],
  });
  const girlName = girlResult.rows[0] ? String(girlResult.rows[0].name) : '—';
  const location = girlResult.rows[0]?.location_name ? String(girlResult.rows[0].location_name) : null;

  return JSON.stringify({
    success: true,
    bookingId,
    girl: girlName,
    date,
    startTime,
    endTime,
    duration,
    price,
    location,
    status: 'confirmed',
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
