import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, string> = {};

  // Test 1: Can we import db?
  try {
    const { db } = await import('@/lib/db');
    results['1_db_import'] = 'OK';

    // Test 2: Can we query girl_photos?
    const r = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM girl_photos WHERE girl_id = 58`,
      args: [],
    });
    results['2_photo_count'] = String(r.rows[0]?.cnt ?? 'null');

    // Test 3: Does is_secondary column exist?
    try {
      const r2 = await db.execute({
        sql: `SELECT id, url, is_primary, COALESCE(is_secondary, 0) AS is_secondary FROM girl_photos WHERE girl_id = 58 LIMIT 1`,
        args: [],
      });
      results['3_is_secondary'] = r2.rows.length > 0 ? 'column exists, rows=' + r2.rows.length : 'column exists, 0 rows';
    } catch (e) {
      results['3_is_secondary'] = 'FAIL: ' + (e instanceof Error ? e.message : String(e));
    }
  } catch (e) {
    results['1_db_import'] = 'FAIL: ' + (e instanceof Error ? e.message : String(e));
  }

  // Test 4: Can we import getGirlById?
  try {
    const { getGirlById } = await import('@/lib/queries');
    const girl = await getGirlById(58);
    results['4_getGirlById'] = girl ? `OK: ${girl.name}` : 'null (girl not found)';
  } catch (e) {
    results['4_getGirlById'] = 'FAIL: ' + (e instanceof Error ? e.message : String(e));
  }

  // Test 5: Can we import fotky-actions?
  try {
    const mod = await import('@/lib/fotky-actions');
    results['5_fotky_actions'] = Object.keys(mod).join(', ');
  } catch (e) {
    results['5_fotky_actions'] = 'FAIL: ' + (e instanceof Error ? e.message : String(e));
  }

  // Test 6: Can we import photo-actions?
  try {
    const mod = await import('@/lib/photo-actions');
    results['6_photo_actions'] = Object.keys(mod).join(', ');
  } catch (e) {
    results['6_photo_actions'] = 'FAIL: ' + (e instanceof Error ? e.message : String(e));
  }

  return NextResponse.json(results, { status: 200 });
}
