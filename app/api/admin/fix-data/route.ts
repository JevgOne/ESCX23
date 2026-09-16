import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

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

    // 0. Run pending migrations (adds missing columns + fixes CHECK constraint)
    if (body.runMigrations) {
      // Add missing columns (idempotent — skips if already exists)
      const addColumns = [
        'ALTER TABLE users ADD COLUMN display_name TEXT',
        'ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1',
        'ALTER TABLE users ADD COLUMN telegram_chat_id TEXT',
      ];
      for (const sql of addColumns) {
        try {
          await db.execute(sql);
          results.push(`Migration OK: ${sql.substring(0, 60)}...`);
        } catch {
          results.push(`Migration skip (exists): ${sql.substring(0, 60)}...`);
        }
      }

      // Expand role CHECK to include 'operator' (requires table recreation in SQLite)
      try {
        const testResult = await db.execute(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
        );
        const tableSql = String(testResult.rows[0]?.sql ?? '');
        if (!tableSql.includes("'operator'")) {
          await db.execute(`
            CREATE TABLE IF NOT EXISTS users_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT NOT NULL UNIQUE,
              password_hash TEXT NOT NULL,
              role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'operator', 'girl')),
              girl_id INTEGER,
              display_name TEXT,
              is_active INTEGER DEFAULT 1,
              telegram_chat_id TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);
          // Copy data — handle missing columns gracefully
          const cols = ['id', 'email', 'password_hash', 'role', 'girl_id', 'created_at', 'updated_at'];
          if (tableSql.includes('display_name')) cols.push('display_name');
          if (tableSql.includes('is_active')) cols.push('is_active');
          if (tableSql.includes('telegram_chat_id')) cols.push('telegram_chat_id');
          const colList = cols.join(', ');
          await db.execute(`INSERT INTO users_new (${colList}) SELECT ${colList} FROM users`);
          await db.execute('DROP TABLE users');
          await db.execute('ALTER TABLE users_new RENAME TO users');
          results.push('Migration OK: Recreated users table with operator role support');
        } else {
          results.push('Migration skip: users table already supports operator role');
        }
      } catch (e) {
        results.push(`Migration ERROR (role check): ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 0b. Fix users with NULL is_active → set to 1
    if (body.activateUsers) {
      const res = await db.execute({
        sql: "UPDATE users SET is_active = 1 WHERE is_active IS NULL OR is_active = 0",
        args: [],
      });
      results.push(`Activated ${res.rowsAffected} users`);
    }

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

    // 3. Create user account
    if (body.createUser) {
      const { email, password, role, displayName, girlId } = body.createUser;
      if (!email || !password || !role) {
        results.push('createUser: missing email/password/role');
      } else {
        const existing = await db.execute({
          sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
          args: [email.trim().toLowerCase()],
        });
        if (existing.rows.length > 0) {
          results.push(`createUser: user ${email} already exists (id=${existing.rows[0].id})`);
        } else {
          const hash = await bcrypt.hash(password, 12);
          const res = await db.execute({
            sql: `INSERT INTO users (email, password_hash, role, display_name, girl_id, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            args: [email.trim().toLowerCase(), hash, role, displayName || null, girlId || null],
          });
          results.push(`Created user ${email} (id=${res.lastInsertRowid}, role=${role}, girl_id=${girlId || 'none'})`);
        }
      }
    }

    // 4. Bulk-create Studio accounts for all girls without a user account
    if (body.createGirlUsers) {
      const defaultPassword = body.createGirlUsers.password || 'Studio2026!';
      const girlsWithoutUser = await db.execute(`
        SELECT g.id, g.name, g.slug FROM girls g
        LEFT JOIN users u ON u.girl_id = g.id
        WHERE u.id IS NULL AND g.status != 'archived'
        ORDER BY g.name
      `);

      let created = 0;
      for (const g of girlsWithoutUser.rows) {
        const girlName = String(g.name).toLowerCase();
        const email = `${String(g.slug || girlName).replace(/\s+/g, '')}@studio.lovelygirls.cz`;

        // Check email uniqueness
        const dup = await db.execute({
          sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
          args: [email],
        });
        if (dup.rows.length > 0) {
          results.push(`SKIP girl ${g.name}: email ${email} already exists`);
          continue;
        }

        const hash = await bcrypt.hash(defaultPassword, 12);
        await db.execute({
          sql: `INSERT INTO users (email, password_hash, role, display_name, girl_id, is_active, created_at, updated_at)
                VALUES (?, ?, 'girl', ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [email, hash, String(g.name), Number(g.id)],
        });
        created++;
      }
      results.push(`Created ${created} girl Studio accounts (password: ${defaultPassword}), ${girlsWithoutUser.rows.length - created} skipped`);
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
      `SELECT g.id, g.name, g.slug, g.status, u.id as user_id, u.email as user_email
       FROM girls g LEFT JOIN users u ON u.girl_id = g.id
       ORDER BY g.name`
    );
    const usersList = await db.execute(
      'SELECT * FROM users ORDER BY id'
    );

    // Schedule diagnostics
    const schedulesList = await db.execute(
      `SELECT gs.girl_id, g.name, gs.day_of_week, gs.start_time, gs.end_time, gs.is_active, l.name as location_name
       FROM girl_schedules gs
       JOIN girls g ON g.id = gs.girl_id
       LEFT JOIN locations l ON l.id = gs.location_id
       WHERE gs.is_active = 1
       ORDER BY gs.girl_id, gs.day_of_week`
    );

    return NextResponse.json({
      pending: Number(pendingCount.rows[0]?.cnt),
      totalBookings: Number(totalBookings.rows[0]?.cnt),
      schedules: schedulesList.rows.map(r => ({
        girlId: Number(r.girl_id), name: String(r.name),
        dayOfWeek: Number(r.day_of_week), startTime: String(r.start_time),
        endTime: String(r.end_time), location: r.location_name ? String(r.location_name) : null,
      })),
      girls: girlsList.rows.map(r => ({
        id: Number(r.id), name: String(r.name), slug: String(r.slug ?? ''),
        status: String(r.status ?? ''),
        hasStudioAccount: r.user_id != null,
        studioEmail: r.user_email ? String(r.user_email) : null,
      })),
      users: usersList.rows.map(r => ({
        id: Number(r.id), email: String(r.email), role: String(r.role),
        displayName: r.display_name ? String(r.display_name) : null,
        isActive: Number(r.is_active) === 1, girlId: r.girl_id ? Number(r.girl_id) : null,
      })),
    });
  } catch (error) {
    console.error('[fix-data] GET error:', error);
    return NextResponse.json(
      { error: 'Internal error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
