import { setRequestLocale } from 'next-intl/server';
import { getStoriesForAdmin } from '@/lib/queries';
import { db } from '@/lib/db';
import { relativeTime } from '@/lib/utils';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { approveStory, expireStory, deleteStory, createStory } from '@/lib/admin-actions';
import { photoUrl } from '@/lib/photoUrl';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  live: '#22c55e',
  pending: '#f59e0b',
  expired: '#6b7280',
};

function expiresLabel(expiresAt: string | null): string {
  if (!expiresAt) return '—';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff < 0) return 'vypršelo';
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (h >= 24) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function defaultExpiry() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export default async function AdminStoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; form?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { status, form, error } = await searchParams;
  setRequestLocale(locale);

  const stories = await getStoriesForAdmin(status);

  const counts = {
    all: (await getStoriesForAdmin()).length,
    live: (await getStoriesForAdmin('live')).length,
    pending: (await getStoriesForAdmin('pending')).length,
    expired: (await getStoriesForAdmin('expired')).length,
  };

  // Girls for dropdown
  const girlsResult = await db.execute({
    sql: `SELECT id, name FROM girls WHERE status IN ('active','inactive') ORDER BY name`,
    args: [],
  });
  const girls = girlsResult.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
  }));

  const showForm = form === '1';

  const errorMessages: Record<string, string> = {
    nofile: 'Nahrajte soubor (fotku nebo video).',
    toolarge: 'Soubor je příliš velký (max 50 MB).',
    badtype: 'Nepodporovaný formát. Povolené: JPG, PNG, WebP, MP4, MOV, WebM.',
  };

  return (
    <>
      <AdminTopbar title="Stories" />

      {/* Status filter tabs */}
      <div className="stories-toolbar">
        <div className="stories-tabs">
          {(['all', 'live', 'pending', 'expired'] as const).map((s) => (
            <a
              key={s}
              href={`?status=${s}`}
              className={`stories-tab${(status === s || (!status && s === 'all')) ? ' active' : ''}`}
            >
              <span className="stories-tab-dot" style={{ background: s === 'all' ? 'var(--color-text-dim)' : STATUS_COLORS[s] }} />
              {s === 'all' ? 'Vše' : s === 'live' ? 'Live' : s === 'pending' ? 'Čeká' : 'Vypršené'}
              <span className="stories-tab-count">{counts[s]}</span>
            </a>
          ))}
        </div>
        <a href="?form=1" className="stories-new-btn">+ Nová story</a>
      </div>

      {/* Error messages */}
      {error && errorMessages[error] && (
        <div className="stories-error">{errorMessages[error]}</div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="stories-form-card">
          <h3 className="stories-form-title">Nová story</h3>
          <form action={createStory} encType="multipart/form-data" className="stories-form">
            <div className="stories-form-row">
              <div className="stories-field">
                <label className="stories-label">Dívka</label>
                <select name="girl_id" className="stories-select">
                  <option value="0">— Admin story (LovelyGirls) —</option>
                  {girls.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="stories-field">
                <label className="stories-label">Expirace</label>
                <input
                  type="datetime-local"
                  name="expires_at"
                  defaultValue={defaultExpiry()}
                  className="stories-input"
                />
              </div>
            </div>

            <div className="stories-field">
              <label className="stories-label">Fotka nebo video</label>
              <label className="stories-upload-zone">
                <input type="file" name="media" accept="image/*,video/*" required className="stories-file-input" />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Klikněte pro nahrání nebo přetáhněte soubor</span>
                <span className="stories-upload-hint">JPG, PNG, WebP, MP4, MOV, WebM · max 50 MB</span>
              </label>
            </div>

            <div className="stories-form-actions">
              <button type="submit" className="stories-submit">Vytvořit story</button>
              <a href="?" className="stories-cancel">Zrušit</a>
            </div>
          </form>
        </div>
      )}

      {/* Stories list */}
      {stories.length === 0 ? (
        <div className="stories-empty">
          <span className="stories-empty-icon">📷</span>
          <p>Žádné stories{status && status !== 'all' ? ` se stavem "${status}"` : ''}.</p>
          <a href="?form=1" className="stories-empty-cta">Vytvořit první story →</a>
        </div>
      ) : (
        <div className="stories-grid">
          {stories.map((s) => {
            const statusColor = STATUS_COLORS[s.status] ?? '#6b7280';
            return (
              <div key={s.id} className="story-card">
                <div className="story-card-media">
                  {s.mediaType === 'video' ? (
                    <video src={s.mediaUrl} className="story-card-thumb" muted preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.mediaUrl} alt="" className="story-card-thumb" />
                  )}
                  <span className="story-card-type">{s.mediaType === 'video' ? '🎬' : '📷'}</span>
                  <span className="story-card-status" style={{ background: statusColor + '22', color: statusColor, borderColor: statusColor + '44' }}>
                    {s.status.toUpperCase()}
                  </span>
                </div>
                <div className="story-card-info">
                  <div className="story-card-name">
                    {s.girlName ?? 'LovelyGirls'}
                  </div>
                  <div className="story-card-meta">
                    <span>{relativeTime(s.createdAt)}</span>
                    <span>·</span>
                    <span>{s.viewsCount} views</span>
                    <span>·</span>
                    <span>{expiresLabel(s.expiresAt)}</span>
                  </div>
                  <div className="story-card-actions">
                    {s.status === 'pending' && (
                      <form action={approveStory} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="story-action-btn approve">Schválit</button>
                      </form>
                    )}
                    {s.status === 'live' && (
                      <form action={expireStory} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="story-action-btn expire">Ukončit</button>
                      </form>
                    )}
                    <form action={deleteStory} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="story-action-btn delete">Smazat</button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
