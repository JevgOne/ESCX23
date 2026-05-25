import { setRequestLocale } from 'next-intl/server';
import { getBookings } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_COLORS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Čeká',     color: '#f59e0b' },
  confirmed: { label: 'Potvrzena', color: '#22c55e' },
  completed: { label: 'Dokončena', color: '#6b7280' },
  cancelled: { label: 'Zrušena',  color: '#ef4444' },
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬',
  telegram: '✈️',
  call:     '📞',
  sms:      '📱',
};

export default async function AdminRezervacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  setRequestLocale(locale);

  const bookings = await getBookings(status);

  return (
    <>
      <AdminTopbar title="Rezervace" />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              background: (status === s || (!status && s === 'all')) ? 'var(--color-gold)' : 'var(--color-surface)',
              color: (status === s || (!status && s === 'all')) ? '#000' : 'var(--color-text-dim)',
              border: '1px solid var(--color-border)',
            }}
          >
            {s === 'all' ? 'Vše' : (STATUS_COLORS[s]?.label ?? s)}
          </a>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--color-text-dim)',
          fontSize: '14px',
          border: '1px dashed var(--color-border)',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>
            Žádné rezervace
          </div>
          <div style={{ fontSize: '13px', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
            Booking webhook integration coming in Sprint 4.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Dívka</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Kanál</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Kontakt</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Datum</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Čas</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const st = STATUS_COLORS[b.status] ?? { label: b.status, color: '#6b7280' };
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {b.girlPhoto && (
                          <img
                            src={photoUrl(b.girlPhoto)}
                            alt={b.girlName ?? ''}
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <span style={{ fontWeight: 500 }}>{b.girlName ?? `#${b.girlId}`}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '18px' }}>
                      {b.channel ? (CHANNEL_ICONS[b.channel] ?? b.channel) : '—'}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-dim)' }}>
                      {b.clientContact ?? '—'}
                    </td>
                    <td style={{ padding: '12px', fontVariantNumeric: 'tabular-nums' }}>
                      {b.proposedDate}
                    </td>
                    <td style={{ padding: '12px', fontVariantNumeric: 'tabular-nums' }}>
                      {b.startTime ? b.startTime.slice(0, 5) : '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: st.color + '22', color: st.color }}>
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
    </>
  );
}
