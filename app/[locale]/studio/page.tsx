import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById, getGirlProfileCompletion } from '@/lib/queries';
import { pragueDateISO, pragueDayOfWeek, formatPragueTime } from '@/lib/utils';
import { db } from '@/lib/db';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAY_LABELS_CS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const MONTH_CS = ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];

async function getTodayStatus(girlId: number) {
  const today = pragueDateISO();
  const dow = pragueDayOfWeek();

  const [exRes, schedRes] = await Promise.all([
    db.execute({
      sql: `SELECT exception_type, start_time, end_time FROM schedule_exceptions WHERE girl_id = ? AND date = ? LIMIT 1`,
      args: [girlId, today],
    }),
    db.execute({
      sql: `SELECT start_time, end_time FROM girl_schedules WHERE girl_id = ? AND day_of_week = ? AND is_active = 1 LIMIT 1`,
      args: [girlId, dow],
    }),
  ]);

  const ex = exRes.rows[0] ?? null;
  const sch = schedRes.rows[0] ?? null;

  if (ex && ex.exception_type === 'unavailable') return { online: false, timeRange: null };
  if (ex && ex.exception_type === 'custom_hours') {
    const f = ex.start_time ? String(ex.start_time).substring(0, 5) : null;
    const t = ex.end_time ? String(ex.end_time).substring(0, 5) : null;
    return { online: true, timeRange: f && t ? `${f} — ${t}` : null };
  }
  if (sch) {
    const f = sch.start_time ? String(sch.start_time).substring(0, 5) : null;
    const t = sch.end_time ? String(sch.end_time).substring(0, 5) : null;
    return { online: true, timeRange: f && t ? `${f} — ${t}` : null };
  }
  return { online: false, timeRange: null };
}

async function getPendingCounts(girlId: number) {
  const [photosRes, reviewsRes] = await Promise.all([
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM girl_photos WHERE girl_id = ? AND is_primary = 0`,
      args: [girlId],
    }),
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM reviews WHERE girl_id = ? AND (status IS NULL OR status = 'pending')`,
      args: [girlId],
    }),
  ]);
  return {
    pendingPhotos: Number(photosRes.rows[0]?.cnt ?? 0),
    pendingReviews: Number(reviewsRes.rows[0]?.cnt ?? 0),
  };
}

export default async function StudioDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;

  const [girl, completion, todayStatus, pending] = await Promise.all([
    getGirlById(girlId),
    getGirlProfileCompletion(girlId),
    getTodayStatus(girlId),
    getPendingCounts(girlId),
  ]);

  const name = girl ? String(girl.name ?? '') : '';
  const location = girl?.location ? String(girl.location) : null;

  const now = new Date();
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const dow = pragueDayOfWeek();
  const dayLabel = DAY_LABELS_CS[dow];
  const dayNum = pragueNow.getDate();
  const monthLabel = MONTH_CS[pragueNow.getMonth()];

  const completionFill = Math.min(100, Math.max(0, completion));
  const filledBlocks = Math.round(completionFill / 100 * 14);
  const emptyBlocks = 14 - filledBlocks;
  const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

  return (
    <>
      <StudioTopbar title="Studio" />

      <div className="studio-dashboard">
        <div className="studio-greeting">
          Ahoj {name} 👋
        </div>

        <div className="studio-completion-card">
          <div className="completion-label">Vyplněnost profilu: <strong>{completionFill}%</strong></div>
          <div className="completion-bar">
            <div className="completion-bar-fill" style={{ width: `${completionFill}%` }} />
          </div>
          <div className="completion-bar-text">{bar} <span className="completion-percent">{completionFill}%</span></div>
        </div>

        <div className="studio-today-card">
          <div className="studio-today-label">DNES {dayLabel} {dayNum}. {monthLabel}</div>
          <div className="studio-today-status">
            <span className={`studio-status-dot ${todayStatus.online ? 'dot-online' : 'dot-off'}`} />
            <span>{todayStatus.online ? 'Online' : 'Volno'}</span>
            {todayStatus.timeRange && <span className="studio-today-time">· {todayStatus.timeRange}</span>}
            {location && <span className="studio-today-loc">· {location}</span>}
            <a href={`/${locale}/studio/dostupnost`} className="studio-today-change">[Změnit]</a>
          </div>
        </div>

        <div className="studio-stats-section">
          <div className="studio-section-title">Statistiky tento měsíc</div>
          <div className="dashboard-stats-row">
            <div className="dashboard-stat">
              <div className="dashboard-stat-num">—</div>
              <div className="dashboard-stat-label">Zobrazení</div>
            </div>
            <div className="dashboard-stat">
              <div className="dashboard-stat-num">—</div>
              <div className="dashboard-stat-label">Bookingy</div>
            </div>
            <div className="dashboard-stat">
              <div className="dashboard-stat-num">—</div>
              <div className="dashboard-stat-label">Hodnocení</div>
            </div>
          </div>
        </div>

        {(pending.pendingPhotos > 0 || pending.pendingReviews > 0) && (
          <div className="pending-tasks">
            <div className="studio-section-title">Pending</div>
            {pending.pendingPhotos > 0 && (
              <div className="pending-task-item">
                ⚠ {pending.pendingPhotos} {pending.pendingPhotos === 1 ? 'fotka čeká' : 'fotek čeká'} na schválení
              </div>
            )}
            {pending.pendingReviews > 0 && (
              <div className="pending-task-item">
                ⚠ {pending.pendingReviews} {pending.pendingReviews === 1 ? 'nová recenze' : 'nové recenze'} ke schválení
              </div>
            )}
          </div>
        )}

        <div className="quick-actions-section">
          <div className="studio-section-title">Rychlé akce</div>
          <div className="quick-actions-row">
            <a href={`/${locale}/studio/zakladni`} className="quick-action-btn">👤 Editovat profil</a>
            <a href={`/${locale}/studio/dostupnost`} className="quick-action-btn">📅 Dostupnost</a>
            <a href={`/${locale}/studio/profil-status`} className="quick-action-btn">🟢 Status</a>
          </div>
        </div>
      </div>
    </>
  );
}
