import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Hardcoded girl name → ID mapping (primary, reliable)
const GIRL_ID_MAP: Record<string, number> = {
  'anetta': 41, 'dana': 42, 'elizabeth': 21, 'eliška': 44, 'eliska': 44,
  'ema': 57, 'emily': 28, 'katy': 31, 'caty': 31, 'kim': 46,
  'luna': 22, 'lyra': 43, 'natalie': 26, 'nika': 25, 'nina': 56,
  'sara': 20, 'timea': 55, 'viktoria': 50, 'victoria': 50,
};

/**
 * One-time data fix endpoint:
 * - POST: Fix pending bookings + import ICS bookings
 * - GET: Diagnostics
 * - Auth: Bearer IMPORT_SECRET
 */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  const secret = process.env.IMPORT_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const results: string[] = [];

    // 1. Fix old pending bookings → expired
    if (body.fixPending) {
      const res = await db.execute({
        sql: `UPDATE bookings_v2 SET status = 'expired', cancel_reason = 'Auto-expired: old pending',
              cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
              WHERE status = 'pending'`,
        args: [],
      });
      results.push(`Fixed ${res.rowsAffected} pending bookings → expired`);
    }

    // 2. Import ICS bookings
    if (body.bookings && Array.isArray(body.bookings)) {
      // Ensure a placeholder "GCal Import" client exists (FK constraint requires valid client_id)
      let gcalClientId: number;
      const existingClient = await db.execute(
        "SELECT id FROM booking_clients WHERE client_number = 'LG-GCAL'"
      );
      if (existingClient.rows.length > 0) {
        gcalClientId = Number(existingClient.rows[0].id);
      } else {
        const ins = await db.execute({
          sql: `INSERT INTO booking_clients (client_number, nickname, trust_level, is_banned, no_show_count, total_visits, source, created_at, updated_at)
                VALUES ('LG-GCAL', 'GCal Import', 'regular', 0, 0, 0, 'walkin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [],
        });
        gcalClientId = Number(ins.lastInsertRowid);
        results.push(`Created placeholder client LG-GCAL (id=${gcalClientId})`);
      }

      // Build girl name → ID map: hardcoded first, then DB as fallback for new girls
      const girlMap = new Map<string, number>(Object.entries(GIRL_ID_MAP));

      // Add any DB girls not in hardcoded map
      const girlsRes = await db.execute('SELECT id, name FROM girls');
      for (const r of girlsRes.rows) {
        const key = String(r.name).toLowerCase();
        if (!girlMap.has(key)) {
          girlMap.set(key, Number(r.id));
        }
      }

      let imported = 0;
      let skipped = 0;

      for (const bk of body.bookings) {
        const girlName = String(bk.girl).toLowerCase();
        const girlId = girlMap.get(girlName);

        if (!girlId) {
          results.push(`SKIP: No girl found for "${bk.girl}"`);
          skipped++;
          continue;
        }

        // Check for duplicate (same girl, date, start_time)
        const existing = await db.execute({
          sql: `SELECT id FROM bookings_v2 WHERE girl_id = ? AND date = ? AND start_time = ?
                AND status NOT IN ('cancelled_client', 'cancelled_girl', 'declined', 'expired')`,
          args: [girlId, bk.date, bk.start],
        });

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        // Extract client name from summary (format: "GirlName ClientInfo")
        const summary = String(bk.summary || '');
        const clientNote = summary.replace(/^\S+\s*/, '').trim() || null;

        await db.execute({
          sql: `INSERT INTO bookings_v2 (
                  client_id, girl_id, date, start_time, end_time, duration_minutes,
                  price, points_earned, status, source, channel, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'confirmed', 'gcal_import', 'phone', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [gcalClientId, girlId, bk.date, bk.start, bk.end, bk.duration, clientNote],
        });
        imported++;
      }

      results.push(`Imported ${imported} bookings, skipped ${skipped}`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[fix-data] POST error:', error);
    return NextResponse.json(
      { error: 'Internal error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const secret = process.env.IMPORT_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pendingCount = await db.execute(
      `SELECT COUNT(*) as cnt FROM bookings_v2 WHERE status = 'pending'`
    );
    const totalBookings = await db.execute(
      `SELECT COUNT(*) as cnt FROM bookings_v2`
    );
    const girlsList = await db.execute(
      'SELECT id, name FROM girls ORDER BY name'
    );

    return NextResponse.json({
      pending: Number(pendingCount.rows[0]?.cnt),
      totalBookings: Number(totalBookings.rows[0]?.cnt),
      girls: girlsList.rows.map(r => ({ id: Number(r.id), name: String(r.name) })),
    });
  } catch (error) {
    console.error('[fix-data] GET error:', error);
    return NextResponse.json(
      { error: 'Internal error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
