import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { db } from '@/lib/db';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Čeká',      color: '#f59e0b' },
  confirmed: { label: 'Potvrzena', color: '#22c55e' },
  completed: { label: 'Dokončena', color: '#6b7280' },
  cancelled: { label: 'Zrušena',   color: '#ef4444' },
};

export default async function StudioRezervacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;

  const result = await db.execute({
    sql: `SELECT id, date, start_time, status, communication_type, created_at
          FROM bookings
          WHERE girl_id = ?
          ORDER BY created_at DESC
          LIMIT 50`,
    args: [girlId],
  });

  const bookings = result.rows.map((r) => ({
    id: Number(r.id),
    date: String(r.date),
    startTime: r.start_time ? String(r.start_time) : null,
    status: String(r.status ?? 'pending'),
    channel: r.communication_type ? String(r.communication_type) : null,
    createdAt: String(r.created_at),
  }));

  return (
    <>
      <StudioTopbar title={`Rezervace (${bookings.length})`} />

      <div className="studio-content">
        {bookings.length === 0 ? (
          <div className="studio-empty">
            <div className="studio-empty-icon">📅</div>
            <p>Zatím nemáš žádné rezervace.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-dim)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Datum</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Čas</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Kanál</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const st = STATUS_LABELS[b.status] ?? { label: b.status, color: '#6b7280' };
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontVariantNumeric: 'tabular-nums' }}>
                        {b.date}
                      </td>
                      <td style={{ padding: '12px', fontVariantNumeric: 'tabular-nums' }}>
                        {b.startTime ? b.startTime.slice(0, 5) : '—'}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--color-text-dim)' }}>
                        {b.channel ?? '—'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: st.color + '22',
                          color: st.color,
                        }}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
