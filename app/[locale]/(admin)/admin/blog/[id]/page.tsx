import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { updateBlogPost, deleteBlogPost, uploadBlogCover } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BlogPostRow {
  id: number;
  slug: string;
  title_cs: string;
  title_en: string;
  excerpt_cs: string | null;
  excerpt_en: string | null;
  content_cs: string | null;
  content_en: string | null;
  meta_description_cs: string | null;
  meta_description_en: string | null;
  cover_url: string | null;
  author: string;
  status: string;
  reading_time_min: number;
  published_at: string | null;
}

interface TagRow {
  id: number;
  slug: string;
  name_cs: string;
}

export default async function AdminEditBlogPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute({ sql: 'SELECT * FROM blog_posts WHERE id=?', args: [Number(id)] });
  if (result.rows.length === 0) notFound();
  const post = result.rows[0] as unknown as BlogPostRow;

  // All tags
  const tagResult = await db.execute('SELECT id, slug, name_cs FROM blog_tags ORDER BY name_cs ASC');
  const allTags = tagResult.rows as unknown as TagRow[];

  // Post's assigned tags
  const assignedResult = await db.execute({
    sql: 'SELECT tag_id FROM blog_post_tags WHERE post_id = ?',
    args: [post.id],
  });
  const assignedTagIds = new Set(assignedResult.rows.map((r) => Number(r.tag_id)));

  return (
    <>
      <AdminTopbar title={`Blog: ${post.title_cs.slice(0, 50)}…`} />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/blog" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na seznam
        </a>
      </div>

      {/* Cover image upload */}
      <fieldset style={{ marginBottom: '24px' }}>
        <legend>Úvodní fotka (cover)</legend>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{
            width: 200, height: 120, borderRadius: 8, overflow: 'hidden',
            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
          }}>
            {post.cover_url ? (
              <img src={post.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--color-text-dim)', fontSize: '13px',
              }}>
                Bez fotky
              </div>
            )}
          </div>
          <form action={uploadBlogCover} style={{ flex: 1 }}>
            <input type="hidden" name="id" value={post.id} />
            <div className="admin-form-field" style={{ marginBottom: '8px' }}>
              <input type="file" name="cover" accept="image/jpeg,image/png,image/webp" required />
            </div>
            <button type="submit" className="admin-btn-submit" style={{ fontSize: '13px', padding: '6px 16px' }}>
              Nahrát cover
            </button>
          </form>
        </div>
      </fieldset>

      <form action={updateBlogPost} className="admin-form">
        <input type="hidden" name="id" value={post.id} />

        <fieldset>
          <legend>Základní info</legend>
          <div className="admin-form-row">
            <div className="admin-form-field" style={{ flex: 2 }}>
              <label htmlFor="slug">Slug *</label>
              <input id="slug" name="slug" type="text" required defaultValue={post.slug}
                style={{ fontFamily: 'monospace', fontSize: '13px' }} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={post.status}>
                <option value="draft">Koncept</option>
                <option value="published">Publikováno</option>
                <option value="archived">Archiv</option>
              </select>
            </div>
            <div className="admin-form-field">
              <label htmlFor="reading_time_min">Čtení (min)</label>
              <input id="reading_time_min" name="reading_time_min" type="number" min="1" max="60"
                defaultValue={post.reading_time_min} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="author">Autor</label>
              <input id="author" name="author" type="text" defaultValue={post.author} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="published_at">Datum publikace</label>
              <input id="published_at" name="published_at" type="datetime-local"
                defaultValue={post.published_at ? post.published_at.replace(' ', 'T').slice(0, 16) : ''} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Titulek</legend>
          <div className="admin-form-field">
            <label htmlFor="title_cs">CS *</label>
            <input id="title_cs" name="title_cs" type="text" required defaultValue={post.title_cs} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="title_en">EN *</label>
            <input id="title_en" name="title_en" type="text" required defaultValue={post.title_en} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Excerpt (krátký popis)</legend>
          <div className="admin-form-field">
            <label htmlFor="excerpt_cs">CS</label>
            <textarea id="excerpt_cs" name="excerpt_cs" rows={2} defaultValue={post.excerpt_cs ?? ''} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="excerpt_en">EN</label>
            <textarea id="excerpt_en" name="excerpt_en" rows={2} defaultValue={post.excerpt_en ?? ''} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Meta description (SEO)</legend>
          <div className="admin-form-field">
            <label htmlFor="meta_description_cs">CS</label>
            <textarea id="meta_description_cs" name="meta_description_cs" rows={2}
              defaultValue={post.meta_description_cs ?? ''} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="meta_description_en">EN</label>
            <textarea id="meta_description_en" name="meta_description_en" rows={2}
              defaultValue={post.meta_description_en ?? ''} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Obsah (HTML)</legend>
          <div className="admin-form-field">
            <label htmlFor="content_cs">CS</label>
            <textarea id="content_cs" name="content_cs" rows={16} defaultValue={post.content_cs ?? ''}
              style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="content_en">EN</label>
            <textarea id="content_en" name="content_en" rows={16} defaultValue={post.content_en ?? ''}
              style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Tagy</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {allTags.map((tag) => (
              <label key={tag.id} className="admin-checkbox-label" style={{ fontSize: '13px' }}>
                <input type="checkbox" name="tag_ids" value={tag.id}
                  defaultChecked={assignedTagIds.has(tag.id)} />
                {tag.name_cs}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Uložit změny</button>
          <a href="/cs/admin/blog" className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>

      <div style={{ marginTop: '48px', padding: '20px', border: '1px solid var(--color-red)', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-red)', marginBottom: '12px' }}>
          Nebezpečná zóna
        </div>
        <form action={deleteBlogPost}>
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className="danger-btn">Smazat tento článek</button>
        </form>
      </div>
    </>
  );
}
