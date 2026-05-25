import { setRequestLocale } from 'next-intl/server';
import { getStoriesForAdmin } from '@/lib/queries';
import { relativeTime } from '@/lib/utils';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { approveStory, expireStory, deleteStory, createCategoryStory } from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  live:    { label: 'LIVE',    color: '#22c55e' },
  pending: { label: 'PENDING', color: '#f59e0b' },
  expired: { label: 'EXPIRED', color: '#6b7280' },
};

const CATEGORY_LABELS: Record<string, string> = {
  NEW_THIS_WEEK:     'Nové tento týden',
  MEMBERS_CIRCLE:    'Members Circle',
  AVAILABLE_TONIGHT: 'Dnes k dispozici',
  PROMO:             'Promo',
  TRAVEL:            'Travel',
};

function bgIcon(mediaType: string, bgType: string | null) {
  const t = bgType ?? mediaType;
  if (t === 'VIDEO' || mediaType === 'video') return '🎬';
  if (t === 'COLOR') return '🎨';
  return '📷';
}

function expiresLabel(expiresAt: string | null): string {
  if (!expiresAt) return '—';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff < 0) return 'vypršelo';
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `za ${d} d`;
  }
  if (h > 0) return `za ${h}h ${m}m`;
  return `za ${m}m`;
}

function defaultExpiry() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export default async function AdminStoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; form?: string }>;
}) {
  const { locale } = await params;
  const { status, form } = await searchParams;
  setRequestLocale(locale);

  const stories = await getStoriesForAdmin(status);

  const counts = {
    all: (await getStoriesForAdmin()).length,
    live: (await getStoriesForAdmin('live')).length,
    pending: (await getStoriesForAdmin('pending')).length,
    expired: (await getStoriesForAdmin('expired')).length,
  };

  const showForm = form === '1';

  return (
    <>
      <AdminTopbar title="Stories" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['all', 'live', 'pending', 'expired'] as const).map((s) => (
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
              {s === 'all' ? 'Vše' : s.toUpperCase()} ({counts[s]})
            </a>
          ))}
        </div>
        <a
          href="?form=1"
          style={{
            padding: '8px 16px',
            background: 'var(--color-gold)',
            color: '#000',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          + Nová admin story
        </a>
      </div>

      {showForm && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Nová admin story (kategorie)</h3>
          <form action={createCategoryStory} style={{ display: 'grid', gap: '12px', maxWidth: '520px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>Kategorie *</label>
              <select name="category" required style={{ width: '100%', padding: '8px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'inherit', fontSize: '13px' }}>
                <option value="NEW_THIS_WEEK">Nové tento týden</option>
                <option value="MEMBERS_CIRCLE">Members Circle</option>
                <option value="AVAILABLE_TONIGHT">Dnes k dispozici</option>
                <option value="PROMO">Promo</option>
                <option value="TRAVEL">Travel</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>Typ pozadí</label>
              <select name="bg_type" style={{ width: '100%', padding: '8px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'inherit', fontSize: '13px' }}>
                <option value="PHOTO">📷 Foto</option>
                <option value="COLOR">🎨 Barva/Gradient</option>
                <option value="VIDEO">🎬 Video</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>URL pozadí (foto / video / CSS gradient) *</label>
              <input
                type="text"
                name="media_url"
                required
                placeholder="https://... nebo linear-gradient(...)"
                style={{ width: '100%', padding: '8px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'inherit', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>Caption (max 100 znaků)</label>
              <textarea
                name="caption"
                maxLength={100}
                rows={2}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'inherit', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>Expirace</label>
              <input
                type="datetime-local"
                name="expires_at"
                defaultValue={defaultExpiry()}
                style={{ padding: '8px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'inherit', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
              <button type="submit" style={{ padding: '8px 20px', background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                Vytvořit
              </button>
              <a href="?" style={{ padding: '8px 16px', color: 'var(--color-text-dim)', fontSize: '13px', textDecoration: 'none', alignSelf: 'center' }}>Zrušit</a>
            </div>
          </form>
        </div>
      )}

      {stories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-dim)', fontSize: '14px' }}>
          Žádné stories{status && status !== 'all' ? ` se stavem ${status.toUpperCase()}` : ''}.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Typ</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Caption</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Dívka / Kategorie</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Zobrazení</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Expiruje</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Akce</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((s) => {
                const statusInfo = STATUS_LABELS[s.status] ?? { label: s.status.toUpperCase(), color: '#6b7280' };
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px', fontSize: '18px' }}>
                      {bgIcon(s.mediaType, s.bgType)}
                    </td>
                    <td style={{ padding: '12px', maxWidth: '180px', color: s.caption ? 'inherit' : 'var(--color-text-dim)' }}>
                      {s.caption ? (s.caption.length > 40 ? s.caption.slice(0, 40) + '…' : s.caption) : '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {s.girlId === 0
                        ? <span style={{ background: 'rgba(var(--color-gold-rgb,212,175,55),0.15)', color: 'var(--color-gold)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            {s.category ? (CATEGORY_LABELS[s.category] ?? s.category) : 'Admin story'}
                          </span>
                        : <span>{s.girlName ?? `#${s.girlId}`}</span>
                      }
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {s.viewsCount}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--color-text-dim)', fontSize: '12px' }}>
                      {expiresLabel(s.expiresAt)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: statusInfo.color + '22', color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {s.status === 'pending' && (
                          <form action={approveStory} style={{ display: 'inline' }}>
                            <input type="hidden" name="id" value={s.id} />
                            <button type="submit" style={{ padding: '4px 10px', fontSize: '11px', background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                              Schválit
                            </button>
                          </form>
                        )}
                        {s.status === 'live' && (
                          <form action={expireStory} style={{ display: 'inline' }}>
                            <input type="hidden" name="id" value={s.id} />
                            <button type="submit" style={{ padding: '4px 10px', fontSize: '11px', background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                              Ukončit
                            </button>
                          </form>
                        )}
                        <form action={deleteStory} style={{ display: 'inline' }}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" style={{ padding: '4px 10px', fontSize: '11px', background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                            Smazat
                          </button>
                        </form>
                      </div>
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
