import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { db } from '@/lib/db';
import { HASHTAGS } from '@/lib/hashtags';
import { updateGirlHashtags } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CATEGORY_LABELS: Record<string, string> = {
  appearance: 'Vzhled',
  body: 'Postava',
  age: 'Věk',
  profession: 'Profese',
  origin: 'Původ',
  style: 'Styl',
};

const CATEGORY_ORDER = ['appearance', 'body', 'age', 'profession', 'origin', 'style'];

export default async function StudioHashtagyPage({
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

  const girlRes = await db.execute({
    sql: `SELECT hashtags FROM girls WHERE id = ?`,
    args: [girlId],
  });

  let activeSlugs: Set<string> = new Set();
  if (girlRes.rows[0]?.hashtags) {
    try {
      const parsed = JSON.parse(String(girlRes.rows[0].hashtags));
      if (Array.isArray(parsed)) activeSlugs = new Set(parsed);
    } catch { /* invalid JSON — ignore */ }
  }

  // Group hashtags by category
  const grouped = new Map<string, typeof HASHTAGS>();
  for (const h of HASHTAGS) {
    if (!grouped.has(h.category)) grouped.set(h.category, []);
    grouped.get(h.category)!.push(h);
  }

  return (
    <>
      <StudioTopbar title="Hashtagy" />

      <div className="studio-content">
        {sp.saved === '1' && (
          <div className="studio-alert studio-alert-ok">Hashtagy uloženy!</div>
        )}

        <p style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '24px' }}>
          Vyber hashtagy, pod kterými tě klienti najdou. Zobrazí se na tvém profilu.
        </p>

        <form action={updateGirlHashtags} className="studio-form-wrap" style={{ maxWidth: 720 }}>
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat);
            if (!items || items.length === 0) return null;
            return (
              <div key={cat} className="studio-services-group">
                <h3 className="studio-services-cat">{CATEGORY_LABELS[cat] ?? cat}</h3>
                <div className="studio-services-grid">
                  {items.map((h) => (
                    <label key={h.id} className={`studio-service-chip${activeSlugs.has(h.id) ? ' active' : ''}`}>
                      <input
                        type="checkbox"
                        name="hashtag_slugs"
                        value={h.id}
                        defaultChecked={activeSlugs.has(h.id)}
                      />
                      <span className="studio-service-name">{h.translations.cs}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <button type="submit" className="btn btn-pink" style={{ marginTop: 24 }}>
            Uložit hashtagy
          </button>
        </form>
      </div>
    </>
  );
}
