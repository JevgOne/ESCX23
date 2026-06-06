import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { db } from '@/lib/db';
import { addStory } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioStoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;

  const result = await db.execute({
    sql: `SELECT id, media_url, media_type, views_count, created_at, expires_at,
            CASE WHEN expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP THEN 1 ELSE 0 END AS expired
          FROM stories WHERE girl_id = ?
          ORDER BY created_at DESC LIMIT 20`,
    args: [girlId],
  });

  const stories = result.rows.map((r) => ({
    id: Number(r.id),
    mediaUrl: String(r.media_url),
    mediaType: String(r.media_type) as 'image' | 'video',
    views: Number(r.views_count ?? 0),
    createdAt: String(r.created_at),
    expiresAt: r.expires_at ? String(r.expires_at) : null,
    expired: Number(r.expired) === 1,
  }));

  const activeCount = stories.filter((s) => !s.expired).length;

  return (
    <>
      <StudioTopbar title={`Stories (${activeCount} aktivních)`} />

      <div className="studio-content">
        {sp.saved === '1' && (
          <div className="studio-alert studio-alert-ok">Story přidána!</div>
        )}
        <div className="studio-stories-upload">
          <h3 className="studio-section-title" style={{ marginBottom: 12 }}>Přidat novou story</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16 }}>
            Nahraj fotku nebo video. Story bude viditelná 24 hodin na homepage.
          </p>
          <form action={addStory} className="studio-stories-form">
            <div className="studio-stories-form-row">
              <label className="studio-label">URL média</label>
              <input
                type="url"
                name="media_url"
                placeholder="https://... (odkaz na fotku nebo video)"
                required
                className="studio-input"
              />
            </div>
            <div className="studio-stories-form-row">
              <label className="studio-label">Typ</label>
              <select name="media_type" className="studio-input" defaultValue="image">
                <option value="image">Fotka</option>
                <option value="video">Video</option>
              </select>
            </div>
            <button type="submit" className="btn btn-pink btn-sm" style={{ marginTop: 8 }}>
              Přidat story
            </button>
          </form>
        </div>

        {stories.length === 0 ? (
          <div className="studio-empty" style={{ paddingTop: 40 }}>
            <p>Zatím nemáš žádné stories.</p>
          </div>
        ) : (
          <div className="studio-stories-grid">
            {stories.map((story) => (
              <div key={story.id} className={`studio-story-card${story.expired ? ' expired' : ''}`}>
                {story.mediaType === 'image' ? (
                  <img src={story.mediaUrl} alt="" className="studio-story-thumb" />
                ) : (
                  <div className="studio-story-video-badge">Video</div>
                )}
                <div className="studio-story-info">
                  <span className="studio-story-views">{story.views} zhlédnutí</span>
                  {story.expired && <span className="studio-story-expired">Expirovaná</span>}
                  {!story.expired && <span className="studio-story-live">Aktivní</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
