import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { db } from '@/lib/db';
import { toCalendarEmbedUrl } from '@/lib/calendar';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioKalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;

  const res = await db.execute({
    sql: `SELECT calendar_embed_url FROM girls WHERE id = ?`,
    args: [girlId],
  });
  const rawUrl = res.rows[0]?.calendar_embed_url
    ? String(res.rows[0].calendar_embed_url)
    : null;
  const calendarUrl = rawUrl ? toCalendarEmbedUrl(rawUrl) : null;

  return (
    <>
      <StudioTopbar title="Kalendář" />

      <div className="studio-content">
        {calendarUrl ? (
          <div className="studio-calendar-wrap">
            <iframe
              src={calendarUrl}
              className="studio-calendar-iframe"
              title="Google Calendar"
            />
          </div>
        ) : (
          <div className="studio-empty">
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <p>Kalendář zatím není nastaven.</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-dim)', marginTop: 8 }}>
              Odkaz na tvůj Google kalendář nastaví agentura.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
