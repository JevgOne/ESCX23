import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const PENALTY_AMOUNT = 500; // CZK
const DEADLINE_MINUTES = 30;

// Shift end times — deadline is end_time + 30 min
const SHIFT_END_TIMES: Record<string, string> = {
  morning: '16:00',
  afternoon: '22:00',
  fullday: '22:00',
};

/**
 * Cron (every 15 min) — penalise shifts not closed within 30 minutes after shift end.
 * morning ends 16:00 → deadline 16:30
 * afternoon ends 22:00 → deadline 22:30
 * fullday ends 22:00 → deadline 22:30
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Get current Prague time
  const now = new Date();
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const currentDate = pragueNow.toISOString().slice(0, 10);
  const currentHour = pragueNow.getHours();
  const currentMin = pragueNow.getMinutes();
  const currentMinutes = currentHour * 60 + currentMin;

  let totalPenalised = 0;

  // Check each shift type
  for (const [shiftType, endTime] of Object.entries(SHIFT_END_TIMES)) {
    const [h, m] = endTime.split(':').map(Number);
    const deadlineMinutes = h * 60 + m + DEADLINE_MINUTES;

    // Penalise today's shifts if past deadline
    if (currentMinutes >= deadlineMinutes) {
      const result = await db.execute({
        sql: `UPDATE shift_closures
              SET status = 'penalty',
                  penalty_amount = ?,
                  penalty_reason = ?
              WHERE status = 'open'
                AND date = ?
                AND shift_type = ?`,
        args: [PENALTY_AMOUNT, `Neuzavřena do ${DEADLINE_MINUTES} min po konci směny`, currentDate, shiftType],
      });
      totalPenalised += result.rowsAffected;
    }

    // Also penalise any past-day open closures (missed entirely)
    const pastResult = await db.execute({
      sql: `UPDATE shift_closures
            SET status = 'penalty',
                penalty_amount = ?,
                penalty_reason = 'Neuzavřena (prošlý den)'
            WHERE status = 'open'
              AND date < ?
              AND shift_type = ?`,
      args: [PENALTY_AMOUNT, currentDate, shiftType],
    });
    totalPenalised += pastResult.rowsAffected;
  }

  // Create admin notification if any penalties
  if (totalPenalised > 0) {
    try {
      await db.execute({
        sql: `INSERT INTO admin_notifications (type, title, message)
              VALUES ('shift_penalty', 'Neuzavřené směny', ?)`,
        args: [`${totalPenalised} směn penalizováno (${PENALTY_AMOUNT} Kč)`],
      });
    } catch {
      // admin_notifications table might not exist
    }
  }

  return NextResponse.json({
    success: true,
    penalised: totalPenalised,
    amount: PENALTY_AMOUNT,
    deadlineMinutes: DEADLINE_MINUTES,
  });
}
