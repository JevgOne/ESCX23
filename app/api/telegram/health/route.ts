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

  const hasError = Object.values(checks).some(
    (v) => v === 'MISSING' || v.startsWith('error'),
  );

  return NextResponse.json(
    { status: hasError ? 'unhealthy' : 'healthy', checks },
    { status: hasError ? 503 : 200 },
  );
}
