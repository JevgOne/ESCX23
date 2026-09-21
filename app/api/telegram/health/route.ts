import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Check DB connection
  try {
    await db.execute('SELECT 1');
    checks.db = 'ok';
  } catch (e) {
    checks.db = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 2. Check Anthropic API key
  checks.anthropic_key = process.env.ANTHROPIC_API_KEY ? 'set' : 'MISSING';

  // 3. Check Telegram token
  checks.telegram_token = process.env.TELEGRAM_BOT_TOKEN ? 'set' : 'MISSING';

  // 4. Check model
  checks.model = process.env.AI_OPERATOR_MODEL ?? 'claude-sonnet-4-6 (default)';

  // 5. Check required tables
  for (const table of ['telegram_messages', 'telegram_rate_limits', 'booking_clients']) {
    try {
      await db.execute(`SELECT COUNT(*) AS c FROM ${table}`);
      checks[`table_${table}`] = 'ok';
    } catch {
      checks[`table_${table}`] = 'MISSING';
    }
  }

  // 6. Diagnostics: migrations state
  let migrations: string[] = [];
  try {
    const migRes = await db.execute('SELECT name FROM _migrations ORDER BY name');
    migrations = migRes.rows.map((r) => String(r.name));
  } catch {
    // _migrations table may not exist
  }

  // 7. Diagnostics: girl_schedules for all days (with girl name)
  let sundaySchedules: Array<{ girl_id: number; name: string; day_of_week: number; start: string; end: string }> = [];
  try {
    const sunRes = await db.execute(`
      SELECT gs.girl_id, g.name, gs.day_of_week, gs.start_time, gs.end_time
      FROM girl_schedules gs
      JOIN girls g ON g.id = gs.girl_id
      WHERE gs.day_of_week = 6 AND gs.is_active = 1
      ORDER BY g.name
    `);
    sundaySchedules = sunRes.rows.map((r) => ({
      girl_id: Number(r.girl_id),
      name: String(r.name),
      day_of_week: Number(r.day_of_week),
      start: String(r.start_time).substring(0, 5),
      end: String(r.end_time).substring(0, 5),
    }));
  } catch { /* OK */ }

  // 8. Diagnostics: active girls count
  let activeGirlsCount = 0;
  try {
    const countRes = await db.execute("SELECT COUNT(*) AS c FROM girls WHERE status = 'active'");
    activeGirlsCount = Number(countRes.rows[0]?.c ?? 0);
  } catch { /* OK */ }

  // 9. Diagnostics: all day_of_week distribution
  let dowDistribution: Array<{ day_of_week: number; count: number }> = [];
  try {
    const dowRes = await db.execute(`
      SELECT day_of_week, COUNT(*) AS c FROM girl_schedules WHERE is_active = 1
      GROUP BY day_of_week ORDER BY day_of_week
    `);
    dowDistribution = dowRes.rows.map((r) => ({
      day_of_week: Number(r.day_of_week),
      count: Number(r.c),
    }));
  } catch { /* OK */ }

  // 10. Diagnostics: ICS bookings count
  let icsBookingsCount = 0;
  try {
    const icsRes = await db.execute("SELECT COUNT(*) AS c FROM bookings_v2 WHERE source IN ('ics_import', 'gcal_import')");
    icsBookingsCount = Number(icsRes.rows[0]?.c ?? 0);
  } catch { /* OK */ }

  // 11. Diagnostics: Emily Tuesday bookings
  let emilyTuesday: Array<{ date: string; start_time: string; end_time: string; source: string }> = [];
  try {
    const emilyRes = await db.execute(`
      SELECT b.date, b.start_time, b.end_time, b.source
      FROM bookings_v2 b
      WHERE b.girl_id = 28 AND b.date = '2026-09-22'
      ORDER BY b.start_time
    `);
    emilyTuesday = emilyRes.rows.map((r) => ({
      date: String(r.date),
      start_time: String(r.start_time),
      end_time: String(r.end_time),
      source: String(r.source),
    }));
  } catch { /* OK */ }

  // 12. Diagnostics: total bookings count
  let totalBookingsCount = 0;
  try {
    const totalRes = await db.execute('SELECT COUNT(*) AS c FROM bookings_v2');
    totalBookingsCount = Number(totalRes.rows[0]?.c ?? 0);
  } catch { /* OK */ }

  const hasError = Object.values(checks).some(
    (v) => v === 'MISSING' || v.startsWith('error'),
  );

  return NextResponse.json(
    {
      status: hasError ? 'unhealthy' : 'healthy',
      checks,
      diagnostics: {
        migrations,
        activeGirlsCount,
        sundaySchedules_dow6: sundaySchedules,
        dowDistribution,
        icsBookingsCount,
        emilyTuesday,
        totalBookingsCount,
      },
    },
    { status: hasError ? 503 : 200 },
  );
}
